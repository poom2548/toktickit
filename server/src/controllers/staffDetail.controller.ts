import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { isTransitionPermitted, PERMITTED_TRANSITIONS } from '../utils/statusTransitions.js'

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
  const { ownerId } = req.body

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
        return res.status(422).json({ error: 'User not found.' })
      }
      if (!assignee.isActive) {
        return res.status(422).json({ error: 'Cannot assign an inactive user as Ticket Owner.' })
      }
      if (assignee.role === 'REQUESTER') {
        return res.status(422).json({ error: 'Cannot assign a Requester as Ticket Owner. Only active IT Staff or Administrators may be owners.' })
      }
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found.' })
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: { ownerId },
      include: {
        owner: { select: { id: true, name: true, role: true } },
      },
    })

    return res.status(200).json(updated)
  } catch (err) {
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
  const { status: newStatus } = req.body

  if (!newStatus || !VALID_STATUSES.includes(newStatus)) {
    return res.status(400).json({
      error: `Invalid status value. Valid values: ${VALID_STATUSES.join(', ')}.`,
    })
  }

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, status: true },
    })

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found.' })
    }

    if (!isTransitionPermitted(ticket.status, newStatus)) {
      const allowed = PERMITTED_TRANSITIONS[ticket.status] ?? []
      return res.status(422).json({
        error: `Status transition from "${ticket.status}" to "${newStatus}" is not permitted.`,
        currentStatus: ticket.status,
        permittedTransitions: allowed,
      })
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: { status: newStatus },
      select: { id: true, status: true, updatedAt: true },
    })

    return res.status(200).json(updated)
  } catch (err) {
    console.error('Update ticket status error:', err)
    return res.status(500).json({ error: 'An unexpected error occurred.' })
  }
}
