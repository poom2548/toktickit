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
  { from: 'WAITING_FOR_REQUESTER', to: 'CANCELLED', roles: ['IT_STAFF', 'ADMINISTRATOR'] },
  { from: 'RESOLVED', to: 'CLOSED', roles: ['IT_STAFF', 'ADMINISTRATOR'] },
  { from: 'RESOLVED', to: 'REOPENED', roles: ['REQUESTER', 'IT_STAFF', 'ADMINISTRATOR'], requesterOwnOnly: true },
  { from: 'REOPENED', to: 'OPEN', roles: ['IT_STAFF', 'ADMINISTRATOR'] },
  { from: 'REOPENED', to: 'IN_PROGRESS', roles: ['IT_STAFF', 'ADMINISTRATOR'] },
  { from: 'REOPENED', to: 'CANCELLED', roles: ['IT_STAFF', 'ADMINISTRATOR'] },
];

function getOracleAllowedTransitions(status: TicketStatus, role: RoleName, isOwner: boolean): TicketStatus[] {
  return matrix.filter(rule => {
    if (rule.from !== status) return false;
    if (!rule.roles.includes(role)) return false;
    if (role === 'REQUESTER' && rule.requesterOwnOnly && !isOwner) return false;
    return true;
  }).map(r => r.to);
}

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

  // Shared tickets per status for read-only & rejected tests
  const statusTickets: Record<string, any> = {};

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

    for (const st of ['NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'RESOLVED', 'REOPENED', 'CLOSED', 'CANCELLED'] as TicketStatus[]) {
      statusTickets[st] = await createTicket({ requesterId: reqAuth.id, status: st, version: 1 });
    }
  });

  afterAll(async () => {
    await prisma.ticketStatusHistory.deleteMany();
    await resetTestData();
  });

  const ALL_STATUSES = ['NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'RESOLVED', 'REOPENED', 'CLOSED', 'CANCELLED'] as TicketStatus[];
  
  interface ActorDef {
    key: string;
    role: RoleName;
    isOwner: boolean;
    agent: () => request.SuperAgentTest;
    auth: () => User;
  }

  const ACTORS: ActorDef[] = [
    { key: 'REQUESTER_OWNER', role: 'REQUESTER', isOwner: true, agent: () => reqAgent, auth: () => reqAuth },
    { key: 'REQUESTER_NON_OWNER', role: 'REQUESTER', isOwner: false, agent: () => otherReqAgent, auth: () => otherReqAuth },
    { key: 'IT_STAFF', role: 'IT_STAFF', isOwner: false, agent: () => staffAgent, auth: () => staffAuth },
    { key: 'ADMINISTRATOR', role: 'ADMINISTRATOR', isOwner: false, agent: () => adminAgent, auth: () => adminAuth },
  ];

  describe('WF-01 & WF-02 Table-Driven Tests (256 combinations: 8x8x4)', () => {
    for (const from of ALL_STATUSES) {
      for (const to of ALL_STATUSES) {
        for (const actor of ACTORS) {
          const rule = matrix.find(r => r.from === from && r.to === to);
          const isAllowed = from !== to && !!rule && rule.roles.includes(actor.role) && (actor.role !== 'REQUESTER' || actor.isOwner);

          if (isAllowed) {
            it(`WF-01: allowed transitions - ${actor.key} moving ${from} -> ${to}`, async () => {
              const ticket = await createTicket({ requesterId: reqAuth.id, status: from, version: 1, requesterMarkedResolvedAt: new Date() });
              if (rule!.gated) {
                await prisma.ticket.update({ where: { id: ticket.id }, data: { ownerId: staffAuth.id } });
                await prisma.actionTaken.create({ data: { ticketId: ticket.id, actionAt: new Date(), description: 'fix', result: 'done', performedById: staffAuth.id } });
              }

              const res = await actor.agent()
                .post(`/api/tickets/${ticket.id}/status`)
                .send({ status: to, version: ticket.version });

              expect(res.status, `Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`).toBe(200);
              expect(res.body.status).toBe(to);
              expect(res.body.version).toBe(ticket.version + 1);

              // Allowlist check on response payload
              const expectedKeys = ['id', 'owner', 'requesterMarkedResolvedAt', 'status', 'ticketNumber', 'updatedAt', 'version'].sort();
              expect(Object.keys(res.body).sort()).toEqual(expectedKeys);

              const history = await prisma.ticketStatusHistory.findMany({ where: { ticketId: ticket.id } });
              expect(history.length).toBe(1);
              expect(history[0].fromStatus).toBe(from);
              expect(history[0].toStatus).toBe(to);
              expect(history[0].changedById).toBe(actor.auth().id);

              const updatedTicket = await prisma.ticket.findUnique({ where: { id: ticket.id } });
              expect(updatedTicket?.requesterMarkedResolvedAt).toBeNull();
            });
          } else {
            it(`WF-02: disallowed -> 422/403, unchanged - ${actor.key} moving ${from} -> ${to}`, async () => {
              const ticket = statusTickets[from];
              const historyBefore = await prisma.ticketStatusHistory.count({ where: { ticketId: ticket.id } });

              const res = await actor.agent()
                .post(`/api/tickets/${ticket.id}/status`)
                .send({ status: to, version: ticket.version });

              if (actor.key === 'REQUESTER_NON_OWNER') {
                expect(res.status).toBe(403);
                expect(res.body.error?.code).toBe('FORBIDDEN');
                expect(res.body).not.toHaveProperty('currentStatus');
                expect(res.body).not.toHaveProperty('allowedTransitions');
              } else if (rule && !rule.roles.includes(actor.role)) {
                expect(res.status).toBe(403);
                expect(res.body.error?.code).toBe('FORBIDDEN');
              } else {
                expect(res.status).toBe(422);
                expect(res.body.error?.code).toBe('INVALID_TRANSITION');
              }

              const updatedTicket = await prisma.ticket.findUnique({ where: { id: ticket.id } });
              expect(updatedTicket?.status).toBe(from);
              expect(updatedTicket?.version).toBe(ticket.version);

              const historyAfter = await prisma.ticketStatusHistory.count({ where: { ticketId: ticket.id } });
              expect(historyAfter).toBe(historyBefore);
            });
          }
        }
      }
    }

    it('WF-02: invalid body fields and resolution gate failures', async () => {
      const ticket = await createTicket({ requesterId: reqAuth.id, status: 'IN_PROGRESS' });
      // Missing status
      const res1 = await staffAgent.post(`/api/tickets/${ticket.id}/status`).send({ version: 1 });
      expect(res1.status).toBe(422);
      expect(res1.body.error?.code).toBe('VALIDATION_FAILED');

      // Invalid status string
      const res2 = await staffAgent.post(`/api/tickets/${ticket.id}/status`).send({ status: 'INVALID', version: 1 });
      expect(res2.status).toBe(422);
      expect(res2.body.error?.code).toBe('VALIDATION_FAILED');

      // Gated transition without prereqs
      const res3 = await staffAgent.post(`/api/tickets/${ticket.id}/status`).send({ status: 'RESOLVED', version: 1 });
      expect(res3.status).toBe(422);
      expect(res3.body.error?.code).toBe('RESOLUTION_GATE_FAILED');
    });
  });

  describe('WF-03', () => {
    it('WF-03: appears resolved does not change status', async () => {
      const ticket = await createTicket({ requesterId: reqAuth.id, status: 'OPEN' });
      const res = await reqAgent
        .post(`/api/tickets/${ticket.id}/requester-resolved-indication`)
        .send({ problemAppearsResolved: true });
      
      expect(res.status, `Expected 200, got ${res.status}`).toBe(200);
      expect(res.body.status).toBe('OPEN');
      expect(res.body.version).toBe(1);
      expect(res.body.problemAppearsResolved).toBe(true);
      expect(res.body.requesterMarkedResolvedAt).not.toBeNull();
      
      const resStaff = await staffAgent.get(`/staff/tickets/${ticket.id}`);
      expect(resStaff.body.requesterMarkedResolvedAt).not.toBeNull();
    });

    it('WF-03: indication validation, role gating and status state restriction', async () => {
      const openTicket = await createTicket({ requesterId: reqAuth.id, status: 'OPEN' });
      
      // Missing or non-boolean problemAppearsResolved -> 422
      const resMissing = await reqAgent.post(`/api/tickets/${openTicket.id}/requester-resolved-indication`).send({});
      expect(resMissing.status).toBe(422);
      expect(resMissing.body.error?.code).toBe('VALIDATION_FAILED');
      expect(resMissing.body.error?.fields?.problemAppearsResolved).toBeDefined();

      const resNonBool = await reqAgent.post(`/api/tickets/${openTicket.id}/requester-resolved-indication`).send({ problemAppearsResolved: 'yes' });
      expect(resNonBool.status).toBe(422);
      expect(resNonBool.body.error?.code).toBe('VALIDATION_FAILED');

      // Non-owner requester -> 403
      const resOther = await otherReqAgent.post(`/api/tickets/${openTicket.id}/requester-resolved-indication`).send({ problemAppearsResolved: true });
      expect(resOther.status).toBe(403);
      expect(resOther.body.error?.code).toBe('FORBIDDEN');

      // Staff / Admin -> 403
      const resStaff = await staffAgent.post(`/api/tickets/${openTicket.id}/requester-resolved-indication`).send({ problemAppearsResolved: true });
      expect(resStaff.status).toBe(403);
      expect(resStaff.body.error?.code).toBe('FORBIDDEN');

      // Unknown ticket -> 404
      const res404 = await reqAgent.post(`/api/tickets/999999/requester-resolved-indication`).send({ problemAppearsResolved: true });
      expect(res404.status).toBe(404);

      // Status restrictions: NEW, RESOLVED, CLOSED, CANCELLED -> 409 INVALID_TICKET_STATE
      for (const st of ['NEW', 'RESOLVED', 'CLOSED', 'CANCELLED'] as TicketStatus[]) {
        const t = await createTicket({ requesterId: reqAuth.id, status: st });
        const resSt = await reqAgent.post(`/api/tickets/${t.id}/requester-resolved-indication`).send({ problemAppearsResolved: true });
        expect(resSt.status).toBe(409);
        expect(resSt.body.error?.code).toBe('INVALID_TICKET_STATE');
      }
    });

    it('WF-03: idempotency by design and by header, flag cleared by status change', async () => {
      const ticket = await createTicket({ requesterId: reqAuth.id, status: 'IN_PROGRESS' });

      // First indication: sets timestamp
      const res1 = await reqAgent.post(`/api/tickets/${ticket.id}/requester-resolved-indication`).send({ problemAppearsResolved: true });
      expect(res1.status).toBe(200);
      const firstTimestamp = res1.body.requesterMarkedResolvedAt;
      const t1 = await prisma.ticket.findUnique({ where: { id: ticket.id } });
      const firstUpdatedAt = t1!.updatedAt;

      // Repeated true: keeps original timestamp and performs NO database write (updatedAt unchanged)
      const res2 = await reqAgent.post(`/api/tickets/${ticket.id}/requester-resolved-indication`).send({ problemAppearsResolved: true });
      expect(res2.status).toBe(200);
      expect(res2.body.requesterMarkedResolvedAt).toBe(firstTimestamp);
      const t2 = await prisma.ticket.findUnique({ where: { id: ticket.id } });
      expect(t2!.updatedAt.toISOString()).toBe(firstUpdatedAt.toISOString());

      // Setting false: clears flag
      const resFalse = await reqAgent.post(`/api/tickets/${ticket.id}/requester-resolved-indication`).send({ problemAppearsResolved: false });
      expect(resFalse.status).toBe(200);
      expect(resFalse.body.requesterMarkedResolvedAt).toBeNull();
      expect(resFalse.body.problemAppearsResolved).toBe(false);

      // Repeated false: no-op, updatedAt unchanged
      const t3 = await prisma.ticket.findUnique({ where: { id: ticket.id } });
      const thirdUpdatedAt = t3!.updatedAt;
      const resFalse2 = await reqAgent.post(`/api/tickets/${ticket.id}/requester-resolved-indication`).send({ problemAppearsResolved: false });
      expect(resFalse2.status).toBe(200);
      const t4 = await prisma.ticket.findUnique({ where: { id: ticket.id } });
      expect(t4!.updatedAt.toISOString()).toBe(thirdUpdatedAt.toISOString());

      // Idempotency-Key support
      const idemKey = 'key-ind-' + Date.now();
      const resIdem1 = await reqAgent
        .post(`/api/tickets/${ticket.id}/requester-resolved-indication`)
        .set('Idempotency-Key', idemKey)
        .send({ problemAppearsResolved: true });
      expect(resIdem1.status).toBe(200);

      const resIdemReplay = await reqAgent
        .post(`/api/tickets/${ticket.id}/requester-resolved-indication`)
        .set('Idempotency-Key', idemKey)
        .send({ problemAppearsResolved: true });
      expect(resIdemReplay.status).toBe(200);
      expect(resIdemReplay.header['idempotent-replayed']).toBe('true');

      // Idempotency-Key with different body -> 422
      const resIdemMismatch = await reqAgent
        .post(`/api/tickets/${ticket.id}/requester-resolved-indication`)
        .set('Idempotency-Key', idemKey)
        .send({ problemAppearsResolved: false });
      expect(resIdemMismatch.status).toBe(422);
      expect(resIdemMismatch.body.error?.code).toBe('IDEMPOTENCY_KEY_REUSED');

      // Status change via new route clears flag
      await staffAgent.post(`/api/tickets/${ticket.id}/status`).send({ status: 'WAITING_FOR_REQUESTER', version: ticket.version });
      const clearedTicket = await prisma.ticket.findUnique({ where: { id: ticket.id } });
      expect(clearedTicket?.requesterMarkedResolvedAt).toBeNull();
      expect(clearedTicket?.problemAppearsResolved).toBe(false);
    });
  });

  describe('WF-04', () => {
    it('WF-04: resolution gate pass/fail', async () => {
      const ticket = await createTicket({ requesterId: reqAuth.id, status: 'IN_PROGRESS' });
      // NEW ROUTE
      const resFail = await staffAgent
        .post(`/api/tickets/${ticket.id}/status`)
        .send({ status: 'RESOLVED', version: 1 });
      expect(resFail.status).toBe(422);
      expect(resFail.body.error.code).toBe('RESOLUTION_GATE_FAILED');
      expect(resFail.body.error.message).toBeDefined();

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
      const resPassOld = await staffAgent.patch(`/staff/tickets/${ticket.id}/status`).send({ status: 'RESOLVED', version: 1 });
      expect(resPassOld.status).toBe(200);
    });
  });

  describe('WF-05', () => {
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
    });

    it('WF-05: version validation on POST /api/tickets/:id/status', async () => {
      const ticket = await createTicket({ requesterId: reqAuth.id, status: 'NEW' });
      
      // Missing version -> 422
      const resMissing = await staffAgent.post(`/api/tickets/${ticket.id}/status`).send({ status: 'OPEN' });
      expect(resMissing.status).toBe(422);
      expect(resMissing.body.error?.code).toBe('VALIDATION_FAILED');
      expect(resMissing.body.error?.fields?.version).toBeDefined();

      // Non-integer version -> 422
      const resFloat = await staffAgent.post(`/api/tickets/${ticket.id}/status`).send({ status: 'OPEN', version: 1.5 });
      expect(resFloat.status).toBe(422);
      expect(resFloat.body.error?.code).toBe('VALIDATION_FAILED');

      // Zero or negative version -> 422
      const resZero = await staffAgent.post(`/api/tickets/${ticket.id}/status`).send({ status: 'OPEN', version: 0 });
      expect(resZero.status).toBe(422);
      expect(resZero.body.error?.code).toBe('VALIDATION_FAILED');

      const resNeg = await staffAgent.post(`/api/tickets/${ticket.id}/status`).send({ status: 'OPEN', version: -1 });
      expect(resNeg.status).toBe(422);
      expect(resNeg.body.error?.code).toBe('VALIDATION_FAILED');

      // Stale version -> 409 CONFLICT with currentVersion
      const resStale = await staffAgent.post(`/api/tickets/${ticket.id}/status`).send({ status: 'OPEN', version: 999 });
      expect(resStale.status).toBe(409);
      expect(resStale.body.error?.code).toBe('CONFLICT');
      expect(resStale.body.error?.currentVersion).toBe(1);
    });

    it('WF-05: legacy routes require version (compatibility window closed)', async () => {
      const ticket = await createTicket({ requesterId: reqAuth.id, status: 'OPEN' });

      // Legacy status route: missing version -> 422 VALIDATION_FAILED
      const resStatusOmitted = await staffAgent.patch(`/staff/tickets/${ticket.id}/status`).send({ status: 'IN_PROGRESS' });
      expect(resStatusOmitted.status).toBe(422);
      expect(resStatusOmitted.body.error?.code).toBe('VALIDATION_FAILED');
      expect(resStatusOmitted.body.error?.fields?.version).toBeDefined();

      // Legacy status route: stale version -> 409 CONFLICT
      const resStatusStale = await staffAgent.patch(`/staff/tickets/${ticket.id}/status`).send({ status: 'WAITING_FOR_REQUESTER', version: 0 });
      expect(resStatusStale.status).toBe(409);
      expect(resStatusStale.body.error?.code).toBe('CONFLICT');

      // Legacy status route: valid version succeeds and increments version
      const resStatusValid = await staffAgent.patch(`/staff/tickets/${ticket.id}/status`).send({ status: 'IN_PROGRESS', version: 1 });
      expect(resStatusValid.status).toBe(200);
      const afterStatus = await prisma.ticket.findUnique({ where: { id: ticket.id } });
      expect(afterStatus?.version).toBe(2);

      // Legacy owner route: missing version -> 422 VALIDATION_FAILED
      const resOwnerOmitted = await staffAgent.patch(`/staff/tickets/${ticket.id}/owner`).send({ ownerId: staffAuth.id });
      expect(resOwnerOmitted.status).toBe(422);
      expect(resOwnerOmitted.body.error?.code).toBe('VALIDATION_FAILED');
      expect(resOwnerOmitted.body.error?.fields?.version).toBeDefined();

      // Legacy owner route: stale version -> 409 CONFLICT
      const resOwnerStale = await staffAgent.patch(`/staff/tickets/${ticket.id}/owner`).send({ ownerId: staffAuth.id, version: 1 });
      expect(resOwnerStale.status).toBe(409);
      expect(resOwnerStale.body.error?.code).toBe('CONFLICT');

      // Legacy owner route: invalid version (string) -> 422 VALIDATION_FAILED
      const resOwnerInvalid = await staffAgent.patch(`/staff/tickets/${ticket.id}/owner`).send({ ownerId: staffAuth.id, version: 'abc' });
      expect(resOwnerInvalid.status).toBe(422);
      expect(resOwnerInvalid.body.error?.code).toBe('VALIDATION_FAILED');

      // Legacy owner route: valid version succeeds and increments version
      const resOwnerValid = await staffAgent.patch(`/staff/tickets/${ticket.id}/owner`).send({ ownerId: staffAuth.id, version: 2 });
      expect(resOwnerValid.status).toBe(200);
      expect(resOwnerValid.body.version).toBe(3);
    });

    it('WF-05: idempotency key replay and forced server error handling', async () => {
      const ticket = await createTicket({ requesterId: reqAuth.id, status: 'NEW' });
      const idemKey = 'key-status-' + Date.now();

      // First call
      const res1 = await staffAgent
        .post(`/api/tickets/${ticket.id}/status`)
        .set('Idempotency-Key', idemKey)
        .send({ status: 'OPEN', version: 1 });
      expect(res1.status).toBe(200);

      // Replay with same body
      const resReplay = await staffAgent
        .post(`/api/tickets/${ticket.id}/status`)
        .set('Idempotency-Key', idemKey)
        .send({ status: 'OPEN', version: 1 });
      expect(resReplay.status).toBe(200);
      expect(resReplay.header['idempotent-replayed']).toBe('true');

      // Replay with different body -> 422
      const resMismatch = await staffAgent
        .post(`/api/tickets/${ticket.id}/status`)
        .set('Idempotency-Key', idemKey)
        .send({ status: 'CANCELLED', version: 1 });
      expect(resMismatch.status).toBe(422);
      expect(resMismatch.body.error?.code).toBe('IDEMPOTENCY_KEY_REUSED');

      // Forced server error (simulate internal DB failure)
      const mockTicket = await createTicket({ requesterId: reqAuth.id, status: 'OPEN' });
      const origTransaction = prisma.$transaction;
      (prisma as any).$transaction = async () => { throw new Error('Simulated internal DB failure'); };
      try {
        const res500 = await staffAgent
          .post(`/api/tickets/${mockTicket.id}/status`)
          .send({ status: 'IN_PROGRESS', version: 1 });
        expect(res500.status).toBe(500);
        expect(res500.body.error?.code).toBe('INTERNAL_ERROR');
        expect(res500.body.error?.message).toBe('An unexpected error occurred');
        expect(res500.body.error).not.toHaveProperty('stack');
        expect(res500.body.error).not.toHaveProperty('sql');
      } finally {
        prisma.$transaction = origTransaction;
      }
    });
  });

  describe('WF-06 & WF-07', () => {
    it('WF-06: assign active staff', async () => {
      const ticket = await createTicket({ requesterId: reqAuth.id, status: 'OPEN' });
      
      const res = await adminAgent.patch(`/staff/tickets/${ticket.id}/owner`).send({ version: 1, ownerId: staffAuth.id });
      expect(res.status).toBe(200);
      expect(res.body.owner.id).toBe(staffAuth.id);
      expect(res.body.version).toBe(2);

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
  });

  describe('API-24', () => {
    it('API-24: GET /staff/assignable-users active staff and admins only, ordered, no-store', async () => {
      // Unauthenticated -> 401
      const resUnauth = await request(app).get('/staff/assignable-users');
      expect(resUnauth.status).toBe(401);

      // Requester -> 403
      const resReq = await reqAgent.get('/staff/assignable-users');
      expect(resReq.status).toBe(403);

      // Staff -> 200
      const resStaff = await staffAgent.get('/staff/assignable-users');
      expect(resStaff.status).toBe(200);
      expect(resStaff.headers['cache-control']).toMatch(/no-store/);
      expect(resStaff.body).toHaveProperty('users');
      expect(Array.isArray(resStaff.body.users)).toBe(true);
      expect(resStaff.body.users.length).toBeGreaterThan(0);

      // Admin -> 200
      const resAdmin = await adminAgent.get('/staff/assignable-users');
      expect(resAdmin.status).toBe(200);
      expect(resAdmin.headers['cache-control']).toMatch(/no-store/);

      // Check fields and membership: only active IT_STAFF and ADMINISTRATOR
      for (const u of resStaff.body.users) {
        expect(u).toHaveProperty('id');
        expect(u).toHaveProperty('name');
        expect(u).toHaveProperty('role');
        expect(['IT_STAFF', 'ADMINISTRATOR']).toContain(u.role);
        expect(u).not.toHaveProperty('passwordHash');
      }

      // Inactive staff must not be present
      const inactiveFound = resStaff.body.users.find((u: any) => u.id === inactiveStaffAuth.id);
      expect(inactiveFound).toBeUndefined();

      // Requester user must not be present
      const reqFound = resStaff.body.users.find((u: any) => u.id === reqAuth.id);
      expect(reqFound).toBeUndefined();

      // Check sorting: name asc, then id asc
      const users = resStaff.body.users;
      for (let i = 0; i < users.length - 1; i++) {
        const cmp = users[i].name.localeCompare(users[i + 1].name);
        if (cmp === 0) {
          expect(users[i].id.localeCompare(users[i + 1].id)).toBeLessThanOrEqual(0);
        } else {
          expect(cmp).toBeLessThan(0);
        }
      }
    });
  });

  describe('WF-08: allowed-transitions endpoint (32 combinations: 8 statuses x 4 actors)', () => {
    for (const st of ALL_STATUSES) {
      for (const actor of ACTORS) {
        it(`WF-08: allowed-transitions for ${actor.key} on ${st}`, async () => {
          const ticket = statusTickets[st];
          const res = await actor.agent().get(`/api/tickets/${ticket.id}/allowed-transitions`);

          if (actor.key === 'REQUESTER_NON_OWNER') {
            expect(res.status).toBe(403);
            expect(res.body.error?.code).toBe('FORBIDDEN');
            expect(res.body).not.toHaveProperty('currentStatus');
            expect(res.body).not.toHaveProperty('allowedTransitions');
          } else {
            expect(res.status).toBe(200);
            expect(res.body.currentStatus).toBe(st);
            expect(res.body.version).toBe(ticket.version);
            const expected = getOracleAllowedTransitions(st, actor.role, actor.isOwner);
            expect(res.body.allowedTransitions).toEqual(expected);
          }
        });
      }
    }

    it('WF-08: auth and not found checks', async () => {
      const ticket = statusTickets['OPEN'];
      const resAnon = await request(app).get(`/api/tickets/${ticket.id}/allowed-transitions`);
      expect(resAnon.status).toBe(401);

      const res404 = await staffAgent.get(`/api/tickets/999999/allowed-transitions`);
      expect(res404.status).toBe(404);
    });
  });

  describe('WF-09', () => {
    it('WF-09: append-only status history, stable order', async () => {
      const ticket = await createTicket({ requesterId: reqAuth.id, status: 'NEW', requesterMarkedResolvedAt: new Date() });
      await staffAgent.post(`/api/tickets/${ticket.id}/status`).send({ status: 'OPEN', version: 1 });
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
  });

  describe('WF-10', () => {
    it('WF-10: Requester cannot see Internal Notes', async () => {
      const ticket = await createTicket({ requesterId: reqAuth.id, status: 'OPEN' });
      const res = await reqAgent.get(`/api/tickets/${ticket.id}/notes`);
      expect(res.status).toBe(403);
      
      const detail = await reqAgent.get(`/api/tickets/${ticket.id}`);
      expect(detail.body.internalNotes).toBeUndefined();
    });

    it('WF-10: payload allowlist and absence of internal/staff-only fields', async () => {
      const ticket = await createTicket({ requesterId: reqAuth.id, status: 'OPEN' });
      const resStatus = await staffAgent.post(`/api/tickets/${ticket.id}/status`).send({ status: 'IN_PROGRESS', version: 1 });
      expect(resStatus.status).toBe(200);

      // Key sets on status change response
      const statusAllowedKeys = ['id', 'owner', 'requesterMarkedResolvedAt', 'status', 'ticketNumber', 'updatedAt', 'version'].sort();
      expect(Object.keys(resStatus.body).sort()).toEqual(statusAllowedKeys);
      expect(resStatus.body).not.toHaveProperty('email');
      expect(resStatus.body).not.toHaveProperty('passwordHash');
      expect(resStatus.body).not.toHaveProperty('internalNotes');
      expect(resStatus.body).not.toHaveProperty('itPriority');
      expect(resStatus.body).not.toHaveProperty('description');

      // Key sets on resolved indication response
      const resInd = await reqAgent.post(`/api/tickets/${ticket.id}/requester-resolved-indication`).send({ problemAppearsResolved: true });
      expect(resInd.status).toBe(200);
      const indAllowedKeys = ['id', 'owner', 'problemAppearsResolved', 'requesterMarkedResolvedAt', 'status', 'ticketNumber', 'updatedAt', 'version'].sort();
      expect(Object.keys(resInd.body).sort()).toEqual(indAllowedKeys);
      expect(resInd.body).not.toHaveProperty('email');
      expect(resInd.body).not.toHaveProperty('passwordHash');
      expect(resInd.body).not.toHaveProperty('internalNotes');
      expect(resInd.body).not.toHaveProperty('itPriority');
    });
  });

  describe('AUTHZ-05', () => {
    it('AUTHZ-05: Requester sets RESOLVED -> 403', async () => {
      const ticket = await createTicket({ requesterId: reqAuth.id, status: 'IN_PROGRESS' });
      const res = await reqAgent.post(`/api/tickets/${ticket.id}/status`).send({ status: 'RESOLVED', version: 1 });
      expect(res.status).toBe(403);
    });

    it('AUTHZ-05: ownership checks, role spoofing and staff routes authorization', async () => {
      const ticket = await createTicket({ requesterId: reqAuth.id, status: 'OPEN' });

      // Non-owner requester POST status with valid body -> 403
      const resOtherValid = await otherReqAgent.post(`/api/tickets/${ticket.id}/status`).send({ status: 'CANCELLED', version: 1 });
      expect(resOtherValid.status).toBe(403);
      expect(resOtherValid.body.error?.code).toBe('FORBIDDEN');

      // Non-owner requester POST status with invalid body -> 403 (auth checked before body validation)
      const resOtherInvalid = await otherReqAgent.post(`/api/tickets/${ticket.id}/status`).send({ status: 'INVALID', version: 1 });
      expect(resOtherInvalid.status).toBe(403);
      expect(resOtherInvalid.body.error?.code).toBe('FORBIDDEN');

      // Non-owner requester POST status with stale version -> 403 (auth checked before version)
      const resOtherStale = await otherReqAgent.post(`/api/tickets/${ticket.id}/status`).send({ status: 'CANCELLED', version: 999 });
      expect(resOtherStale.status).toBe(403);
      expect(resOtherStale.body.error?.code).toBe('FORBIDDEN');

      // Role spoofing in body does not bypass auth
      const resSpoof = await reqAgent.post(`/api/tickets/${ticket.id}/status`).send({ status: 'IN_PROGRESS', version: 1, role: 'IT_STAFF', requesterId: staffAuth.id });
      expect(resSpoof.status).toBe(403);

      // Requester accessing staff routes -> 403
      const resStaffStatus = await reqAgent.patch(`/staff/tickets/${ticket.id}/status`).send({ status: 'IN_PROGRESS' });
      expect(resStaffStatus.status).toBe(403);

      const resStaffOwner = await reqAgent.patch(`/staff/tickets/${ticket.id}/owner`).send({ ownerId: staffAuth.id });
      expect(resStaffOwner.status).toBe(403);
    });
  });
});
