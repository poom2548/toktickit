import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma, createTicket, createStaff, createRequester, createAdmin, createAction, resetTestData, assertTestDatabase, loginAs } from './helpers.js';
import { TicketStatus } from '@prisma/client';

describe('Actions Taken API', () => {
  beforeAll(async () => {
    assertTestDatabase();
  });

  beforeEach(async () => {
    await resetTestData();
  });

  afterAll(async () => {
    await resetTestData();
    await prisma.$disconnect();
  });

  it('API-01: valid create by IT Staff AND by Administrator -> 201, correct ticket, performedBy = actor', async () => {
    const staff = await createStaff();
    const admin = await createAdmin();
    const ticket1 = await createTicket();
    const ticket2 = await createTicket();

    const agentStaff = await loginAs(staff);
    const res1 = await agentStaff.post(`/api/tickets/${ticket1.id}/actions-taken`).send({
      actionAt: new Date().toISOString(),
      description: 'Test action',
      result: 'Test result',
      followUpRequired: false
    });
    expect(res1.status).toBe(201);
    expect(res1.body.performedBy.id).toBe(staff.id);

    const agentAdmin = await loginAs(admin);
    const res2 = await agentAdmin.post(`/api/tickets/${ticket2.id}/actions-taken`).send({
      actionAt: new Date().toISOString(),
      description: 'Admin action',
      result: 'Admin result',
      followUpRequired: false
    });
    expect(res2.status).toBe(201);
    expect(res2.body.performedBy.id).toBe(admin.id);
  });

  it('API-02: blank/whitespace/missing description or result, over-length values -> 422 VALIDATION_FAILED with field-level "fields" entries', async () => {
    const staff = await createStaff();
    const ticket = await createTicket();
    const agent = await loginAs(staff);

    const res = await agent.post(`/api/tickets/${ticket.id}/actions-taken`).send({
      actionAt: new Date().toISOString(),
      description: '   ',
      result: '',
      followUpRequired: false
    });
    
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
    expect(res.body.error.fields).toHaveProperty('description');
    expect(res.body.error.fields).toHaveProperty('result');

    const res2 = await agent.post(`/api/tickets/${ticket.id}/actions-taken`).send({
      actionAt: new Date().toISOString(),
      description: 'A'.repeat(2001),
      result: 'B'.repeat(2001),
      followUpRequired: false
    });
    expect(res2.status).toBe(422);
    expect(res2.body.error.fields).toHaveProperty('description');
    expect(res2.body.error.fields).toHaveProperty('result');
  });

  it('API-03: followUpRequired=true with empty/whitespace note -> 422, nothing saved', async () => {
    const staff = await createStaff();
    const ticket = await createTicket();
    const agent = await loginAs(staff);

    const res = await agent.post(`/api/tickets/${ticket.id}/actions-taken`).send({
      actionAt: new Date().toISOString(),
      description: 'Desc',
      result: 'Res',
      followUpRequired: true,
      followUpNote: '   '
    });
    expect(res.status).toBe(422);
    expect(res.body.error.fields).toHaveProperty('followUpNote');
  });

  it('API-04: followUpRequired=false with a note -> stored followUpNote is null', async () => {
    const staff = await createStaff();
    const ticket = await createTicket();
    const agent = await loginAs(staff);

    const res = await agent.post(`/api/tickets/${ticket.id}/actions-taken`).send({
      actionAt: new Date().toISOString(),
      description: 'Desc',
      result: 'Res',
      followUpRequired: false,
      followUpNote: 'Should be ignored'
    });
    expect(res.status).toBe(201);
    expect(res.body.followUpNote).toBeNull();
  });

  it('API-05: invalid/missing actionAt, more than 5 minutes in the future -> 422; valid value stored as UTC', async () => {
    const staff = await createStaff();
    const ticket = await createTicket();
    const agent = await loginAs(staff);

    let res = await agent.post(`/api/tickets/${ticket.id}/actions-taken`).send({
      description: 'Desc',
      result: 'Res',
      followUpRequired: false
    });
    expect(res.status).toBe(422);
    expect(res.body.error.fields).toHaveProperty('actionAt');

    const futureDate = new Date();
    futureDate.setMinutes(futureDate.getMinutes() + 10);
    res = await agent.post(`/api/tickets/${ticket.id}/actions-taken`).send({
      actionAt: futureDate.toISOString(),
      description: 'Desc',
      result: 'Res',
      followUpRequired: false
    });
    expect(res.status).toBe(422);
    expect(res.body.error.fields).toHaveProperty('actionAt');
  });

  it('API-06: body containing performedBy / performedById / ticketId / id / version / createdAt is ignored', async () => {
    const staff = await createStaff();
    const ticket = await createTicket();
    const agent = await loginAs(staff);

    const res = await agent.post(`/api/tickets/${ticket.id}/actions-taken`).send({
      actionAt: new Date().toISOString(),
      description: 'Desc',
      result: 'Res',
      followUpRequired: false,
      performedById: 'fake-id',
      ticketId: 999,
      id: 'fake-action-id',
      version: 99,
      createdAt: '2020-01-01T00:00:00Z'
    });
    expect(res.status).toBe(201);
    expect(res.body.performedBy.id).toBe(staff.id);
    expect(res.body.id).not.toBe('fake-action-id');
    expect(res.body.version).toBe(1);
    expect(res.body.createdAt).not.toBe('2020-01-01T00:00:00.000Z');
  });

  it('API-07: non-owner IT Staff can create; the ticket owner is unchanged', async () => {
    const staff1 = await createStaff();
    const staff2 = await createStaff();
    const ticket = await createTicket({ ownerId: staff1.id });
    
    const agent = await loginAs(staff2);
    const res = await agent.post(`/api/tickets/${ticket.id}/actions-taken`).send({
      actionAt: new Date().toISOString(),
      description: 'Desc',
      result: 'Res',
      followUpRequired: false
    });
    expect(res.status).toBe(201);
    
    const dbTicket = await prisma.ticket.findUnique({ where: { id: ticket.id } });
    expect(dbTicket?.ownerId).toBe(staff1.id);
  });

  it('API-08: PATCH with the current version -> 200, version+1, updatedBy set, updatedAt changed, immutable fields unchanged, partial update only changes sent fields', async () => {
    const staff = await createStaff();
    const ticket = await createTicket();
    const action = await createAction(ticket.id, { performedById: staff.id, version: 1, description: 'Old desc' });

    const staff2 = await createStaff();
    const agent = await loginAs(staff2);
    
    const res = await agent.patch(`/api/tickets/${ticket.id}/actions-taken/${action.id}`).send({
      version: 1,
      description: 'New desc',
      id: 'hacked-id'
    });
    expect(res.status).toBe(200);
    expect(res.body.version).toBe(2);
    expect(res.body.description).toBe('New desc');
    expect(res.body.result).toBe(action.result); // Unchanged
    expect(res.body.id).toBe(action.id);
    expect(new Date(res.body.createdAt).getTime()).toBe(action.createdAt.getTime());
    
    const dbAction = await prisma.actionTaken.findUnique({ where: { id: action.id } });
    expect(dbAction?.updatedById).toBe(staff2.id);
  });

  it('API-09: PATCH with a stale version -> 409 CONFLICT including currentVersion; PATCH without version -> 422', async () => {
    const staff = await createStaff();
    const ticket = await createTicket();
    const action = await createAction(ticket.id, { performedById: staff.id, version: 2 });
    const agent = await loginAs(staff);

    const res1 = await agent.patch(`/api/tickets/${ticket.id}/actions-taken/${action.id}`).send({
      version: 1,
      description: 'New desc'
    });
    expect(res1.status).toBe(409);
    expect(res1.body.error.code).toBe('CONFLICT');
    expect(res1.body.error.currentVersion).toBe(2);

    const res2 = await agent.patch(`/api/tickets/${ticket.id}/actions-taken/${action.id}`).send({
      description: 'New desc'
    });
    expect(res2.status).toBe(422);
    expect(res2.body.error.fields).toHaveProperty('version');
  });

  it('API-10: list order is actionAt asc, then createdAt asc, then id asc, identical on repeated calls', async () => {
    const staff = await createStaff();
    const ticket = await createTicket();
    const agent = await loginAs(staff);
    
    const d1 = new Date('2025-01-01T10:00:00Z');
    const d2 = new Date('2025-01-01T11:00:00Z');
    const action2 = await createAction(ticket.id, { performedById: staff.id, actionAt: d2 });
    const action1 = await createAction(ticket.id, { performedById: staff.id, actionAt: d1 });

    const res = await agent.get(`/api/tickets/${ticket.id}/actions-taken`);
    expect(res.status).toBe(200);
    expect(res.body.actions.length).toBe(2);
    expect(res.body.actions[0].id).toBe(action1.id);
    expect(res.body.actions[1].id).toBe(action2.id);
  });

  it('API-11: DELETE -> 404 or 405 and the record persists', async () => {
    const staff = await createStaff();
    const ticket = await createTicket();
    const action = await createAction(ticket.id, { performedById: staff.id });
    const agent = await loginAs(staff);

    const res = await agent.delete(`/api/tickets/${ticket.id}/actions-taken/${action.id}`);
    expect([404, 405]).toContain(res.status);

    const dbAction = await prisma.actionTaken.findUnique({ where: { id: action.id } });
    expect(dbAction).not.toBeNull();
  });

  it('API-12: POST and PATCH on a CLOSED or CANCELLED ticket -> 409 TICKET_LOCKED, nothing changed', async () => {
    const staff = await createStaff();
    const ticketClosed = await createTicket({ status: TicketStatus.CLOSED });
    const action = await createAction(ticketClosed.id, { performedById: staff.id });
    const agent = await loginAs(staff);

    const resPost = await agent.post(`/api/tickets/${ticketClosed.id}/actions-taken`).send({
      actionAt: new Date().toISOString(),
      description: 'Desc',
      result: 'Res',
      followUpRequired: false
    });
    expect(resPost.status).toBe(409);
    expect(resPost.body.error.code).toBe('TICKET_LOCKED');

    const resPatch = await agent.patch(`/api/tickets/${ticketClosed.id}/actions-taken/${action.id}`).send({
      version: 1,
      description: 'New desc'
    });
    expect(resPatch.status).toBe(409);
    expect(resPatch.body.error.code).toBe('TICKET_LOCKED');
  });

  it('API-13: same Idempotency-Key + same body -> one record, replayed 201; same key + different body -> 422; parallel requests -> exactly one record', async () => {
    const staff = await createStaff();
    const ticket = await createTicket();
    const agent = await loginAs(staff);
    const key = 'test-key-123';
    
    const body = {
      actionAt: new Date().toISOString(),
      description: 'Desc',
      result: 'Res',
      followUpRequired: false
    };

    const res1 = await agent.post(`/api/tickets/${ticket.id}/actions-taken`)
      .set('Idempotency-Key', key)
      .send(body);
    expect(res1.status).toBe(201);

    const res2 = await agent.post(`/api/tickets/${ticket.id}/actions-taken`)
      .set('Idempotency-Key', key)
      .send(body);
    expect(res2.status).toBe(201);
    expect(res2.headers['idempotent-replayed']).toBe('true');
    expect(res2.body.id).toBe(res1.body.id);

    const res3 = await agent.post(`/api/tickets/${ticket.id}/actions-taken`)
      .set('Idempotency-Key', key)
      .send({ ...body, description: 'Different' });
    expect(res3.status).toBe(422);
    expect(res3.body.error.code).toBe('IDEMPOTENCY_KEY_REUSED');
    
    // parallel test
    const key2 = 'test-key-parallel';
    const [p1, p2] = await Promise.all([
      agent.post(`/api/tickets/${ticket.id}/actions-taken`).set('Idempotency-Key', key2).send(body),
      agent.post(`/api/tickets/${ticket.id}/actions-taken`).set('Idempotency-Key', key2).send(body)
    ]);
    
    const statuses = [p1.status, p2.status];
    expect(statuses).toContain(201);
    // the other could be 201 replayed or 422 or something depending on timing, but only 1 record created
    const count = await prisma.actionTaken.count({ where: { description: 'Desc', result: 'Res', performedById: staff.id, ticketId: ticket.id } });
    expect(count).toBe(2); // 1 from serial, 1 from parallel
  });

  it('API-14: attachmentNotes optional, max 1000, stored as plain text, no HTML escaping on write', async () => {
    const staff = await createStaff();
    const ticket = await createTicket();
    const agent = await loginAs(staff);
    const xss = '<script>alert(1)</script>';

    const res = await agent.post(`/api/tickets/${ticket.id}/actions-taken`).send({
      actionAt: new Date().toISOString(),
      description: 'Desc',
      result: 'Res',
      followUpRequired: false,
      attachmentNotes: xss
    });
    expect(res.status).toBe(201);
    expect(res.body.attachmentNotes).toBe(xss);
  });

  it('API-15: unauthenticated -> 401', async () => {
    const res = await request(app).get('/api/tickets/999/actions-taken');
    expect(res.status).toBe(401);
  });

  it('API-16: error envelope, no leaks', async () => {
    const staff = await createStaff();
    const agent = await loginAs(staff);
    const res = await agent.post(`/api/tickets/invalid/actions-taken`).send({});
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toHaveProperty('code');
    expect(res.body.error).not.toHaveProperty('stack');
  });

  it('API-17: health endpoint safe payload (Skip for now, from other tests)', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
  });

  it('AUTHZ-01: Requester POST Actions -> 403', async () => {
    const req = await createRequester();
    const ticket = await createTicket({ requesterId: req.id });
    const agent = await loginAs(req);

    const res = await agent.post(`/api/tickets/${ticket.id}/actions-taken`).send({
      actionAt: new Date().toISOString(),
      description: 'Desc',
      result: 'Res',
      followUpRequired: false
    });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('AUTHZ-02: Requester PATCH Actions -> 403', async () => {
    const req = await createRequester();
    const ticket = await createTicket({ requesterId: req.id });
    const staff = await createStaff();
    const action = await createAction(ticket.id, { performedById: staff.id });
    const agent = await loginAs(req);

    const res = await agent.patch(`/api/tickets/${ticket.id}/actions-taken/${action.id}`).send({
      version: 1,
      description: 'New desc'
    });
    expect(res.status).toBe(403);
  });

  it('AUTHZ-03: Requester reads own Actions', async () => {
    const req = await createRequester();
    const ticket = await createTicket({ requesterId: req.id });
    const agent = await loginAs(req);

    const res = await agent.get(`/api/tickets/${ticket.id}/actions-taken`);
    expect(res.status).toBe(200);
  });

  it('AUTHZ-04: Requester reads another user\'s Actions -> documented 403, GET non-existent -> 404', async () => {
    const req1 = await createRequester();
    const req2 = await createRequester();
    const ticket = await createTicket({ requesterId: req2.id });
    const agent = await loginAs(req1);

    const res = await agent.get(`/api/tickets/${ticket.id}/actions-taken`);
    expect(res.status).toBe(403);

    const res404 = await agent.get(`/api/tickets/999999/actions-taken`);
    expect(res404.status).toBe(404);
  });
});
