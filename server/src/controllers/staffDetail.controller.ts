import { Request, Response } from 'express'
import { PrismaClient, TicketStatus } from '@prisma/client'
import { isLockedStatus, getAllowedTransitions } from '../utils/statusTransitions.js'
import { changeTicketStatus } from '../ticket-workflow/ticket-workflow.service.js'
import { ServiceError } from '../actions-taken/actions-taken.service.js'

const prisma = new PrismaClient()

export async function getStaffTicketDetail(req: Request, res: Response): Promise<any> {
  const ticketId = parseInt(req.params.id, 10)
  if (isNaN(ticketId)) return res.status(400).json({ error: 'Invalid ID' })

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        requester: {
          select: { id: true, name: true, email: true, role: true },
        },
        owner: {
          select: { id: true, name: true, email: true, role: true },
        },
        category: {
          select: { id: true, name: true },
        },
        publicComments: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { id: true, name: true, role: true } },
          },
        },
        internalNotes: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { id: true, name: true, role: true } },
          },
        },
        attachments: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true, filename: true, mimetype: true, size: true, createdAt: true,
          },
        },
      },
    })

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found.' })
    }

    return res.status(200).json(ticket)
  } catch (err) {
    console.error('Get staff ticket detail error:', err)
    return res.status(500).json({ error: 'An unexpected error occurred.' })
  }
}

export async function updateTicketOwner(req: Request, res: Response): Promise<any> {
  const ticketId = parseInt(req.params.id, 10)
  if (isNaN(ticketId)) return res.status(400).json({ error: 'Invalid ID' })
  const { ownerId, version } = req.body

  if (version !== undefined && !Number.isInteger(version)) {
    return res.status(422).json({
      error: { code: 'VALIDATION_FAILED', message: 'version must be an integer.' }
    })
  }

  if (ownerId !== null && typeof ownerId !== 'string') {
    return res.status(400).json({ error: 'ownerId must be a string (user ID) or null.' })
  }

  try {
    if (ownerId !== null) {
      const assignee = await prisma.user.findUnique({
        where: { id: ownerId },
        select: { id: true, role: true, isActive: true },
      })

      if (!assignee) {
        return res.status(422).json({ error: 'User not found.' }) // Lab 3 format
      }
      if (!assignee.isActive) {
        return res.status(422).json({ error: 'Cannot assign an inactive user as Ticket Owner.' }) // Lab 3 format
      }
      if (assignee.role === 'REQUESTER') {
        return res.status(422).json({ error: 'Cannot assign a Requester as Ticket Owner. Only active IT Staff or Administrators may be owners.' }) // Lab 3 format
      }
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found.' }) // Lab 3 format
    }

    if (isLockedStatus(ticket.status)) {
      return res.status(409).json({
        error: { code: 'TICKET_LOCKED', message: 'Ticket is locked.' } // Lab 4 format
      })
    }

    if (version !== undefined && ticket.version !== version) {
      return res.status(409).json({
        error: { code: 'CONFLICT', message: 'The ticket was modified by another user.', currentVersion: ticket.version } // Lab 4 format
      })
    }

    const whereClause: any = { id: ticketId };
    if (version !== undefined) {
      whereClause.version = version;
    }

    const updated = await prisma.ticket.update({
      where: whereClause,
      data: { 
        ownerId,
        version: { increment: 1 }
      },
      include: {
        owner: { select: { id: true, name: true, role: true } },
      },
    })

    return res.status(200).json(updated)
  } catch (err) {
    if (err instanceof Error && err.name === 'PrismaClientKnownRequestError' && (err as any).code === 'P2025') {
       const currentTicket = await prisma.ticket.findUnique({ where: { id: ticketId } })
       if (currentTicket && version !== undefined) {
         return res.status(409).json({
           error: { code: 'CONFLICT', message: 'The ticket was modified by another user.', currentVersion: currentTicket.version } // Lab 4 format
         })
       }
       return res.status(404).json({ error: 'Ticket not found.' })
    }
    console.error('Update ticket owner error:', err)
    return res.status(500).json({ error: 'An unexpected error occurred.' })
  }
}

const VALID_IT_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const

export async function updateTicketPriority(req: Request, res: Response): Promise<any> {
  const ticketId = parseInt(req.params.id, 10)
  if (isNaN(ticketId)) return res.status(400).json({ error: 'Invalid ID' })
  const { itPriority } = req.body

  if (itPriority !== null && !VALID_IT_PRIORITIES.includes(itPriority)) {
    return res.status(422).json({
      error: `Invalid itPriority value. Valid values: ${VALID_IT_PRIORITIES.join(', ')}.`,
    })
  }

  try {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found.' })
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: { itPriority },
      select: { id: true, itPriority: true, requestedPriority: true, status: true },
    })

    return res.status(200).json(updated)
  } catch (err) {
    console.error('Update ticket priority error:', err)
    return res.status(500).json({ error: 'An unexpected error occurred.' })
  }
}

const VALID_STATUSES = [
  'NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_REQUESTER',
  'RESOLVED', 'CLOSED', 'REOPENED', 'CANCELLED',
] as const

export async function updateTicketStatus(req: Request, res: Response): Promise<any> {
  const ticketId = parseInt(req.params.id, 10)
  if (isNaN(ticketId)) return res.status(400).json({ error: 'Invalid ID' })
  const { status: newStatus, version } = req.body

  if (!newStatus || !VALID_STATUSES.includes(newStatus)) {
    return res.status(400).json({
      error: `Invalid status value. Valid values: ${VALID_STATUSES.join(', ')}.`,
    })
  }

  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { ticket } = await changeTicketStatus(ticketId, newStatus as TicketStatus, user, version, undefined, "PATCH /staff/tickets/:id/status");
    return res.status(200).json({
      id: (ticket as any).id,
      status: (ticket as any).status,
      updatedAt: (ticket as any).updatedAt
    });
  } catch (err: any) {
    if (err instanceof ServiceError) {
      if (err.status === 422 && err.code === 'INVALID_TRANSITION') {
        const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
        const currentStatus = ticket?.status as TicketStatus;
        const permittedTransitions = currentStatus ? getAllowedTransitions(currentStatus, user.role, false) : [];
        return res.status(422).json({
          error: `Status transition from "${currentStatus}" to "${newStatus}" is not permitted.`,
          currentStatus,
          permittedTransitions
        });
      }
      if (err.status === 404) {
        return res.status(404).json({ error: 'Ticket not found.' });
      }
      if (err.status === 403) {
        return res.status(403).json({ error: err.message });
      }
      // Return Lab 4 envelope for other errors like CONFLICT and RESOLUTION_GATE_FAILED
      return res.status(err.status).json({
        error: { code: err.code, message: err.message, ...err.extra }
      });
    }
    console.error('Update ticket status error:', err)
    return res.status(500).json({ error: 'An unexpected error occurred.' })
  }
}
