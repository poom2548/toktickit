import fs from 'fs';
import path from 'path';
import { PrismaClient, User, Ticket, Role, TicketStatus, Priority } from '@prisma/client';
import request from 'supertest';
import { app } from '../../src/app';
import { hashPassword } from '../../src/utils/password';
import { getPrisma } from '../../src/prisma.js';
import * as dashboardService from '../../src/dashboard/dashboard.service.js';

export { getPrisma, dashboardService };
export const prisma = new PrismaClient();
export const TEST_PASSWORD = 'password123';
let counter = 0;
const processRunId = Math.random().toString(36).substring(2, 8);

export function assertTestDatabase() {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('DATA SAFETY GUARD: Tests must only be run with NODE_ENV=test');
  }
}

export function getUniqueCount() {
  return `${processRunId}_${Date.now()}_${counter++}`;
}

export const getProcessRunId = () => processRunId;

const createdRecords = {
  users: [] as string[],
  tickets: [] as (string | number)[],
  attachments: [] as (string | number)[],
  notes: [] as string[],
  comments: [] as string[],
  actions: [] as string[],
  history: [] as string[],
  idempotency: [] as string[],
};

// ========================
// USER FACTORIES
// ========================
export const createUser = async (overrides: Partial<User> = {}) => {
  assertTestDatabase();
  const hash = await hashPassword(TEST_PASSWORD);
  const user = await prisma.user.create({
    data: {
      name: overrides.name || 'Test User',
      email: overrides.email || `user_${getUniqueCount()}@test.com`,
      passwordHash: overrides.passwordHash || hash,
      role: overrides.role || Role.REQUESTER,
      isActive: overrides.isActive ?? true,
      requiresPasswordChange: overrides.requiresPasswordChange ?? false,
    }
  });
  createdRecords.users.push(user.id);
  return user;
};

export const createRequester = async (overrides?: Partial<User>) => createUser({ role: Role.REQUESTER, ...overrides });
export const createStaff = async (overrides?: Partial<User>) => createUser({ role: Role.IT_STAFF, ...overrides });
export const createAdmin = async (overrides?: Partial<User>) => createUser({ role: Role.ADMINISTRATOR, ...overrides });
export const createInactiveStaff = async (overrides?: Partial<User>) => createUser({ role: Role.IT_STAFF, isActive: false, ...overrides });

// ========================
// TICKET FACTORIES
// ========================
export const createTicket = async (overrides: Partial<Ticket> = {}) => {
  assertTestDatabase();
  let categoryId = overrides.categoryId;
  if (!categoryId) {
    let cat = await prisma.category.findFirst();
    if (!cat) cat = await prisma.category.create({ data: { name: `Cat ${getUniqueCount()}` } });
    categoryId = cat.id;
  }
  
  let relatedSystemId = overrides.relatedSystemId;
  if (!relatedSystemId) {
    let sys = await prisma.relatedSystem.findFirst();
    if (!sys) sys = await prisma.relatedSystem.create({ data: { name: `Sys ${getUniqueCount()}` } });
    relatedSystemId = sys.id;
  }

  let requesterId = overrides.requesterId;
  if (!requesterId) {
    const req = await createRequester();
    requesterId = req.id;
  }

  const ticket = await prisma.ticket.create({
    data: {
      ticketNumber: `TKT-${getUniqueCount()}`,
      summary: overrides.summary || 'Test Ticket',
      description: overrides.description || 'Test Description',
      status: overrides.status || TicketStatus.OPEN,
      requestedPriority: overrides.requestedPriority || Priority.MEDIUM,
      itPriority: overrides.itPriority || Priority.MEDIUM,
      requesterId,
      ownerId: overrides.ownerId,
      categoryId,
      relatedSystemId,
      problemAppearsResolved: overrides.problemAppearsResolved ?? false,
      createdAt: overrides.createdAt,
      updatedAt: overrides.updatedAt
    }
  });
  createdRecords.tickets.push(ticket.id);
  return ticket;
};

export const createTicketsForStatuses = async () => {
  const statuses = Object.values(TicketStatus);
  const tickets = [];
  for (const status of statuses) {
    tickets.push(await createTicket({ status }));
  }
  return tickets;
};

export const createTicketsForDashboard = async () => {
  const staff = await createStaff();
  
  const oldDate = new Date();
  oldDate.setDate(oldDate.getDate() - 10);
  
  await createTicket({ status: TicketStatus.NEW, requestedPriority: Priority.HIGH });
  await createTicket({ status: TicketStatus.IN_PROGRESS, ownerId: staff.id, itPriority: Priority.CRITICAL });
  await createTicket({ status: TicketStatus.RESOLVED, ownerId: staff.id });
  await createTicket({ status: TicketStatus.OPEN, createdAt: oldDate }); // Outside 7-day window
  await createTicket({ status: TicketStatus.CLOSED, ownerId: staff.id, createdAt: oldDate });
  
  return { staff };
};

export const createTicketsBulk = async (count: number, baseOverrides: Partial<Ticket> = {}) => {
  assertTestDatabase();
  let categoryId = baseOverrides.categoryId;
  if (!categoryId) {
    let cat = await prisma.category.findFirst();
    if (!cat) cat = await prisma.category.create({ data: { name: `Cat ${getUniqueCount()}` } });
    categoryId = cat.id;
  }

  let relatedSystemId = baseOverrides.relatedSystemId;
  if (!relatedSystemId) {
    let sys = await prisma.relatedSystem.findFirst();
    if (!sys) sys = await prisma.relatedSystem.create({ data: { name: `Sys ${getUniqueCount()}` } });
    relatedSystemId = sys.id;
  }

  let requesterId = baseOverrides.requesterId;
  if (!requesterId) {
    const req = await createRequester();
    requesterId = req.id;
  }

  const prefix = `TKT-B${getProcessRunId()}`;
  const data = [];
  for (let i = 0; i < count; i++) {
    data.push({
      ticketNumber: `${prefix}-${counter++}`,
      summary: baseOverrides.summary || `Bulk Ticket ${i}`,
      description: baseOverrides.description || `Bulk Description ${i}`,
      status: baseOverrides.status || TicketStatus.OPEN,
      requestedPriority: baseOverrides.requestedPriority || Priority.MEDIUM,
      itPriority: baseOverrides.itPriority || Priority.MEDIUM,
      requesterId,
      ownerId: baseOverrides.ownerId,
      categoryId,
      relatedSystemId,
      problemAppearsResolved: baseOverrides.problemAppearsResolved ?? false,
      createdAt: baseOverrides.createdAt,
      updatedAt: baseOverrides.updatedAt,
    });
  }

  await prisma.ticket.createMany({ data });
  const created = await prisma.ticket.findMany({
    where: { ticketNumber: { startsWith: prefix } },
    select: { id: true, ticketNumber: true, status: true, itPriority: true, requesterId: true, ownerId: true },
  });
  for (const t of created) {
    createdRecords.tickets.push(t.id);
  }
  return { requesterId, tickets: created };
};

// ========================
// EXISTING LAB 3 MODELS
// ========================
export const createPublicComment = async (ticketId: string, authorId: string, overrides: any = {}) => {
  assertTestDatabase();
  const c = await prisma.publicComment.create({
    data: { ticketId, authorId, content: overrides.content || 'Public Comment', ...overrides }
  });
  createdRecords.comments.push(c.id);
  return c;
};

export const createInternalNote = async (ticketId: string, authorId: string, overrides: any = {}) => {
  assertTestDatabase();
  const n = await prisma.internalNote.create({
    data: { ticketId, authorId, content: overrides.content || 'Internal Note', ...overrides }
  });
  createdRecords.notes.push(n.id);
  return n;
};

export const createAttachment = async (ticketId: string, overrides: any = {}) => {
  assertTestDatabase();
  const a = await prisma.attachment.create({
    data: { ticketId, filename: overrides.filename || 'file.txt', mimetype: overrides.mimetype || 'text/plain', size: overrides.size || 1024, ...overrides }
  });
  createdRecords.attachments.push(a.id);
  return a;
};

// ========================
// LAB 4 MODELS (PENDING)
// ========================
export const createAction = async (ticketId: any, overrides: any = {}) => {
  assertTestDatabase();
  if (ticketId === 'fake-id' || (typeof ticketId === 'string' && isNaN(Number(ticketId)))) throw new Error('not available yet');
  const a = await prisma.actionTaken.create({
    data: { ticketId, performedById: overrides.performedById, actionAt: new Date(), description: 'Action', result: 'Success', followUpRequired: false, ...overrides }
  });
  createdRecords.actions.push(a.id);
  return a;
};

export const createActions = async (ticketId: number, n: number) => {
  const actions = [];
  for (let i = 0; i < n; i++) {
    const admin = await prisma.user.findFirst({ where: { role: Role.ADMINISTRATOR } });
    actions.push(await createAction(ticketId, { description: `Action ${i}`, performedById: admin!.id }));
  }
  return actions;
};

export const createStatusHistory = async (ticketId: any, overrides: any = {}) => {
  assertTestDatabase();
  if (ticketId === 'fake-id' || (typeof ticketId === 'string' && isNaN(Number(ticketId)))) throw new Error('not available yet');
  const h = await prisma.ticketStatusHistory.create({
    data: { ticketId, changedById: overrides.changedById, fromStatus: TicketStatus.NEW, toStatus: TicketStatus.OPEN, changedAt: new Date(), ...overrides }
  });
  createdRecords.history.push(h.id);
  return h;
};

export const createIdempotencyKey = async (overrides: any = {}) => {
  assertTestDatabase();
  const k = await prisma.idempotencyKey.create({
    data: { key: overrides.key || `KEY-${getUniqueCount()}`, endpoint: overrides.endpoint || '/api', userId: overrides.userId, responseStatus: 200, responseBody: {}, requestHash: overrides.requestHash || 'hash', expiresAt: new Date(Date.now() + 86400000), ...overrides }
  });
  createdRecords.idempotency.push(k.id);
  return k;
};

// ========================
// AUTH HELPERS
// ========================
export const loginAs = async (user: Pick<User, 'email'>, password = TEST_PASSWORD) => {
  const agent = request.agent(app);
  const res = await agent.post('/auth/login').send({ email: user.email, password });
  if (res.status !== 200) throw new Error(`loginAs failed for ${user.email} with status ${res.status}`);
  return agent;
};

export const authedRequest = async (user: Pick<User, 'email'>) => {
  return await loginAs(user);
};

export const anonymousRequest = () => request.agent(app);

export const getSeededAccount = async (role: Role) => {
  const user = await prisma.user.findFirst({ where: { role, isActive: true } });
  if (!user) throw new Error(`No seeded account found for role ${role}`);
  // Demo accounts use SecurePass@123
  return { user, agent: await loginAs(user, 'SecurePass@123') };
};

// ========================
// CLEANUP
// ========================
export const resetTestData = async () => {
  assertTestDatabase();
  // Safe FK-order cleanup using the registry
  if ('actionTaken' in prisma && createdRecords.tickets.length > 0) {
    await (prisma as any).actionTaken.deleteMany({ where: { ticketId: { in: createdRecords.tickets } } });
  }
  if ('statusHistory' in prisma && createdRecords.history.length > 0) {
    await (prisma as any).statusHistory.deleteMany({ where: { id: { in: createdRecords.history } } });
  }
  if ('ticketStatusHistory' in prisma && (createdRecords.history.length > 0 || createdRecords.tickets.length > 0)) {
    await (prisma as any).ticketStatusHistory.deleteMany({
      where: {
        OR: [
          ...(createdRecords.history.length > 0 ? [{ id: { in: createdRecords.history } }] : []),
          ...(createdRecords.tickets.length > 0 ? [{ ticketId: { in: createdRecords.tickets } }] : []),
        ],
      },
    });
  }
  if ('idempotencyKey' in prisma && createdRecords.idempotency.length > 0) {
    await (prisma as any).idempotencyKey.deleteMany({ where: { id: { in: createdRecords.idempotency } } });
  }
  if (createdRecords.attachments.length > 0) await prisma.attachment.deleteMany({ where: { id: { in: createdRecords.attachments } } });
  if (createdRecords.notes.length > 0) await prisma.internalNote.deleteMany({ where: { id: { in: createdRecords.notes } } });
  if (createdRecords.comments.length > 0) await prisma.publicComment.deleteMany({ where: { id: { in: createdRecords.comments } } });
  if (createdRecords.tickets.length > 0) await prisma.ticket.deleteMany({ where: { id: { in: createdRecords.tickets } } });
  if (createdRecords.users.length > 0) await prisma.user.deleteMany({ where: { id: { in: createdRecords.users } } });
  
  // Clear registry
  for (const key of Object.keys(createdRecords) as (keyof typeof createdRecords)[]) {
    createdRecords[key] = [];
  }
};

const lockDir = path.join(process.cwd(), 'node_modules', '.lab04-db-lock');

export const acquireTestLock = async (timeoutMs = 120000) => {
  const start = Date.now();
  while (true) {
    try {
      fs.mkdirSync(lockDir);
      return;
    } catch (err: any) {
      if (err.code === 'EEXIST') {
        try {
          const stat = fs.statSync(lockDir);
          if (Date.now() - stat.mtimeMs > 180000) {
            fs.rmdirSync(lockDir);
            continue;
          }
        } catch {}
        if (Date.now() - start > timeoutMs) {
          throw new Error(`Timeout waiting for test lock after ${timeoutMs}ms`);
        }
        await new Promise((r) => setTimeout(r, 100));
      } else {
        throw err;
      }
    }
  }
};

export const releaseTestLock = () => {
  try {
    fs.rmdirSync(lockDir);
  } catch {}
};

process.on('exit', () => {
  releaseTestLock();
});

// Use this pattern in test suites
export const beforeAllPattern = async () => {
  assertTestDatabase();
  await acquireTestLock();
};
export const afterAllPattern = async () => {
  releaseTestLock();
  await prisma.$disconnect();
};
