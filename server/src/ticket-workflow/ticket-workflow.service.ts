import { getPrisma } from '../prisma.js';
import { TicketStatus, User } from '@prisma/client';
import { findTransition, isLockedStatus } from '../utils/statusTransitions.js';
import { ServiceError } from '../actions-taken/actions-taken.service.js';
import crypto from 'crypto';

const generateStatusRequestHash = (ticketId: number, status: string, version?: number) => {
  const data = JSON.stringify({ ticketId, status, version: version ?? null });
  return crypto.createHash('sha256').update(data).digest('hex');
};

export const changeTicketStatus = async (
  ticketId: number,
  newStatus: TicketStatus,
  user: NonNullable<Express.Request['user']>,
  version?: number,
  idempotencyKey?: string,
  endpoint: string = "POST /api/tickets/:id/status"
) => {
  const prisma = getPrisma();
  const requestHash = generateStatusRequestHash(ticketId, newStatus, version);

  if (idempotencyKey) {
    await prisma.idempotencyKey.deleteMany({
      where: {
        userId: user.id,
        endpoint,
        key: idempotencyKey,
        expiresAt: { lte: new Date() }
      }
    });

    const existingKey = await prisma.idempotencyKey.findUnique({
      where: {
        userId_endpoint_key: { userId: user.id, endpoint, key: idempotencyKey }
      }
    });

    if (existingKey) {
      if (existingKey.requestHash === requestHash) {
        return { ticket: existingKey.responseBody, replayed: true };
      } else {
        throw new ServiceError(422, "IDEMPOTENCY_KEY_REUSED", "Idempotency key reused with different body");
      }
    }
  }

  // Pre-flight checks
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) {
    throw new ServiceError(404, "NOT_FOUND", "Ticket not found");
  }

  if (version !== undefined && ticket.version !== version) {
    throw new ServiceError(409, "CONFLICT", "The ticket was modified by another user.", { currentVersion: ticket.version });
  }

  if (isLockedStatus(ticket.status)) {
    throw new ServiceError(422, "INVALID_TRANSITION", `Ticket is locked in ${ticket.status}`);
  }

  const rule = findTransition(ticket.status, newStatus);
  if (!rule) {
    throw new ServiceError(422, "INVALID_TRANSITION", `Invalid transition from ${ticket.status} to ${newStatus}`);
  }

  if (!rule.roles.includes(user.role)) {
    throw new ServiceError(403, "FORBIDDEN", `Role ${user.role} is not allowed to transition from ${ticket.status} to ${newStatus}`);
  }

  if (user.role === 'REQUESTER' && rule.requesterOwnOnly && ticket.requesterId !== user.id) {
    throw new ServiceError(403, "FORBIDDEN", "Requester can only transition their own tickets");
  }

  if (rule.gated) {
    if (!ticket.ownerId) {
      throw new ServiceError(422, "RESOLUTION_GATE_FAILED", "Ticket cannot be resolved: no owner assigned");
    }
    const actions = await prisma.actionTaken.findMany({ where: { ticketId } });
    const hasNonEmptyResult = actions.some(a => a.result && a.result.trim().length > 0);
    if (!hasNonEmptyResult) {
      throw new ServiceError(422, "RESOLUTION_GATE_FAILED", "Ticket cannot be resolved: no action taken has a valid result");
    }
  }

  try {
    const { updatedTicket } = await prisma.$transaction(async (tx) => {
      // Version-protected conditional update
      const whereClause: any = { id: ticketId };
      if (version !== undefined) {
        whereClause.version = version;
      }

      const updated = await tx.ticket.update({
        where: whereClause,
        data: {
          status: newStatus,
          version: { increment: 1 },
          requesterMarkedResolvedAt: null
        }
      });

      await tx.ticketStatusHistory.create({
        data: {
          ticketId,
          fromStatus: ticket.status,
          toStatus: newStatus,
          changedById: user.id,
          changedAt: new Date()
        }
      });

      if (idempotencyKey) {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);
        
        await tx.idempotencyKey.create({
          data: {
            userId: user.id,
            endpoint,
            key: idempotencyKey,
            requestHash,
            responseStatus: 200,
            responseBody: updated as any,
            expiresAt
          }
        });
      }

      return { updatedTicket: updated };
    });

    return { ticket: updatedTicket, replayed: false };
  } catch (err: any) {
    if (err.code === "P2002" && idempotencyKey) {
      const existingKey = await prisma.idempotencyKey.findUnique({
        where: { userId_endpoint_key: { userId: user.id, endpoint, key: idempotencyKey } }
      });
      if (existingKey) {
        if (existingKey.requestHash === requestHash) {
          return { ticket: existingKey.responseBody, replayed: true };
        } else {
          throw new ServiceError(422, "IDEMPOTENCY_KEY_REUSED", "Idempotency key reused with different body");
        }
      }
    }
    if (err.code === "P2025") {
      const current = await prisma.ticket.findUnique({ where: { id: ticketId } });
      if (current) {
        throw new ServiceError(409, "CONFLICT", "The ticket was modified by another user.", { currentVersion: current.version });
      }
      throw new ServiceError(404, "NOT_FOUND", "Ticket not found");
    }
    throw err;
  }
};
