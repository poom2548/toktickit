import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { getPrisma } from '../../src/prisma';
import { loginAs, createUser, createTicket, resetTestData } from './helpers';
import { TicketStatus, User } from '@prisma/client';

const prisma = getPrisma();

type RoleName = 'REQUESTER' | 'IT_STAFF' | 'ADMINISTRATOR';

interface TransitionOracle {
  from: TicketStatus;
  to: TicketStatus;
  roles: RoleName[];
  requesterOwnOnly?: boolean;
  gated?: boolean;
}

const matrix: TransitionOracle[] = [
  { from: 'NEW', to: 'OPEN', roles: ['IT_STAFF', 'ADMINISTRATOR'] },
  { from: 'NEW', to: 'CANCELLED', roles: ['REQUESTER', 'IT_STAFF', 'ADMINISTRATOR'], requesterOwnOnly: true },
  { from: 'OPEN', to: 'IN_PROGRESS', roles: ['IT_STAFF', 'ADMINISTRATOR'] },
  { from: 'OPEN', to: 'WAITING_FOR_REQUESTER', roles: ['IT_STAFF', 'ADMINISTRATOR'] },
  { from: 'OPEN', to: 'CANCELLED', roles: ['REQUESTER', 'IT_STAFF', 'ADMINISTRATOR'], requesterOwnOnly: true },
  { from: 'IN_PROGRESS', to: 'WAITING_FOR_REQUESTER', roles: ['IT_STAFF', 'ADMINISTRATOR'] },
  { from: 'IN_PROGRESS', to: 'RESOLVED', roles: ['IT_STAFF', 'ADMINISTRATOR'], gated: true },
  { from: 'IN_PROGRESS', to: 'CANCELLED', roles: ['IT_STAFF', 'ADMINISTRATOR'] },
  { from: 'WAITING_FOR_REQUESTER', to: 'IN_PROGRESS', roles: ['IT_STAFF', 'ADMINISTRATOR'] },
  { from: 'WAITING_FOR_REQUESTER', to: 'RESOLVED', roles: ['IT_STAFF', 'ADMINISTRATOR'], gated: true },
  { from: 'WAITING_FOR_REQUESTER', to: 'CANCELLED', roles: ['REQUESTER', 'IT_STAFF', 'ADMINISTRATOR'], requesterOwnOnly: true },
  { from: 'RESOLVED', to: 'CLOSED', roles: ['IT_STAFF', 'ADMINISTRATOR'] },
  { from: 'RESOLVED', to: 'REOPENED', roles: ['REQUESTER', 'IT_STAFF', 'ADMINISTRATOR'], requesterOwnOnly: true },
  { from: 'REOPENED', to: 'IN_PROGRESS', roles: ['IT_STAFF', 'ADMINISTRATOR'] },
  { from: 'REOPENED', to: 'WAITING_FOR_REQUESTER', roles: ['IT_STAFF', 'ADMINISTRATOR'] },
  { from: 'REOPENED', to: 'CANCELLED', roles: ['IT_STAFF', 'ADMINISTRATOR'] },
];

describe('Ticket Workflow', () => {
  let reqAuth: User;
  let reqAgent: request.SuperAgentTest;
  let staffAuth: User;
  let staffAgent: request.SuperAgentTest;
  let adminAuth: User;
  let adminAgent: request.SuperAgentTest;
  let otherReqAuth: User;
  let otherReqAgent: request.SuperAgentTest;
  let inactiveStaffAuth: User;

  beforeAll(async () => {
    reqAuth = await createUser({ role: 'REQUESTER' });
    reqAgent = await loginAs(reqAuth);
    staffAuth = await createUser({ role: 'IT_STAFF' });
    staffAgent = await loginAs(staffAuth);
    adminAuth = await createUser({ role: 'ADMINISTRATOR' });
    adminAgent = await loginAs(adminAuth);
    otherReqAuth = await createUser({ role: 'REQUESTER' });
    otherReqAgent = await loginAs(otherReqAuth);
    inactiveStaffAuth = await createUser({ role: 'IT_STAFF', isActive: false });
  });

  afterAll(async () => {
    await resetTestData();
  });

  const ALL_STATUSES = ['NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'RESOLVED', 'REOPENED', 'CLOSED', 'CANCELLED'] as TicketStatus[];
  const ALL_ROLES = [
    { name: 'REQUESTER' as RoleName, auth: () => reqAuth, agent: () => reqAgent },
    { name: 'IT_STAFF' as RoleName, auth: () => staffAuth, agent: () => staffAgent },
    { name: 'ADMINISTRATOR' as RoleName, auth: () => adminAuth, agent: () => adminAgent },
  ];

  describe('WF-01 & WF-02 Table-Driven Tests', () => {
    for (const from of ALL_STATUSES) {
      for (const to of ALL_STATUSES) {
        if (from === to) continue;
        for (const roleDef of ALL_ROLES) {
          const rule = matrix.find(r => r.from === from && r.to === to);
          const allowed = rule && rule.roles.includes(roleDef.name);

          if (allowed) {
            it(`WF-01: allowed transitions - ${roleDef.name} moving ${from} -> ${to}`, async () => {
              const ticket = await createTicket({ requesterId: reqAuth.id, status: from, version: 1, requesterMarkedResolvedAt: new Date() });
              if (rule.gated) {
                await prisma.ticket.update({ where: { id: ticket.id }, data: { ownerId: staffAuth.id } });
                await prisma.actionTaken.create({ data: { ticketId: ticket.id, actionAt: new Date(), description: 'x', result: 'y', performedById: staffAuth.id } });
              }

              const res = await roleDef.agent()
                .post(`/api/tickets/${ticket.id}/status`)
                .send({ status: to, version: ticket.version });
              
              expect(res.status, `Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`).toBe(200);
              expect(res.body.status).toBe(to);
              expect(res.body.version).toBe(ticket.version + 1);
              
              const history = await prisma.ticketStatusHistory.findMany({ where: { ticketId: ticket.id } });
              expect(history.length).toBe(1);
              expect(history[0].fromStatus).toBe(from);
              expect(history[0].toStatus).toBe(to);
              expect(history[0].changedById).toBe(roleDef.auth().id);
              
              const updatedTicket = await prisma.ticket.findUnique({ where: { id: ticket.id } });
              expect(updatedTicket?.requesterMarkedResolvedAt).toBeNull();
            });
          } else {
            it(`WF-02: disallowed -> 422/403, unchanged - ${roleDef.name} moving ${from} -> ${to}`, async () => {
              const ticket = await createTicket({ requesterId: reqAuth.id, status: from, version: 1 });
              const res = await roleDef.agent()
                .post(`/api/tickets/${ticket.id}/status`)
                .send({ status: to, version: ticket.version });
              
              const isInvalidTransition = !rule;
              if (isInvalidTransition) {
                if (['CLOSED', 'CANCELLED'].includes(from)) {
                  expect(res.status).toBe(422);
                  expect(res.body.error?.code).toBe('INVALID_TRANSITION');
                } else {
                  expect(res.status).toBe(422);
                  expect(res.body.error?.code).toBe('INVALID_TRANSITION');
                }
              } else {
                expect(res.status).toBe(403);
              }
              const history = await prisma.ticketStatusHistory.findMany({ where: { ticketId: ticket.id } });
              expect(history.length).toBe(0);
            });
          }
        }
      }
    }
  });

  it('WF-03: appears resolved does not change status', async () => {
    const ticket = await createTicket({ requesterId: reqAuth.id, status: 'OPEN' });
    const res = await reqAgent
      .post(`/api/tickets/${ticket.id}/requester-resolved-indication`)
      .send({ problemAppearsResolved: true });
    
    expect(res.status, `Expected 200, got ${res.status}`).toBe(200);
    expect(res.body.status).toBe('OPEN');
    expect(res.body.version).toBe(1);
    expect(res.body.requesterMarkedResolvedAt).not.toBeNull();
    
    const resStaff = await staffAgent.get(`/staff/tickets/${ticket.id}`);
    expect(resStaff.body.requesterMarkedResolvedAt).not.toBeNull();
  });

  it('WF-04: resolution gate pass/fail', async () => {
    const ticket = await createTicket({ requesterId: reqAuth.id, status: 'IN_PROGRESS' });
    // NEW ROUTE
    const resFail = await staffAgent
      .post(`/api/tickets/${ticket.id}/status`)
      .send({ status: 'RESOLVED', version: 1 });
    expect(resFail.status).toBe(422);
    expect(resFail.body.error.code).toBe('RESOLUTION_GATE_FAILED');

    // OLD ROUTE (gate enforced here too)
    const resFailOld = await staffAgent
      .patch(`/staff/tickets/${ticket.id}/status`)
      .send({ status: 'RESOLVED', version: 1 });
    expect(resFailOld.status).toBe(422);

    await prisma.ticket.update({ where: { id: ticket.id }, data: { ownerId: staffAuth.id } });
    await prisma.actionTaken.create({ data: { ticketId: ticket.id, actionAt: new Date(), description: 'x', result: '  ', performedById: staffAuth.id } });
    
    const resFail2 = await staffAgent.post(`/api/tickets/${ticket.id}/status`).send({ status: 'RESOLVED', version: 1 });
    expect(resFail2.status).toBe(422);

    await prisma.actionTaken.create({ data: { ticketId: ticket.id, actionAt: new Date(), description: 'x', result: 'ok', performedById: staffAuth.id } });
    
    // Test the old route passes the gate now
    const resPassOld = await staffAgent.patch(`/staff/tickets/${ticket.id}/status`).send({ status: 'RESOLVED' });
    expect(resPassOld.status).toBe(200);
  });

  it('WF-05: stale ticket version -> 409', async () => {
    const ticket = await createTicket({ requesterId: reqAuth.id, status: 'NEW' });
    const p1 = staffAgent.post(`/api/tickets/${ticket.id}/status`).send({ status: 'OPEN', version: 1 });
    const p2 = staffAgent.post(`/api/tickets/${ticket.id}/status`).send({ status: 'OPEN', version: 1 });
    const [res1, res2] = await Promise.all([p1, p2]);
    const statuses = [res1.status, res2.status].sort();
    expect(statuses).toEqual([200, 409]);
    
    const history = await prisma.ticketStatusHistory.findMany({ where: { ticketId: ticket.id } });
    expect(history.length).toBe(1);
    const updated = await prisma.ticket.findUnique({ where: { id: ticket.id } });
    expect(updated?.version).toBe(2);

    // Stale version on old route
    const resOldStale = await staffAgent.patch(`/staff/tickets/${ticket.id}/status`).send({ status: 'IN_PROGRESS', version: 1 });
    expect(resOldStale.status).toBe(409);

    // Omitted version on old route still works
    const resOldOmitted = await staffAgent.patch(`/staff/tickets/${ticket.id}/status`).send({ status: 'IN_PROGRESS' });
    expect(resOldOmitted.status).toBe(200);
  });

  it('WF-06: assign active staff', async () => {
    const ticket = await createTicket({ requesterId: reqAuth.id, status: 'OPEN' });
    
    // Missing version is allowed
    const resOmitted = await adminAgent.patch(`/staff/tickets/${ticket.id}/owner`).send({ ownerId: adminAuth.id });
    expect(resOmitted.status).toBe(200);
    expect(resOmitted.body.version).toBe(2);

    // Provide version
    const res = await adminAgent.patch(`/staff/tickets/${ticket.id}/owner`).send({ version: 2, ownerId: staffAuth.id });
    expect(res.status).toBe(200);
    expect(res.body.owner.id).toBe(staffAuth.id);
    expect(res.body.version).toBe(3);

    // Wrong version
    const resWrong = await adminAgent.patch(`/staff/tickets/${ticket.id}/owner`).send({ version: 1, ownerId: staffAuth.id });
    expect(resWrong.status).toBe(409);

    // Invalid version
    const resInvalid = await adminAgent.patch(`/staff/tickets/${ticket.id}/owner`).send({ version: 'invalid', ownerId: staffAuth.id });
    expect(resInvalid.status).toBe(422);
    expect(resInvalid.body.error?.code).toBe('VALIDATION_FAILED');
  });

  it('WF-07: inactive/non-staff assignee rejected', async () => {
    const ticket = await createTicket({ requesterId: reqAuth.id, status: 'OPEN' });
    const res = await adminAgent.patch(`/staff/tickets/${ticket.id}/owner`).send({ version: 1, ownerId: inactiveStaffAuth.id });
    expect(res.status).toBe(422);
    expect(res.body.error?.code || res.body.error).toMatch(/INVALID_ASSIGNEE|Cannot assign an inactive user/);
    
    const res2 = await adminAgent.patch(`/staff/tickets/${ticket.id}/owner`).send({ version: 1, ownerId: otherReqAuth.id });
    expect(res2.status).toBe(422);
  });

  it('WF-08: allowed-transitions endpoint', async () => {
    const ticket = await createTicket({ requesterId: reqAuth.id, status: 'IN_PROGRESS' });
    const res = await staffAgent.get(`/api/tickets/${ticket.id}/allowed-transitions`);
    expect(res.status).toBe(200);
    expect(res.body.currentStatus).toBe('IN_PROGRESS');
    expect(res.body.version).toBe(1);
    expect(res.body.allowedTransitions).toContain('RESOLVED');
  });

  it('WF-09: append-only status history, stable order', async () => {
    const ticket = await createTicket({ requesterId: reqAuth.id, status: 'NEW', requesterMarkedResolvedAt: new Date() });
    await staffAgent.post(`/api/tickets/${ticket.id}/status`).send({ status: 'OPEN', version: 1 });
    // Use old route to prove it appends history and clears requesterMarkedResolvedAt
    await staffAgent.patch(`/staff/tickets/${ticket.id}/status`).send({ status: 'IN_PROGRESS', version: 2 });
    
    const history = await prisma.ticketStatusHistory.findMany({ where: { ticketId: ticket.id }, orderBy: [{ changedAt: 'asc' }, { id: 'asc' }] });
    expect(history.length).toBe(2);
    expect(history[0].fromStatus).toBe('NEW');
    expect(history[0].toStatus).toBe('OPEN');
    expect(history[1].fromStatus).toBe('OPEN');
    expect(history[1].toStatus).toBe('IN_PROGRESS');

    const updatedTicket = await prisma.ticket.findUnique({ where: { id: ticket.id } });
    expect(updatedTicket?.version).toBe(3);
    expect(updatedTicket?.requesterMarkedResolvedAt).toBeNull();
  });

  it('WF-10: Requester cannot see Internal Notes', async () => {
    const ticket = await createTicket({ requesterId: reqAuth.id, status: 'OPEN' });
    const res = await reqAgent.get(`/api/tickets/${ticket.id}/notes`);
    expect(res.status).toBe(403);
    
    const detail = await reqAgent.get(`/api/tickets/${ticket.id}`);
    expect(detail.body.internalNotes).toBeUndefined();
  });

  it('AUTHZ-05: Requester sets RESOLVED -> 403', async () => {
    const ticket = await createTicket({ requesterId: reqAuth.id, status: 'IN_PROGRESS' });
    const res = await reqAgent.post(`/api/tickets/${ticket.id}/status`).send({ status: 'RESOLVED', version: 1 });
    expect(res.status).toBe(403);
  });
});
