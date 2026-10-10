import { Request, Response } from 'express';
import { getPrisma } from '../prisma.js';
import { changeTicketStatus } from './ticket-workflow.service.js';
import { ServiceError } from '../actions-taken/actions-taken.service.js';
import { TicketStatus, Role } from '@prisma/client';
import { getAllowedTransitions, isOpenNonNewStatus } from '../utils/statusTransitions.js';

const prisma = getPrisma();

export const changeStatus = async (req: Request, res: Response) => {
  const ticketId = parseInt(req.params.id, 10);
  const { status, version } = req.body;
  const user = (req as any).user;
  const idempotencyKey = req.headers['idempotency-key'] as string | undefined;

  try {
    const { ticket, replayed } = await changeTicketStatus(ticketId, status, user, version, idempotencyKey);
    return res.status(replayed ? 200 : 200).json(ticket);
  } catch (err: any) {
    if (err instanceof ServiceError) {
      return res.status(err.status).json({ error: { code: err.code, message: err.message, ...err.extra } });
    }
    console.error(err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
  }
};

export const getAllowed = async (req: Request, res: Response) => {
  const ticketId = parseInt(req.params.id, 10);
  const user = (req as any).user;

  try {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found' } });
    }
    const isTicketOwnerRequester = user.role === 'REQUESTER' && ticket.requesterId === user.id;
    const allowed = getAllowedTransitions(ticket.status, user.role, isTicketOwnerRequester);

    return res.status(200).json({
      currentStatus: ticket.status,
      version: ticket.version,
      allowedTransitions: allowed
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
  }
};

export const requesterResolvedIndication = async (req: Request, res: Response) => {
  const ticketId = parseInt(req.params.id, 10);
  const user = (req as any).user;

  if (user.role !== 'REQUESTER') {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only requesters can perform this action' } });
  }

  try {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found' } });
    }
    if (ticket.requesterId !== user.id) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You can only indicate resolution for your own tickets' } });
    }

    if (!isOpenNonNewStatus(ticket.status)) {
      return res.status(409).json({ error: { code: 'INVALID_TICKET_STATE', message: 'Ticket is not in a state that can be marked as resolved by requester' } });
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        requesterMarkedResolvedAt: ticket.requesterMarkedResolvedAt || new Date()
      }
    });

    return res.status(200).json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
  }
};
