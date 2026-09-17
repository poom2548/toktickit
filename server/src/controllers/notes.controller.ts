import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const MAX_NOTE_LENGTH = 2000

export async function postInternalNote(req: Request, res: Response): Promise<any> {
  const ticketId = parseInt(req.params.id, 10)
  if (isNaN(ticketId)) return res.status(400).json({ error: 'Invalid ID' })
  const authorId = req.user!.id
  const { content } = req.body

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(422).json({ error: 'Note content cannot be empty.' })
  }
  if (content.trim().length > MAX_NOTE_LENGTH) {
    return res.status(422).json({
      error: `Note must not exceed ${MAX_NOTE_LENGTH} characters.`,
    })
  }

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found.' })
  }

  try {
    const note = await prisma.internalNote.create({
      data: {
        ticketId,
        authorId,
        content: content.trim(),
      },
      include: {
        author: { select: { id: true, name: true, role: true } },
      },
    })
    return res.status(201).json(note)
  } catch (err) {
    console.error('Post internal note error:', err)
    return res.status(500).json({ error: 'An unexpected error occurred.' })
  }
}

export async function getInternalNotes(req: Request, res: Response): Promise<any> {
  const ticketId = parseInt(req.params.id, 10)
  if (isNaN(ticketId)) return res.status(400).json({ error: 'Invalid ID' })

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found.' })
  }

  try {
    const notes = await prisma.internalNote.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: { id: true, name: true, role: true } },
      },
    })
    return res.status(200).json({ notes })
  } catch (err) {
    console.error('Get internal notes error:', err)
    return res.status(500).json({ error: 'An unexpected error occurred.' })
  }
}
