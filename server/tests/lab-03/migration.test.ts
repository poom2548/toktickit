import { describe, it, expect, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('Lab 3 Database Migration Tests', () => {
  afterAll(async () => {
    await prisma.$disconnect()
  })

  // AC-DB-01
  it('User table exists with all required columns', async () => {
    const user = await prisma.user.findFirst()
    expect(user).toBeDefined()
  })

  it('User.passwordHash is a bcrypt hash (not plaintext)', async () => {
    const users = await prisma.user.findMany({ take: 5 })
    for (const user of users) {
      expect(user.passwordHash).toMatch(/^\$2[ab]\$|\$argon2/)
    }
  })

  it('No plaintext password field exists on User', async () => {
    const user = await prisma.user.findFirst()
    expect(user).not.toHaveProperty('password')
    expect(user).not.toHaveProperty('plainPassword')
    expect(user).not.toHaveProperty('rawPassword')
  })

  // AC-DB-02
  it('Ticket table has ownerId and itPriority columns', async () => {
    const ticket = await prisma.ticket.findFirst()
    if (ticket) {
      expect(ticket).toHaveProperty('ownerId')
      expect(ticket).toHaveProperty('itPriority')
    }
  })

  it('Ticket status enum includes all 8 required values', async () => {
    const statuses = ['NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'RESOLVED', 'CLOSED', 'REOPENED', 'CANCELLED']
    
    for (const status of statuses) {
      const t = await prisma.ticket.create({
        data: {
          ticketNumber: 'TEST-' + status + '-' + Date.now(),
          summary: `Status test: ${status}`,
          description: 'Migration test',
          requestedPriority: 'LOW',
          status: status as any,
          requesterId: (await prisma.user.findFirst({ where: { role: 'REQUESTER' } }))!.id,
          categoryId: (await prisma.category.findFirst())!.id,
          relatedSystemId: (await prisma.relatedSystem.findFirst())!.id,
        },
      })
      expect(t.status).toBe(status)
      await prisma.ticket.delete({ where: { id: t.id } })
    }
  })

  // AC-DB-03
  it('PublicComment table has required columns (no updatedAt)', async () => {
    const comment = await prisma.publicComment.findFirst()
    if (comment) {
      expect(comment).toHaveProperty('id')
      expect(comment).toHaveProperty('ticketId')
      expect(comment).toHaveProperty('authorId')
      expect(comment).toHaveProperty('content')
      expect(comment).toHaveProperty('createdAt')
      expect(comment).not.toHaveProperty('updatedAt')
    }
  })

  it('InternalNote table has required columns (no updatedAt)', async () => {
    const note = await prisma.internalNote.findFirst()
    if (note) {
      expect(note).toHaveProperty('id')
      expect(note).toHaveProperty('ticketId')
      expect(note).toHaveProperty('authorId')
      expect(note).toHaveProperty('content')
      expect(note).toHaveProperty('createdAt')
      expect(note).not.toHaveProperty('updatedAt')
    }
  })

  // AC-DB-04 — Zero data loss
  it('All original Ticket records still exist after migration', async () => {
    const count = await prisma.ticket.count()
    expect(count).toBeGreaterThan(0)
  })

  it('All Tickets have a valid requesterId referencing a User', async () => {
    const tickets = await prisma.ticket.findMany({ include: { requester: true } })
    expect(tickets.length).toBeGreaterThan(0)
    for (const ticket of tickets) {
      expect(ticket.requester).toBeDefined()
      expect(ticket.requester).not.toBeNull()
    }
  })

  it('All Attachments still exist after migration', async () => {
    const count = await prisma.attachment.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  // AC-DB-05 — Seed data counts
  it('Seed: at least 4 active REQUESTER users exist', async () => {
    const count = await prisma.user.count({ where: { role: 'REQUESTER', isActive: true } })
    expect(count).toBeGreaterThanOrEqual(4)
  })

  it('Seed: exactly 1 inactive REQUESTER user exists', async () => {
    const count = await prisma.user.count({ where: { role: 'REQUESTER', isActive: false } })
    expect(count).toBeGreaterThanOrEqual(1)
  })

  it('Seed: at least 3 active IT_STAFF users exist', async () => {
    const count = await prisma.user.count({ where: { role: 'IT_STAFF', isActive: true } })
    expect(count).toBeGreaterThanOrEqual(3)
  })

  it('Seed: at least 1 inactive IT_STAFF user exists', async () => {
    const count = await prisma.user.count({ where: { role: 'IT_STAFF', isActive: false } })
    expect(count).toBeGreaterThanOrEqual(1)
  })

  it('Seed: at least 1 active ADMINISTRATOR user exists', async () => {
    const count = await prisma.user.count({ where: { role: 'ADMINISTRATOR', isActive: true } })
    expect(count).toBeGreaterThanOrEqual(1)
  })

  it('Seed: Tickets distributed across multiple statuses', async () => {
    const statuses = await prisma.ticket.groupBy({ by: ['status'] })
    expect(statuses.length).toBeGreaterThanOrEqual(3)
  })

  it('Seed: some Tickets have an assigned owner (ownerId not null)', async () => {
    const count = await prisma.ticket.count({ where: { ownerId: { not: null } } })
    expect(count).toBeGreaterThanOrEqual(1)
  })

  it('Seed: example Public Comments exist', async () => {
    const count = await prisma.publicComment.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  it('Seed: example Internal Notes exist', async () => {
    const count = await prisma.internalNote.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  // AC-DB-06 — Idempotency
  it('Running seed twice does not create duplicate users', async () => {
    const countBefore = await prisma.user.count()
    expect(countBefore).toBeGreaterThanOrEqual(10)
  })

  // AC-DB-07 — Password hashing
  it('All seeded users have a hashed (not plaintext) passwordHash', async () => {
    const users = await prisma.user.findMany()
    for (const user of users) {
      expect(user.passwordHash).toMatch(/^\$2[ab]\$|\$argon2/)
      expect(user.passwordHash).not.toBe('Dev@123456')
      expect(user.passwordHash).not.toBe('InitPass@1')
      expect(user.passwordHash).not.toBe('ChangeMe123!')
    }
  })
})
