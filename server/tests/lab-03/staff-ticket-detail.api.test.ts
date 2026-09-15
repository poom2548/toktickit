import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function loginAndGetCookie(email, password) {
  const res = await request(app).post('/auth/login').send({ email, password })
  return res.headers['set-cookie']
}

describe('Staff Ticket Detail API', () => {
  let seededTicketId: string;
  let newStatusTicketId: string;
  let inProgressTicketId: string;
  let resolvedTicketId: string;
  let closedTicketId: string;
  let frankUserId: string;
  let graceUserId: string;
  let aliceUserId: string;
  let ivyUserId: string;

  beforeAll(async () => {
    // Look up users and tickets
    const frank = await prisma.user.findUnique({ where: { email: 'frank@toktick.dev' } });
    frankUserId = frank!.id;

    const grace = await prisma.user.findUnique({ where: { email: 'grace@toktick.dev' } });
    graceUserId = grace!.id;

    const alice = await prisma.user.findUnique({ where: { email: 'alice@toktick.dev' } });
    aliceUserId = alice!.id;

    const ivy = await prisma.user.findUnique({ where: { email: 'ivy@toktick.dev' } });
    ivyUserId = ivy!.id;

    const tickets = await prisma.ticket.findMany({
      orderBy: { id: 'asc' },
    });
    const baseTicket = tickets[0];
    seededTicketId = baseTicket.id;
    newStatusTicketId = baseTicket.id;

    // Create a new IN_PROGRESS ticket
    const inProgressTicket = await prisma.ticket.create({
      data: {
        summary: "Test in progress ticket",
        description: "Test description",
        status: "IN_PROGRESS",
        categoryId: baseTicket.categoryId,
        relatedSystemId: baseTicket.relatedSystemId,
        requesterId: baseTicket.requesterId
      }
    });
    inProgressTicketId = inProgressTicket.id;

    // Create a new RESOLVED ticket
    const resolvedTicket = await prisma.ticket.create({
      data: {
        summary: "Test resolved ticket",
        description: "Test description",
        status: "RESOLVED",
        categoryId: baseTicket.categoryId,
        relatedSystemId: baseTicket.relatedSystemId,
        requesterId: baseTicket.requesterId
      }
    });
    resolvedTicketId = resolvedTicket.id;

    // Create a new CLOSED ticket
    const closedTicket = await prisma.ticket.create({
      data: {
        summary: "Test closed ticket",
        description: "Test description",
        status: "CLOSED",
        categoryId: baseTicket.categoryId,
        relatedSystemId: baseTicket.relatedSystemId,
        requesterId: baseTicket.requesterId
      }
    });
    closedTicketId = closedTicket.id;
  });

  describe('GET /staff/tickets/:id', () => {
    it('returns full ticket detail for IT Staff', async () => {
      const staffCookie = await loginAndGetCookie('frank@toktick.dev', 'Dev@123456');
      const res = await request(app)
        .get(`/staff/tickets/${seededTicketId}`)
        .set('Cookie', staffCookie);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('summary');
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('requestedPriority');
      expect(res.body).toHaveProperty('itPriority');
      expect(res.body).toHaveProperty('problemAppearsResolved');
      expect(res.body).toHaveProperty('requester');
      expect(res.body.requester).toHaveProperty('name');
      expect(res.body.requester).not.toHaveProperty('passwordHash');
      expect(res.body).toHaveProperty('publicComments');
      expect(res.body).toHaveProperty('internalNotes');
      expect(res.body).toHaveProperty('attachments');
      expect(Array.isArray(res.body.publicComments)).toBe(true);
      expect(Array.isArray(res.body.internalNotes)).toBe(true);
      expect(Array.isArray(res.body.attachments)).toBe(true);
    });

    it('returns 401 for unauthenticated request', async () => {
      const res = await request(app).get(`/staff/tickets/${seededTicketId}`);
      expect(res.status).toBe(401);
    });

    it('returns 403 for REQUESTER', async () => {
      const requesterCookie = await loginAndGetCookie('alice@toktick.dev', 'Dev@123456');
      const res = await request(app)
        .get(`/staff/tickets/${seededTicketId}`)
        .set('Cookie', requesterCookie);
      expect(res.status).toBe(403);
      expect(res.body).not.toHaveProperty('summary');
    });

    it('returns 404 for non-existent ticket', async () => {
      const staffCookie = await loginAndGetCookie('frank@toktick.dev', 'Dev@123456');
      const res = await request(app)
        .get('/staff/tickets/99999999')
        .set('Cookie', staffCookie);
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /staff/tickets/:id/owner', () => {
    it('updates owner to a valid active IT_STAFF user', async () => {
      const staffCookie = await loginAndGetCookie('frank@toktick.dev', 'Dev@123456');
      const res = await request(app)
        .patch(`/staff/tickets/${seededTicketId}/owner`)
        .set('Cookie', staffCookie)
        .send({ ownerId: graceUserId });

      expect(res.status).toBe(200);
      expect(res.body.owner?.id).toBe(graceUserId);
    });

    it('unassigns owner when ownerId is null', async () => {
      const staffCookie = await loginAndGetCookie('frank@toktick.dev', 'Dev@123456');
      const res = await request(app)
        .patch(`/staff/tickets/${seededTicketId}/owner`)
        .set('Cookie', staffCookie)
        .send({ ownerId: null });
      expect(res.status).toBe(200);
      expect(res.body.ownerId).toBeNull();
    });

    it('returns 422 when ownerId is a REQUESTER user', async () => {
      const staffCookie = await loginAndGetCookie('frank@toktick.dev', 'Dev@123456');
      const res = await request(app)
        .patch(`/staff/tickets/${seededTicketId}/owner`)
        .set('Cookie', staffCookie)
        .send({ ownerId: aliceUserId });
      expect(res.status).toBe(422);
      expect(res.body.error).toMatch(/requester/i);
    });

    it('returns 422 when ownerId is an inactive IT_STAFF user', async () => {
      const staffCookie = await loginAndGetCookie('frank@toktick.dev', 'Dev@123456');
      const res = await request(app)
        .patch(`/staff/tickets/${seededTicketId}/owner`)
        .set('Cookie', staffCookie)
        .send({ ownerId: ivyUserId });
      expect(res.status).toBe(422);
      expect(res.body.error).toMatch(/inactive/i);
    });

    it('returns 403 for REQUESTER', async () => {
      const requesterCookie = await loginAndGetCookie('alice@toktick.dev', 'Dev@123456');
      const res = await request(app)
        .patch(`/staff/tickets/${seededTicketId}/owner`)
        .set('Cookie', requesterCookie)
        .send({ ownerId: frankUserId });
      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /staff/tickets/:id/priority', () => {
    it('updates itPriority for IT Staff', async () => {
      const staffCookie = await loginAndGetCookie('frank@toktick.dev', 'Dev@123456');
      const res = await request(app)
        .patch(`/staff/tickets/${seededTicketId}/priority`)
        .set('Cookie', staffCookie)
        .send({ itPriority: 'CRITICAL' });
      expect(res.status).toBe(200);
      expect(res.body.itPriority).toBe('CRITICAL');
    });

    it('returns 422 for invalid priority value', async () => {
      const staffCookie = await loginAndGetCookie('frank@toktick.dev', 'Dev@123456');
      const res = await request(app)
        .patch(`/staff/tickets/${seededTicketId}/priority`)
        .set('Cookie', staffCookie)
        .send({ itPriority: 'ULTRA_CRITICAL' });
      expect(res.status).toBe(422);
    });

    it('returns 403 for REQUESTER', async () => {
      const requesterCookie = await loginAndGetCookie('alice@toktick.dev', 'Dev@123456');
      const res = await request(app)
        .patch(`/staff/tickets/${seededTicketId}/priority`)
        .set('Cookie', requesterCookie)
        .send({ itPriority: 'HIGH' });
      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /staff/tickets/:id/status', () => {
    it('transitions NEW → OPEN successfully', async () => {
      const staffCookie = await loginAndGetCookie('frank@toktick.dev', 'Dev@123456');
      const res = await request(app)
        .patch(`/staff/tickets/${newStatusTicketId}/status`)
        .set('Cookie', staffCookie)
        .send({ status: 'OPEN' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('OPEN');
    });

    it('transitions IN_PROGRESS → RESOLVED successfully', async () => {
      const staffCookie = await loginAndGetCookie('frank@toktick.dev', 'Dev@123456');
      const res = await request(app)
        .patch(`/staff/tickets/${inProgressTicketId}/status`)
        .set('Cookie', staffCookie)
        .send({ status: 'RESOLVED' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('RESOLVED');
    });

    it('returns 422 for RESOLVED → NEW (not a permitted transition)', async () => {
      const staffCookie = await loginAndGetCookie('frank@toktick.dev', 'Dev@123456');
      const res = await request(app)
        .patch(`/staff/tickets/${resolvedTicketId}/status`)
        .set('Cookie', staffCookie)
        .send({ status: 'NEW' });
      expect(res.status).toBe(422);
      expect(res.body).toHaveProperty('permittedTransitions');
      expect(res.body.permittedTransitions).toContain('CLOSED');
      expect(res.body.permittedTransitions).toContain('REOPENED');
    });

    it('returns 422 for CLOSED → anything (terminal state)', async () => {
      const staffCookie = await loginAndGetCookie('frank@toktick.dev', 'Dev@123456');
      const res = await request(app)
        .patch(`/staff/tickets/${closedTicketId}/status`)
        .set('Cookie', staffCookie)
        .send({ status: 'OPEN' });
      expect(res.status).toBe(422);
      expect(res.body.permittedTransitions).toHaveLength(0);
    });

    it('returns 403 for REQUESTER attempting status change', async () => {
      const requesterCookie = await loginAndGetCookie('alice@toktick.dev', 'Dev@123456');
      const res = await request(app)
        .patch(`/staff/tickets/${seededTicketId}/status`)
        .set('Cookie', requesterCookie)
        .send({ status: 'OPEN' });
      expect(res.status).toBe(403);
    });

    it('returns 400 for invalid status value', async () => {
      const staffCookie = await loginAndGetCookie('frank@toktick.dev', 'Dev@123456');
      const res = await request(app)
        .patch(`/staff/tickets/${seededTicketId}/status`)
        .set('Cookie', staffCookie)
        .send({ status: 'SUPER_RESOLVED' });
      expect(res.status).toBe(400);
    });
  });
});
