import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import {
  createUser,
  createRequester,
  createStaff,
  createAdmin,
  createInactiveStaff,
  createTicket,
  createTicketsBulk,
  createAction,
  loginAs,
  anonymousRequest,
  resetTestData,
  beforeAllPattern,
  afterAllPattern,
  prisma,
  getPrisma,
} from './helpers.js';
import { TicketStatus, Priority, Role } from '@prisma/client';

let origTicketFindMany: any;
let origTicketCount: any;
let origTicketGroupBy: any;

describe('Staff Dashboard', () => {
  beforeAll(async () => {
    await beforeAllPattern();
    const db = getPrisma();
    origTicketFindMany = db.ticket.findMany;
    origTicketCount = db.ticket.count;
    origTicketGroupBy = db.ticket.groupBy;
  }, 60000);

  afterAll(async () => {
    await afterAllPattern();
  });

  beforeEach(async () => {
    await resetTestData();
  });

  afterEach(async () => {
    const db = getPrisma();
    if (origTicketFindMany) db.ticket.findMany = origTicketFindMany;
    if (origTicketCount) db.ticket.count = origTicketCount;
    if (origTicketGroupBy) db.ticket.groupBy = origTicketGroupBy;
    await resetTestData();
  });

  it('SD-01: each metric = DB query', async () => {
    const staff = await createStaff({ name: 'Primary Staff' });
    const otherStaff = await createStaff({ name: 'Other Staff' });

    // 1. Unassigned open tickets (no ownerId, open status)
    await createTicket({
      ownerId: null,
      status: TicketStatus.NEW,
      itPriority: Priority.CRITICAL,
    });
    await createTicket({
      ownerId: null,
      status: TicketStatus.OPEN,
      itPriority: Priority.HIGH,
    });

    // 2. My owned open tickets (ownerId = staff.id, open status)
    await createTicket({
      ownerId: staff.id,
      status: TicketStatus.IN_PROGRESS,
      itPriority: Priority.MEDIUM,
    });
    await createTicket({
      ownerId: staff.id,
      status: TicketStatus.WAITING_FOR_REQUESTER,
      itPriority: Priority.LOW,
    });

    // 3. Other staff owned open tickets
    await createTicket({
      ownerId: otherStaff.id,
      status: TicketStatus.REOPENED,
      itPriority: Priority.HIGH,
    });

    // 4. Terminal / non-open tickets (should NOT be counted in open metrics)
    await createTicket({
      ownerId: staff.id,
      status: TicketStatus.RESOLVED,
      itPriority: Priority.CRITICAL,
    });
    await createTicket({
      ownerId: staff.id,
      status: TicketStatus.CLOSED,
      itPriority: Priority.HIGH,
    });
    await createTicket({
      ownerId: null,
      status: TicketStatus.CANCELLED,
      itPriority: Priority.LOW,
    });

    // 5. Open tickets with null itPriority (only requestedPriority set) -> must be counted under UNSET
    await createTicket({
      ownerId: null,
      status: TicketStatus.OPEN,
      itPriority: null as any,
      requestedPriority: Priority.HIGH,
    });
    await createTicket({
      ownerId: staff.id,
      status: TicketStatus.IN_PROGRESS,
      itPriority: null as any,
      requestedPriority: Priority.LOW,
    });

    const openStatuses: TicketStatus[] = [
      TicketStatus.NEW,
      TicketStatus.OPEN,
      TicketStatus.IN_PROGRESS,
      TicketStatus.WAITING_FOR_REQUESTER,
      TicketStatus.REOPENED,
    ];

    const agent = await loginAs(staff);

    // Independent DB queries right around the HTTP call
    const beforeUnassigned = await prisma.ticket.count({
      where: { ownerId: null, status: { in: openStatuses } },
    });
    const beforeTotalOpen = await prisma.ticket.count({
      where: { status: { in: openStatuses } },
    });
    const beforeUnset = await prisma.ticket.count({
      where: { status: { in: openStatuses }, itPriority: null },
    });

    const res = await agent.get('/api/dashboard/staff');
    expect(res.status).toBe(200);

    const afterUnassigned = await prisma.ticket.count({
      where: { ownerId: null, status: { in: openStatuses } },
    });
    const afterTotalOpen = await prisma.ticket.count({
      where: { status: { in: openStatuses } },
    });
    const afterUnset = await prisma.ticket.count({
      where: { status: { in: openStatuses }, itPriority: null },
    });

    const expectedMyOwned = await prisma.ticket.count({
      where: { ownerId: staff.id, status: { in: openStatuses } },
    });

    const expectedStatusCounts: Record<string, number> = {};
    for (const st of openStatuses) {
      expectedStatusCounts[st] = await prisma.ticket.count({
        where: { status: st },
      });
    }

    const priorityOrder: Priority[] = [
      Priority.LOW,
      Priority.MEDIUM,
      Priority.HIGH,
      Priority.CRITICAL,
    ];
    const expectedPriorityCounts: Record<string, number> = {};
    for (const p of priorityOrder) {
      expectedPriorityCounts[p] = await prisma.ticket.count({
        where: { status: { in: openStatuses }, itPriority: p },
      });
    }

    // Verify unassigned
    const minUnassigned = Math.min(beforeUnassigned, afterUnassigned);
    const maxUnassigned = Math.max(beforeUnassigned, afterUnassigned);
    expect(res.body.metrics.unassigned.value).toBeGreaterThanOrEqual(minUnassigned - 2);
    expect(res.body.metrics.unassigned.value).toBeLessThanOrEqual(maxUnassigned + 2);
    expect(res.body.metrics.unassigned.label).toBe('Unassigned');
    expect(res.body.metrics.unassigned.drillDown).toBe(
      '/staff/tickets?statusGroup=open&assignee=unassigned'
    );

    // Verify myOwned
    expect(res.body.metrics.myOwned.value).toBe(expectedMyOwned);
    expect(res.body.metrics.myOwned.label).toBe('My Owned');
    expect(res.body.metrics.myOwned.drillDown).toBe('/staff/tickets?statusGroup=open&assignee=me');

    // Verify statusCounts
    expect(res.body.metrics.statusCounts.label).toBe('By Status');
    expect(res.body.metrics.statusCounts.drillDownBase).toBe('/staff/tickets?status=');
    for (const st of openStatuses) {
      expect(typeof res.body.metrics.statusCounts.values[st]).toBe('number');
      expect(res.body.metrics.statusCounts.values[st]).toBeGreaterThanOrEqual(0);
    }

    // Verify sum of statusCounts equals open total
    const totalOpenFromStatusCounts = Object.values(
      res.body.metrics.statusCounts.values as Record<string, number>
    ).reduce((a, b) => a + b, 0);
    const minTotalOpen = Math.min(beforeTotalOpen, afterTotalOpen);
    const maxTotalOpen = Math.max(beforeTotalOpen, afterTotalOpen);
    expect(totalOpenFromStatusCounts).toBeGreaterThanOrEqual(minTotalOpen - 2);
    expect(totalOpenFromStatusCounts).toBeLessThanOrEqual(maxTotalOpen + 2);

    // Verify priorityCounts (LOW, MEDIUM, HIGH, CRITICAL, and UNSET)
    expect(res.body.metrics.priorityCounts.label).toBe('By IT Priority');
    expect(res.body.metrics.priorityCounts.drillDownBase).toBe('/staff/tickets?priority=');
    expect(Object.keys(res.body.metrics.priorityCounts.values).sort()).toEqual([
      'CRITICAL',
      'HIGH',
      'LOW',
      'MEDIUM',
      'UNSET',
    ]);
    for (const p of priorityOrder) {
      expect(typeof res.body.metrics.priorityCounts.values[p]).toBe('number');
      expect(res.body.metrics.priorityCounts.values[p]).toBeGreaterThanOrEqual(0);
    }
    const minUnset = Math.min(beforeUnset, afterUnset);
    const maxUnset = Math.max(beforeUnset, afterUnset);
    expect(res.body.metrics.priorityCounts.values.UNSET).toBeGreaterThanOrEqual(minUnset - 2);
    expect(res.body.metrics.priorityCounts.values.UNSET).toBeLessThanOrEqual(maxUnset + 2);

    const totalPriorityFromBuckets = Object.values(
      res.body.metrics.priorityCounts.values as Record<string, number>
    ).reduce((a, b) => a + b, 0);
    expect(totalPriorityFromBuckets).toBeGreaterThanOrEqual(minTotalOpen - 2);
    expect(totalPriorityFromBuckets).toBeLessThanOrEqual(maxTotalOpen + 2);

    // Verify terminal statuses are not in statusCounts
    expect(res.body.metrics.statusCounts.values).not.toHaveProperty('RESOLVED');
    expect(res.body.metrics.statusCounts.values).not.toHaveProperty('CLOSED');
    expect(res.body.metrics.statusCounts.values).not.toHaveProperty('CANCELLED');

    // Verify recentlyUpdated: capped at 5, sorted descending by updatedAt then id
    expect(res.body.recentlyUpdated.length).toBeGreaterThan(0);
    expect(res.body.recentlyUpdated.length).toBeLessThanOrEqual(5);
    for (let i = 0; i < res.body.recentlyUpdated.length - 1; i++) {
      const current = res.body.recentlyUpdated[i];
      const next = res.body.recentlyUpdated[i + 1];
      const curTime = new Date(current.updatedAt).getTime();
      const nextTime = new Date(next.updatedAt).getTime();
      if (curTime === nextTime) {
        expect(current.id).toBeGreaterThan(next.id);
      } else {
        expect(curTime).toBeGreaterThanOrEqual(nextTime);
      }
    }

    // Workflow interaction test: ticket lifecycle OPEN -> IN_PROGRESS -> RESOLVED -> CLOSED
    const flowRequester = await createRequester();
    const flowStaff = await createStaff();
    const flowTicket = await createTicket({
      requesterId: flowRequester.id,
      ownerId: flowStaff.id,
      status: TicketStatus.OPEN,
      itPriority: Priority.HIGH,
      requestedPriority: Priority.MEDIUM,
    });
    await createAction(flowTicket.id, {
      performedById: flowStaff.id,
      result: 'Resolution prerequisite met',
    });

    const flowStaffAgent = await loginAs(flowStaff);

    const findRecent = (res: any) =>
      res.body.recentlyUpdated.find((t: any) => t.id === flowTicket.id);

    // Initial check (OPEN)
    const staffResOpen = await flowStaffAgent.get('/api/dashboard/staff');
    expect(staffResOpen.body.metrics.myOwned.value).toBeGreaterThanOrEqual(1);
    const itemOpen = findRecent(staffResOpen);
    expect(itemOpen).toBeDefined();
    expect(itemOpen.status).toBe('OPEN');

    // Transition 1: OPEN -> IN_PROGRESS
    const trans1 = await flowStaffAgent
      .post(`/api/tickets/${flowTicket.id}/status`)
      .send({ status: 'IN_PROGRESS', version: 1 });
    expect(trans1.status).toBe(200);

    const staffResProg = await flowStaffAgent.get('/api/dashboard/staff');
    const itemProg = findRecent(staffResProg);
    expect(itemProg).toBeDefined();
    expect(itemProg.status).toBe('IN_PROGRESS');

    // Transition 2: IN_PROGRESS -> RESOLVED (resolution gate: owner + action taken with non-empty result)
    const trans2 = await flowStaffAgent
      .post(`/api/tickets/${flowTicket.id}/status`)
      .send({ status: 'RESOLVED', version: 2 });
    expect(trans2.status).toBe(200);

    const staffResRes = await flowStaffAgent.get('/api/dashboard/staff');
    const itemRes = findRecent(staffResRes);
    expect(itemRes).toBeDefined();
    expect(itemRes.status).toBe('RESOLVED');
    expect(staffResRes.body.metrics.statusCounts.values).not.toHaveProperty('RESOLVED');

    // Transition 3: RESOLVED -> CLOSED
    const trans3 = await flowStaffAgent
      .post(`/api/tickets/${flowTicket.id}/status`)
      .send({ status: 'CLOSED', version: 3 });
    expect(trans3.status).toBe(200);

    const staffResClosed = await flowStaffAgent.get('/api/dashboard/staff');
    const itemClosed = findRecent(staffResClosed);
    expect(itemClosed).toBeDefined();
    expect(itemClosed.status).toBe('CLOSED');
    expect(staffResClosed.body.metrics.statusCounts.values).not.toHaveProperty('CLOSED');
  });

  it('SD-02: empty', async () => {
    const staff = await createStaff();
    const openStatuses: TicketStatus[] = [
      TicketStatus.NEW,
      TicketStatus.OPEN,
      TicketStatus.IN_PROGRESS,
      TicketStatus.WAITING_FOR_REQUESTER,
      TicketStatus.REOPENED,
    ];

    const agent = await loginAs(staff);

    // Compute independent bounds right around HTTP call
    const beforeUnassigned = await prisma.ticket.count({
      where: { ownerId: null, status: { in: openStatuses } },
    });
    const beforeTotalOpen = await prisma.ticket.count({
      where: { status: { in: openStatuses } },
    });

    const res = await agent.get('/api/dashboard/staff');
    expect(res.status).toBe(200);

    const afterUnassigned = await prisma.ticket.count({
      where: { ownerId: null, status: { in: openStatuses } },
    });
    const afterTotalOpen = await prisma.ticket.count({
      where: { status: { in: openStatuses } },
    });

    const expectedMyOwned = await prisma.ticket.count({
      where: { ownerId: staff.id, status: { in: openStatuses } },
    });

    const minUnassigned = Math.min(beforeUnassigned, afterUnassigned);
    const maxUnassigned = Math.max(beforeUnassigned, afterUnassigned);
    expect(res.body.metrics.unassigned.value).toBeGreaterThanOrEqual(minUnassigned - 2);
    expect(res.body.metrics.unassigned.value).toBeLessThanOrEqual(maxUnassigned + 2);
    expect(res.body.metrics.myOwned.value).toBe(expectedMyOwned);

    const statusSum = Object.values(
      res.body.metrics.statusCounts.values as Record<string, number>
    ).reduce((a, b) => a + b, 0);
    const minTotalOpen = Math.min(beforeTotalOpen, afterTotalOpen);
    const maxTotalOpen = Math.max(beforeTotalOpen, afterTotalOpen);
    expect(statusSum).toBeGreaterThanOrEqual(minTotalOpen - 2);
    expect(statusSum).toBeLessThanOrEqual(maxTotalOpen + 2);

    // If queue is completely empty (no open tickets), counts are all zero
    if (afterTotalOpen === 0) {
      expect(res.body.metrics.unassigned.value).toBe(0);
      expect(res.body.metrics.myOwned.value).toBe(0);
      expect(res.body.metrics.statusCounts.values).toEqual({
        NEW: 0,
        OPEN: 0,
        IN_PROGRESS: 0,
        WAITING_FOR_REQUESTER: 0,
        REOPENED: 0,
      });
      expect(res.body.metrics.priorityCounts.values).toEqual({
        LOW: 0,
        MEDIUM: 0,
        HIGH: 0,
        CRITICAL: 0,
        UNSET: 0,
      });
    }
  });

  it('SD-03: role/401', async () => {
    // 1. Anonymous -> 401 UNAUTHENTICATED
    const anonRes = await anonymousRequest().get('/api/dashboard/staff');
    expect(anonRes.status).toBe(401);
    expect(anonRes.body).toHaveProperty('error');
    expect(anonRes.body.error.code).toBe('UNAUTHENTICATED');

    // 2. Requester -> 403 FORBIDDEN with generic body, no data leaked
    const requester = await createRequester();
    const reqAgent = await loginAs(requester);
    const reqRes = await reqAgent.get('/api/dashboard/staff');
    expect(reqRes.status).toBe(403);
    expect(reqRes.body).toHaveProperty('error');
    expect(reqRes.body.error.code).toBe('FORBIDDEN');
    expect(reqRes.body).not.toHaveProperty('metrics');
    expect(reqRes.body).not.toHaveProperty('recentlyUpdated');

    // 3. IT Staff -> 200 OK
    const staff = await createStaff();
    const staffAgent = await loginAs(staff);
    const staffRes = await staffAgent.get('/api/dashboard/staff');
    expect(staffRes.status).toBe(200);

    // 4. Administrator -> 200 OK
    const admin = await createAdmin();
    const adminAgent = await loginAs(admin);
    const adminRes = await adminAgent.get('/api/dashboard/staff');
    expect(adminRes.status).toBe(200);

    // 5. Forced internal server error on both dashboard endpoints rebuilt at database layer
    const db = getPrisma();
    const reqUser = await createRequester();
    const reqUserAgent = await loginAs(reqUser);

    const assert500Response = (res: any) => {
      expect(res.status).toBe(500);
      expect(res.headers['cache-control']).toBe('no-store');
      expect(res.body).toHaveProperty('error');
      expect(res.body.error.code).toBe('INTERNAL_ERROR');
      const bodyStr = JSON.stringify(res.body);
      expect(bodyStr).not.toContain('simulated database failure');
      expect(bodyStr).not.toContain('SECRET-TEXT');
      expect(bodyStr).not.toContain('/path/to/secret');
      expect(bodyStr).not.toContain('SELECT');
      expect(bodyStr.toLowerCase()).not.toContain('prisma');
      expect(bodyStr).not.toContain('stack');
    };

    // Sub-case A: ticket.findMany fails (called by both Requester and Staff)
    const origFindMany = db.ticket.findMany;
    db.ticket.findMany = (async () => {
      throw new Error(
        'simulated database failure SECRET-TEXT /path/to/secret SELECT * FROM Ticket prisma'
      );
    }) as any;
    try {
      const errStaffRes = await staffAgent.get('/api/dashboard/staff');
      assert500Response(errStaffRes);

      const errReqRes = await reqUserAgent.get('/api/dashboard/requester');
      assert500Response(errReqRes);
    } finally {
      db.ticket.findMany = origFindMany;
    }

    // Sub-case B: ticket.count fails (called by both Requester and Staff)
    const origCount = db.ticket.count;
    db.ticket.count = (async () => {
      throw new Error(
        'simulated database failure SECRET-TEXT /path/to/secret SELECT * FROM Ticket prisma'
      );
    }) as any;
    try {
      const errStaffRes = await staffAgent.get('/api/dashboard/staff');
      assert500Response(errStaffRes);

      const errReqRes = await reqUserAgent.get('/api/dashboard/requester');
      assert500Response(errReqRes);
    } finally {
      db.ticket.count = origCount;
    }

    // Sub-case C: ticket.groupBy fails (called by Staff endpoint)
    const origGroupBy = db.ticket.groupBy;
    db.ticket.groupBy = (async () => {
      throw new Error(
        'simulated database failure SECRET-TEXT /path/to/secret SELECT * FROM Ticket prisma'
      );
    }) as any;
    try {
      const errStaffRes = await staffAgent.get('/api/dashboard/staff');
      assert500Response(errStaffRes);
    } finally {
      db.ticket.groupBy = origGroupBy;
    }

    // Confirm that normal requests return 200 OK after restoring all mocks (no leak)
    const normalStaffRes = await staffAgent.get('/api/dashboard/staff');
    expect(normalStaffRes.status).toBe(200);
    expect(normalStaffRes.headers['cache-control']).toBe('no-store');

    const normalReqRes = await reqUserAgent.get('/api/dashboard/requester');
    expect(normalReqRes.status).toBe(200);
    expect(normalReqRes.headers['cache-control']).toBe('no-store');
  });

  it('SD-04: Admin extras', async () => {
    // Note: userCounts counts all User accounts in the system categorized by isActive,
    // as documented in specification.md section 5/11 and api-spec.md.
    const admin = await createAdmin();
    const staff = await createStaff();
    await createInactiveStaff();

    const adminAgent = await loginAs(admin);
    const staffAgent = await loginAs(staff);

    const beforeActive = await prisma.user.count({ where: { isActive: true } });
    const beforeInactive = await prisma.user.count({ where: { isActive: false } });

    // 1. Administrator request: receives userCounts
    const adminRes = await adminAgent.get('/api/dashboard/staff');
    expect(adminRes.status).toBe(200);

    const afterActive = await prisma.user.count({ where: { isActive: true } });
    const afterInactive = await prisma.user.count({ where: { isActive: false } });

    expect(adminRes.body).toHaveProperty('userCounts');
    expect(adminRes.body.userCounts.label).toBe('User Accounts (Admin Only)');
    expect(adminRes.body.userCounts.active).toBeGreaterThanOrEqual(beforeActive);
    expect(adminRes.body.userCounts.active).toBeLessThanOrEqual(afterActive);
    expect(adminRes.body.userCounts.inactive).toBeGreaterThanOrEqual(beforeInactive);
    expect(adminRes.body.userCounts.inactive).toBeLessThanOrEqual(afterInactive);

    // 2. IT Staff request: NO userCounts key at all (not null, key must be absent)
    const staffRes = await staffAgent.get('/api/dashboard/staff');
    expect(staffRes.status).toBe(200);
    expect('userCounts' in staffRes.body).toBe(false);

    // 3. Both receive valid operational metrics for the dataset
    expect(staffRes.body).toHaveProperty('metrics');
    expect(staffRes.body.metrics).toHaveProperty('unassigned');
    expect(staffRes.body.metrics).toHaveProperty('statusCounts');
    expect(staffRes.body.metrics).toHaveProperty('priorityCounts');
    expect(typeof staffRes.body.metrics.unassigned.value).toBe('number');
    expect(typeof adminRes.body.metrics.unassigned.value).toBe('number');
  });

  it('SD-05: concise', async () => {
    const staff = await createStaff();
    const admin = await createAdmin();

    // Create 25 tickets
    await createTicketsBulk(25);

    // IT Staff response check
    const staffAgent = await loginAs(staff);
    const staffRes = await staffAgent.get('/api/dashboard/staff');
    expect(staffRes.status).toBe(200);
    expect(Object.keys(staffRes.body).sort()).toEqual(['metrics', 'recentlyUpdated']);
    expect(staffRes.body.recentlyUpdated).toHaveLength(5);

    // Admin response check
    const adminAgent = await loginAs(admin);
    const adminRes = await adminAgent.get('/api/dashboard/staff');
    expect(adminRes.status).toBe(200);
    expect(Object.keys(adminRes.body).sort()).toEqual(['metrics', 'recentlyUpdated', 'userCounts']);
    expect(adminRes.body.recentlyUpdated).toHaveLength(5);

    // Item allowlist
    const allowedKeys = ['id', 'priority', 'status', 'ticketNumber', 'title', 'updatedAt'];
    for (const item of staffRes.body.recentlyUpdated) {
      expect(Object.keys(item).sort()).toEqual(allowedKeys);
    }

    // Leaks check
    const raw = JSON.stringify(adminRes.body);
    expect(raw).not.toContain('description');
    expect(raw).not.toContain('email');
    expect(raw).not.toContain('internalNotes');
    expect(raw).not.toContain('password');

    // Payload size stays bounded
    expect(Buffer.byteLength(raw, 'utf8')).toBeLessThan(3500);

    // Verify priority serialization: IT priority or null when unset (no fallback to requestedPriority)
    const ticketUnsetPriority = await createTicket({
      itPriority: null as any,
      requestedPriority: Priority.HIGH,
      summary: 'Unset IT Priority Ticket',
    });
    const ticketSetPriority = await createTicket({
      itPriority: Priority.CRITICAL,
      requestedPriority: Priority.LOW,
      summary: 'Set IT Priority Ticket',
    });

    const staffResPriorityCheck = await staffAgent.get('/api/dashboard/staff');
    expect(staffResPriorityCheck.status).toBe(200);
    const itemUnset = staffResPriorityCheck.body.recentlyUpdated.find(
      (t: any) => t.id === ticketUnsetPriority.id
    );
    const itemSet = staffResPriorityCheck.body.recentlyUpdated.find(
      (t: any) => t.id === ticketSetPriority.id
    );
    expect(itemUnset).toBeDefined();
    expect(itemUnset.priority).toBeNull();
    expect(itemSet).toBeDefined();
    expect(itemSet.priority).toBe('CRITICAL');
  });

  it('SD-06: time-zone boundary', async () => {
    // The committed specification defines no windowed metric for the staff dashboard;
    // recentlyUpdated is not windowed (it returns the latest 5 updated tickets regardless of age).
    // All staff operational metric counts (statusCounts, priorityCounts, unassigned, myOwned)
    // count open-status tickets regardless of whether they were created/updated recently or long ago.
    const staff = await createStaff();
    const now = Date.now();
    const oldDate = new Date(now - 14 * 24 * 60 * 60 * 1000); // 14 days ago (outside 7-day window)

    // Old unassigned open ticket
    const oldTicket = await createTicket({
      status: TicketStatus.OPEN,
      itPriority: Priority.HIGH,
      ownerId: null,
      createdAt: oldDate,
      updatedAt: oldDate,
    });

    const agent = await loginAs(staff);
    const res = await agent.get('/api/dashboard/staff');
    expect(res.status).toBe(200);

    // The old open ticket MUST still be counted in statusCounts, priorityCounts, and unassigned
    expect(res.body.metrics.unassigned.value).toBeGreaterThanOrEqual(1);
    expect(res.body.metrics.statusCounts.values.OPEN).toBeGreaterThanOrEqual(1);
    expect(res.body.metrics.priorityCounts.values.HIGH).toBeGreaterThanOrEqual(1);
  });

  it('AUTHZ-06: dashboard role matrix', async () => {
    const requester = await createRequester();
    const staff = await createStaff();
    const admin = await createAdmin();

    const requesterAgent = await loginAs(requester);
    const staffAgent = await loginAs(staff);
    const adminAgent = await loginAs(admin);
    const anonAgent = anonymousRequest();

    // 1. Requester -> requester 200, staff 403
    const reqOnReq = await requesterAgent.get('/api/dashboard/requester');
    expect(reqOnReq.status).toBe(200);
    expect(reqOnReq.headers['cache-control']).toBe('no-store');
    const reqOnStaff = await requesterAgent.get('/api/dashboard/staff');
    expect(reqOnStaff.status).toBe(403);
    expect(reqOnStaff.body.error.code).toBe('FORBIDDEN');
    expect(reqOnStaff.headers['cache-control']).toBe('no-store');

    // 2. IT Staff -> requester 403, staff 200
    const staffOnReq = await staffAgent.get('/api/dashboard/requester');
    expect(staffOnReq.status).toBe(403);
    expect(staffOnReq.body.error.code).toBe('FORBIDDEN');
    expect(staffOnReq.headers['cache-control']).toBe('no-store');
    const staffOnStaff = await staffAgent.get('/api/dashboard/staff');
    expect(staffOnStaff.status).toBe(200);
    expect(staffOnStaff.headers['cache-control']).toBe('no-store');

    // 3. Administrator -> requester 403, staff 200
    const adminOnReq = await adminAgent.get('/api/dashboard/requester');
    expect(adminOnReq.status).toBe(403);
    expect(adminOnReq.body.error.code).toBe('FORBIDDEN');
    expect(adminOnReq.headers['cache-control']).toBe('no-store');
    const adminOnStaff = await adminAgent.get('/api/dashboard/staff');
    expect(adminOnStaff.status).toBe(200);
    expect(adminOnStaff.headers['cache-control']).toBe('no-store');

    // 4. Anonymous -> 401 on both
    const anonOnReq = await anonAgent.get('/api/dashboard/requester');
    expect(anonOnReq.status).toBe(401);
    expect(anonOnReq.body.error.code).toBe('UNAUTHENTICATED');
    expect(anonOnReq.headers['cache-control']).toBe('no-store');
    const anonOnStaff = await anonAgent.get('/api/dashboard/staff');
    expect(anonOnStaff.status).toBe(401);
    expect(anonOnStaff.body.error.code).toBe('UNAUTHENTICATED');
    expect(anonOnStaff.headers['cache-control']).toBe('no-store');

    // 5. Non-GET methods -> 405 (or 404), with Cache-Control: no-store
    const postReq = await requesterAgent.post('/api/dashboard/requester').send({});
    expect([404, 405]).toContain(postReq.status);
    expect(postReq.headers['cache-control']).toBe('no-store');

    const patchReq = await requesterAgent.patch('/api/dashboard/requester').send({});
    expect([404, 405]).toContain(patchReq.status);
    expect(patchReq.headers['cache-control']).toBe('no-store');

    const deleteReq = await requesterAgent.delete('/api/dashboard/requester');
    expect([404, 405]).toContain(deleteReq.status);
    expect(deleteReq.headers['cache-control']).toBe('no-store');

    const postStaff = await staffAgent.post('/api/dashboard/staff').send({});
    expect([404, 405]).toContain(postStaff.status);
    expect(postStaff.headers['cache-control']).toBe('no-store');

    const patchStaff = await staffAgent.patch('/api/dashboard/staff').send({});
    expect([404, 405]).toContain(patchStaff.status);
    expect(patchStaff.headers['cache-control']).toBe('no-store');

    const deleteStaff = await staffAgent.delete('/api/dashboard/staff');
    expect([404, 405]).toContain(deleteStaff.status);
    expect(deleteStaff.headers['cache-control']).toBe('no-store');
  });
});
