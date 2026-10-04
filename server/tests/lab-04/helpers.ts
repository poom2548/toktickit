import { PrismaClient, User, Ticket, Role, TicketStatus, Priority } from '@prisma/client'
import request from 'supertest'
import { app } from '../../src/app'

const prisma = new PrismaClient()

import { hashPassword } from '../../src/utils/password'

export const createRequester = async (overrides?: Partial<User>) => {
  const hash = await hashPassword('password123')
  return prisma.user.create({
    data: {
      name: 'Test Requester',
      email: `requester_${Date.now()}@test.com`,
      passwordHash: hash,
      role: Role.REQUESTER,
      isActive: true,
      requiresPasswordChange: false,
      ...overrides
    }
  })
}

export const createITStaff = async (overrides?: Partial<User>) => {
  const hash = await hashPassword('password123')
  return prisma.user.create({
    data: {
      name: 'Test IT Staff',
      email: `staff_${Date.now()}@test.com`,
      passwordHash: hash,
      role: Role.IT_STAFF,
      isActive: true,
      requiresPasswordChange: false,
      ...overrides
    }
  })
}

export const createInactiveITStaff = async (overrides?: Partial<User>) => {
  const hash = await hashPassword('password123')
  return prisma.user.create({
    data: {
      name: 'Inactive IT Staff',
      email: `inactive_staff_${Date.now()}@test.com`,
      passwordHash: hash,
      role: Role.IT_STAFF,
      isActive: false,
      requiresPasswordChange: false,
      ...overrides
    }
  })
}

export const createAdministrator = async (overrides?: Partial<User>) => {
  const hash = await hashPassword('password123')
  return prisma.user.create({
    data: {
      name: 'Test Admin',
      email: `admin_${Date.now()}@test.com`,
      passwordHash: hash,
      role: Role.ADMINISTRATOR,
      isActive: true,
      requiresPasswordChange: false,
      ...overrides
    }
  })
}

export const createTicket = async (overrides?: Partial<Ticket>) => {
  const requester = await createRequester()
  let category = await prisma.category.findFirst()
  if (!category) category = await prisma.category.create({ data: { name: 'Test Category' } })

  return prisma.ticket.create({
    data: {
      ticketNumber: `TKT-${Date.now()}`,
      summary: 'Test Ticket',
      description: 'Test Description',
      status: TicketStatus.NEW,
      requestedPriority: Priority.LOW,
      itPriority: Priority.LOW,
      requesterId: requester.id,
      categoryId: category.id,
      problemAppearsResolved: false,
      ...overrides
    }
  })
}

export const createActionTaken = async (ticketId: string, performedById: string, overrides: any = {}) => {
  // Model ActionTaken might not exist yet, throw clear message if it fails
  try {
    return await (prisma as any).actionTaken.create({
      data: {
        ticketId,
        performedById,
        actionAt: new Date(),
        actionType: 'COMMENT',
        content: 'Test action',
        isFollowUpRequired: false,
        ...overrides
      }
    })
  } catch (e: any) {
    if (e.message && e.message.includes('actionTaken')) {
      throw new Error("ActionTaken model not implemented yet")
    }
    throw e
  }
}

export const createStatusHistory = async (ticketId: string, changedById: string, overrides: any = {}) => {
  try {
    return await (prisma as any).statusHistory.create({
      data: {
        ticketId,
        changedById,
        oldStatus: TicketStatus.NEW,
        newStatus: TicketStatus.IN_PROGRESS,
        changedAt: new Date(),
        ...overrides
      }
    })
  } catch (e: any) {
    if (e.message && e.message.includes('statusHistory')) {
      throw new Error("StatusHistory model not implemented yet")
    }
    throw e
  }
}

// Reusing authentication helper concept from Lab 3
export const getAuthAgent = async (user: User) => {
  const agent = request.agent(app)
  // Since we hash passwords in test factories, it's easier to mock or just use the login endpoint if password is known.
  // Wait, if passwordHash is just 'hashed', we can't login via normal /auth/login.
  // But wait, the standard token generation might be better. 
  // Wait, the tests in Lab 3 might just use a standard password.
  // Let's create users with standard password and login.
  return agent
}

export const loginAs = async (user: User, password = 'password') => {
  const agent = request.agent(app)
  await agent.post('/auth/login').send({ email: user.email, password })
  return agent
}
