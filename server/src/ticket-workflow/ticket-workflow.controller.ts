import { Request, Response, NextFunction } from 'express';
import { getPrisma } from '../prisma.js';
import { changeTicketStatus, serializeResolvedIndication } from './ticket-workflow.service.js';
import { ServiceError } from '../actions-taken/actions-taken.service.js';
import { getAllowedTransitions, isOpenNonNewStatus } from '../utils/statusTransitions.js';
import crypto from 'crypto';

const prisma = getPrisma();

export const authorizeTicketAccess = async (req: Request, res: Response, next: NextFunction) => {
  const ticketId = parseInt(req.params.id, 10);
  if (isNaN(ticketId)) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found' } });
  }

  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Authentication required' } });
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { owner: { select: { id: true, name: true } } }
  });

  if (!ticket) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found' } });
  }

  if (user.role === 'REQUESTER' && ticket.requesterId !== user.id) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied' } });
  }

  (req as any).ticket = ticket;
  next();
};

export const changeStatus = async (req: Request, res: Response) => {
  const ticketId = parseInt(req.params.id, 10);
  const { status, version } = req.body;
  const user = (req as any).user;
  const idempotencyKey = req.headers['idempotency-key'] as string | undefined;

  try {
    const { ticket, replayed } = await changeTicketStatus(ticketId, status, user, version, idempotencyKey);
    if (replayed) {
      res.set('Idempotent-Replayed', 'true');
    }
    return res.status(200).json(ticket);
  } catch (err: any) {
    if (err instanceof ServiceError) {
      return res.status(err.status).json({ error: { code: err.code, message: err.message, ...err.extra } });
    }
    console.error(err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
  }
};

export const getAllowed = async (req: Request, res: Response) => {
  const ticket = (req as any).ticket;
  const user = (req as any).user;

  try {
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
  const ticket = (req as any).ticket;
  const ticketId = ticket.id;
  const user = (req as any).user;
  const { problemAppearsResolved } = req.body;
  const idempotencyKey = req.headers['idempotency-key'] as string | undefined;

  if (user.role !== 'REQUESTER') {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only requesters can perform this action' } });
  }

  if (ticket.requesterId !== user.id) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You can only indicate resolution for your own tickets' } });
  }

  if (!isOpenNonNewStatus(ticket.status)) {
    return res.status(409).json({ error: { code: 'INVALID_TICKET_STATE', message: 'Ticket is not in a state that can be marked as resolved by requester' } });
  }

  const requestHash = crypto.createHash('sha256').update(JSON.stringify({ ticketId, problemAppearsResolved })).digest('hex');

  if (idempotencyKey) {
    await prisma.idempotencyKey.deleteMany({
      where: {
        userId: user.id,
        endpoint: "POST /api/tickets/:id/requester-resolved-indication",
        key: idempotencyKey,
        expiresAt: { lte: new Date() }
      }
    });

    const existingKey = await prisma.idempotencyKey.findUnique({
      where: {
        userId_endpoint_key: {
          userId: user.id,
          endpoint: "POST /api/tickets/:id/requester-resolved-indication",
          key: idempotencyKey
        }
      }
    });

    if (existingKey) {
      if (existingKey.requestHash === requestHash) {
        return res.status(200).set('Idempotent-Replayed', 'true').json(existingKey.responseBody);
      } else {
        return res.status(422).json({
          error: { code: 'IDEMPOTENCY_KEY_REUSED', message: 'Idempotency key reused with different body or ticket' }
        });
      }
    }
  }

  try {
    let resultTicket = ticket;

    if (problemAppearsResolved) {
      if (!ticket.problemAppearsResolved || !ticket.requesterMarkedResolvedAt) {
        resultTicket = await prisma.ticket.update({
          where: { id: ticketId },
          data: {
            problemAppearsResolved: true,
            requesterMarkedResolvedAt: ticket.requesterMarkedResolvedAt || new Date()
          },
          include: {
            owner: { select: { id: true, name: true } }
          }
        });
      }
    } else {
      if (ticket.problemAppearsResolved || ticket.requesterMarkedResolvedAt) {
        resultTicket = await prisma.ticket.update({
          where: { id: ticketId },
          data: {
            problemAppearsResolved: false,
            requesterMarkedResolvedAt: null
          },
          include: {
            owner: { select: { id: true, name: true } }
          }
        });
      }
    }

    const responsePayload = serializeResolvedIndication(resultTicket);

    if (idempotencyKey) {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      try {
        await prisma.idempotencyKey.create({
          data: {
            userId: user.id,
            endpoint: "POST /api/tickets/:id/requester-resolved-indication",
            key: idempotencyKey,
            requestHash,
            responseStatus: 200,
            responseBody: responsePayload as any,
            expiresAt
          }
        });
      } catch (err: any) {
        if (err.code === "P2002") {
          const dup = await prisma.idempotencyKey.findUnique({
            where: {
              userId_endpoint_key: {
                userId: user.id,
                endpoint: "POST /api/tickets/:id/requester-resolved-indication",
                key: idempotencyKey
              }
            }
          });
          if (dup && dup.requestHash === requestHash) {
            return res.status(200).set('Idempotent-Replayed', 'true').json(dup.responseBody);
          }
        }
        throw err;
      }
    }

    return res.status(200).json(responsePayload);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
  }
};
