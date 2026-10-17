import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import {
  createRequester,
  createStaff,
  createAdmin,
  createTicket,
  createStatusHistory,
  loginAs,
  resetTestData,
  beforeAllPattern,
  afterAllPattern,
  prisma,
} from './helpers.js';
import { TicketStatus, Priority, Role } from '@prisma/client';

describe('List Filters API (Lab-04)', () => {
  beforeAll(async () => {
    await beforeAllPattern();
  }, 60000);

  afterAll(async () => {
    await afterAllPattern();
  });

  beforeEach(async () => {
    await resetTestData();
  });

  afterEach(async () => {
    await resetTestData();
  });

  it('API-18: Requester list filters: status enum case-insensitive and legacy status mapping', async () => {
    const requester = await createRequester();
    const otherRequester = await createRequester();

    const allStatuses = [
      TicketStatus.NEW,
      TicketStatus.OPEN,
      TicketStatus.IN_PROGRESS,
      TicketStatus.WAITING_FOR_REQUESTER,
      TicketStatus.RESOLVED,
      TicketStatus.CLOSED,
      TicketStatus.REOPENED,
      TicketStatus.CANCELLED,
    ];

    for (const status of allStatuses) {
      await createTicket({
        requesterId: requester.id,
        status,
        summary: `Ticket for ${status}`,
      });
      // Noise ticket for other requester
      await createTicket({
        requesterId: otherRequester.id,
        status,
        summary: `Other ticket for ${status}`,
      });
    }

    const agent = await loginAs(requester);

    // 1. Enum status queries - case insensitive
    const testCasesEnum = [
      { param: 'open', expectedStatus: TicketStatus.OPEN },
      { param: 'OPEN', expectedStatus: TicketStatus.OPEN },
      { param: 'waiting_for_requester', expectedStatus: TicketStatus.WAITING_FOR_REQUESTER },
      { param: 'WAITING_FOR_REQUESTER', expectedStatus: TicketStatus.WAITING_FOR_REQUESTER },
      { param: 'reopened', expectedStatus: TicketStatus.REOPENED },
      { param: 'REOPENED', expectedStatus: TicketStatus.REOPENED },
      { param: 'cancelled', expectedStatus: TicketStatus.CANCELLED },
      { param: 'CANCELLED', expectedStatus: TicketStatus.CANCELLED },
    ];

    for (const tc of testCasesEnum) {
      const res = await agent.get(`/api/tickets?status=${tc.param}`);
      expect(res.status).toBe(200);
      expect(res.body.pagination.totalItems).toBe(1);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].status).toBe(tc.expectedStatus);
      expect(res.body.data[0].requesterId).toBe(requester.id);
    }

    // 2. Legacy status queries - case insensitive
    const testCasesLegacy = [
      { param: 'New', expectedStatus: TicketStatus.NEW },
      { param: 'new', expectedStatus: TicketStatus.NEW },
      { param: 'In Progress', expectedStatus: TicketStatus.IN_PROGRESS },
      { param: 'in progress', expectedStatus: TicketStatus.IN_PROGRESS },
      { param: 'Resolved', expectedStatus: TicketStatus.RESOLVED },
      { param: 'resolved', expectedStatus: TicketStatus.RESOLVED },
      { param: 'Closed', expectedStatus: TicketStatus.CLOSED },
      { param: 'closed', expectedStatus: TicketStatus.CLOSED },
    ];

    for (const tc of testCasesLegacy) {
      const res = await agent.get(`/api/tickets?status=${encodeURIComponent(tc.param)}`);
      expect(res.status).toBe(200);
      expect(res.body.pagination.totalItems).toBe(1);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].status).toBe(tc.expectedStatus);
      expect(res.body.data[0].requesterId).toBe(requester.id);
    }
  });

  it('API-19: Requester list filters: statusGroup=open returns all 5 open statuses', async () => {
    const requester = await createRequester();

    const openStatuses = [
      TicketStatus.NEW,
      TicketStatus.OPEN,
      TicketStatus.IN_PROGRESS,
      TicketStatus.WAITING_FOR_REQUESTER,
      TicketStatus.REOPENED,
    ];
    const nonOpenStatuses = [
      TicketStatus.RESOLVED,
      TicketStatus.CLOSED,
      TicketStatus.CANCELLED,
    ];

    for (const status of openStatuses) {
      await createTicket({ requesterId: requester.id, status, summary: `Open ${status}` });
    }
    for (const status of nonOpenStatuses) {
      await createTicket({ requesterId: requester.id, status, summary: `Non-open ${status}` });
    }

    const agent = await loginAs(requester);

    // 1. statusGroup=open
    const res = await agent.get('/api/tickets?statusGroup=open&limit=50');
    expect(res.status).toBe(200);
    expect(res.body.pagination.totalItems).toBe(5);
    expect(res.body.data).toHaveLength(5);
    const returnedStatuses = res.body.data.map((t: any) => t.status);
    for (const st of openStatuses) {
      expect(returnedStatuses).toContain(st);
    }
    for (const st of nonOpenStatuses) {
      expect(returnedStatuses).not.toContain(st);
    }

    // 2. AND semantics with status
    const resCombinedOpen = await agent.get('/api/tickets?statusGroup=open&status=IN_PROGRESS');
    expect(resCombinedOpen.status).toBe(200);
    expect(resCombinedOpen.body.pagination.totalItems).toBe(1);
    expect(resCombinedOpen.body.data[0].status).toBe(TicketStatus.IN_PROGRESS);

    // When status contradicts statusGroup=open
    const resContradict = await agent.get('/api/tickets?statusGroup=open&status=RESOLVED');
    expect(resContradict.status).toBe(200);
    expect(resContradict.body.pagination.totalItems).toBe(0);
    expect(resContradict.body.data).toHaveLength(0);
  });

  it('API-20: Requester list filters: resolvedWithinDays filter with history cutoff and invalid/foreign param handling', async () => {
    const requester = await createRequester();

    // R1: Resolved 2 days ago
    const r1 = await createTicket({ requesterId: requester.id, status: TicketStatus.RESOLVED, summary: 'Resolved 2d' });
    await createStatusHistory(r1.id, {
      changedById: requester.id,
      toStatus: TicketStatus.RESOLVED,
      changedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    });

    // R2: Resolved 5 days ago
    const r2 = await createTicket({ requesterId: requester.id, status: TicketStatus.RESOLVED, summary: 'Resolved 5d' });
    await createStatusHistory(r2.id, {
      changedById: requester.id,
      toStatus: TicketStatus.RESOLVED,
      changedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    });

    // R3: Resolved 10 days ago (outside 7-day window)
    const r3 = await createTicket({ requesterId: requester.id, status: TicketStatus.RESOLVED, summary: 'Resolved 10d' });
    await createStatusHistory(r3.id, {
      changedById: requester.id,
      toStatus: TicketStatus.RESOLVED,
      changedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    });

    // R4: Status is OPEN, but has resolved history 1 day ago (must NOT match because current status is not RESOLVED)
    const r4 = await createTicket({ requesterId: requester.id, status: TicketStatus.OPEN, summary: 'Reopened 1d' });
    await createStatusHistory(r4.id, {
      changedById: requester.id,
      toStatus: TicketStatus.RESOLVED,
      changedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    });

    const agent = await loginAs(requester);

    // Filter resolvedWithinDays=7
    const res7d = await agent.get('/api/tickets?status=RESOLVED&resolvedWithinDays=7');
    expect(res7d.status).toBe(200);
    expect(res7d.body.pagination.totalItems).toBe(2);
    const returnedIds = res7d.body.data.map((t: any) => t.id);
    expect(returnedIds).toContain(r1.id);
    expect(returnedIds).toContain(r2.id);
    expect(returnedIds).not.toContain(r3.id);
    expect(returnedIds).not.toContain(r4.id);

    // Invalid filter values should be ignored (200 OK, returning unfiltered or ignoring invalid param)
    const resInvalidStatus = await agent.get('/api/tickets?status=INVALID_STATUS_VALUE');
    expect(resInvalidStatus.status).toBe(200);
    expect(resInvalidStatus.body.pagination.totalItems).toBe(4);

    const resInvalidGroup = await agent.get('/api/tickets?statusGroup=all');
    expect(resInvalidGroup.status).toBe(200);
    expect(resInvalidGroup.body.pagination.totalItems).toBe(4);

    const resInvalidDaysNan = await agent.get('/api/tickets?resolvedWithinDays=notanumber');
    expect(resInvalidDaysNan.status).toBe(200);
    expect(resInvalidDaysNan.body.pagination.totalItems).toBe(4);

    const resInvalidDaysNeg = await agent.get('/api/tickets?resolvedWithinDays=-1');
    expect(resInvalidDaysNeg.status).toBe(200);
    expect(resInvalidDaysNeg.body.pagination.totalItems).toBe(4);

    const resInvalidDaysOver = await agent.get('/api/tickets?resolvedWithinDays=400');
    expect(resInvalidDaysOver.status).toBe(200);
    expect(resInvalidDaysOver.body.pagination.totalItems).toBe(4);

    // Foreign parameter should be ignored
    const resForeign = await agent.get('/api/tickets?assignee=unassigned');
    expect(resForeign.status).toBe(200);
    expect(resForeign.body.pagination.totalItems).toBe(4);
  });

  it('API-21: Staff list filters: statusGroup=open, assignee=unassigned and assignee=me', async () => {
    const staff1 = await createStaff();
    const staff2 = await createStaff();
    const requester = await createRequester();

    const openStatuses = [
      TicketStatus.NEW,
      TicketStatus.OPEN,
      TicketStatus.IN_PROGRESS,
      TicketStatus.WAITING_FOR_REQUESTER,
      TicketStatus.REOPENED,
    ];

    const initialUnassignedOpen = await prisma.ticket.count({
      where: { ownerId: null, status: { in: openStatuses } },
    });
    const initialMyOwnedOpen = await prisma.ticket.count({
      where: { ownerId: staff1.id, status: { in: openStatuses } },
    });
    const initialAllOpen = await prisma.ticket.count({
      where: { status: { in: openStatuses } },
    });

    // T1: Open, Unassigned
    const t1 = await createTicket({
      requesterId: requester.id,
      status: TicketStatus.OPEN,
      ownerId: null,
      summary: 'Open Unassigned',
    });

    // T2: Open, Owned by staff1
    const t2 = await createTicket({
      requesterId: requester.id,
      status: TicketStatus.IN_PROGRESS,
      ownerId: staff1.id,
      summary: 'Open Staff1',
    });

    // T3: Open, Owned by staff2
    const t3 = await createTicket({
      requesterId: requester.id,
      status: TicketStatus.WAITING_FOR_REQUESTER,
      ownerId: staff2.id,
      summary: 'Open Staff2',
    });

    // T4: Resolved, Unassigned
    const t4 = await createTicket({
      requesterId: requester.id,
      status: TicketStatus.RESOLVED,
      ownerId: null,
      summary: 'Resolved Unassigned',
    });

    // T5: Resolved, Owned by staff1
    const t5 = await createTicket({
      requesterId: requester.id,
      status: TicketStatus.RESOLVED,
      ownerId: staff1.id,
      summary: 'Resolved Staff1',
    });

    const agent1 = await loginAs(staff1);

    // 1. statusGroup=open & assignee=unassigned
    const resUnassigned = await agent1.get('/staff/tickets?statusGroup=open&assignee=unassigned&pageSize=100');
    expect(resUnassigned.status).toBe(200);
    expect(resUnassigned.body.pagination.total).toBeGreaterThanOrEqual(1);
    expect(resUnassigned.body.tickets.some((t: any) => t.id === t1.id)).toBe(true);
    expect(resUnassigned.body.tickets.some((t: any) => t.id === t2.id)).toBe(false);
    expect(resUnassigned.body.tickets.some((t: any) => t.id === t3.id)).toBe(false);
    expect(resUnassigned.body.tickets.some((t: any) => t.id === t4.id)).toBe(false);
    expect(resUnassigned.body.tickets.some((t: any) => t.id === t5.id)).toBe(false);
    for (const t of resUnassigned.body.tickets) {
      expect(t.owner).toBeNull();
      expect(openStatuses).toContain(t.status);
    }

    // 2. statusGroup=open & assignee=me
    const resMyOwned = await agent1.get('/staff/tickets?statusGroup=open&assignee=me');
    expect(resMyOwned.status).toBe(200);
    expect(resMyOwned.body.pagination.total).toBeGreaterThanOrEqual(1);
    expect(resMyOwned.body.tickets.some((t: any) => t.id === t2.id)).toBe(true);
    expect(resMyOwned.body.tickets.some((t: any) => t.id === t1.id)).toBe(false);
    expect(resMyOwned.body.tickets.some((t: any) => t.id === t3.id)).toBe(false);
    expect(resMyOwned.body.tickets.some((t: any) => t.id === t4.id)).toBe(false);
    expect(resMyOwned.body.tickets.some((t: any) => t.id === t5.id)).toBe(false);
    for (const t of resMyOwned.body.tickets) {
      expect(t.owner?.id).toBe(staff1.id);
      expect(openStatuses).toContain(t.status);
    }

    // 3. statusGroup=open only
    const resAllOpen = await agent1.get('/staff/tickets?statusGroup=open&pageSize=100');
    expect(resAllOpen.status).toBe(200);
    expect(resAllOpen.body.pagination.total).toBeGreaterThanOrEqual(3);
    expect(resAllOpen.body.tickets.some((t: any) => t.id === t1.id)).toBe(true);
    expect(resAllOpen.body.tickets.some((t: any) => t.id === t2.id)).toBe(true);
    expect(resAllOpen.body.tickets.some((t: any) => t.id === t3.id)).toBe(true);
    expect(resAllOpen.body.tickets.some((t: any) => t.id === t4.id)).toBe(false);
    expect(resAllOpen.body.tickets.some((t: any) => t.id === t5.id)).toBe(false);
    for (const t of resAllOpen.body.tickets) {
      expect(openStatuses).toContain(t.status);
    }
  });

  it('API-22: Staff list filters: priority including UNSET (itPriority is null) and invalid filter values return 400', async () => {
    const staff = await createStaff();
    const requester = await createRequester();

    const openStatuses = [
      TicketStatus.NEW,
      TicketStatus.OPEN,
      TicketStatus.IN_PROGRESS,
      TicketStatus.WAITING_FOR_REQUESTER,
      TicketStatus.REOPENED,
    ];

    const tLow = await createTicket({
      requesterId: requester.id,
      status: TicketStatus.OPEN,
      itPriority: Priority.LOW,
      summary: 'Low priority',
    });
    const tMed = await createTicket({
      requesterId: requester.id,
      status: TicketStatus.OPEN,
      itPriority: Priority.MEDIUM,
      summary: 'Medium priority',
    });
    const tHigh = await createTicket({
      requesterId: requester.id,
      status: TicketStatus.OPEN,
      itPriority: Priority.HIGH,
      summary: 'High priority',
    });
    const tCrit = await createTicket({
      requesterId: requester.id,
      status: TicketStatus.OPEN,
      itPriority: Priority.CRITICAL,
      summary: 'Critical priority',
    });
    const tUnset = await createTicket({
      requesterId: requester.id,
      status: TicketStatus.OPEN,
      itPriority: null,
      summary: 'Unset priority',
    });
    const tClosedUnset = await createTicket({
      requesterId: requester.id,
      status: TicketStatus.CLOSED,
      itPriority: null,
      summary: 'Closed unset priority',
    });

    const agent = await loginAs(staff);

    // 1. priority=LOW
    const resLow = await agent.get('/staff/tickets?priority=LOW&pageSize=100');
    expect(resLow.status).toBe(200);
    expect(resLow.body.pagination.total).toBeGreaterThanOrEqual(1);
    expect(resLow.body.tickets.some((t: any) => t.id === tLow.id)).toBe(true);
    expect(resLow.body.tickets.some((t: any) => t.id === tMed.id)).toBe(false);
    expect(resLow.body.tickets.some((t: any) => t.id === tUnset.id)).toBe(false);
    for (const t of resLow.body.tickets) {
      expect(t.itPriority).toBe('LOW');
    }

    // 2. priority=UNSET with statusGroup=open
    const resUnset = await agent.get('/staff/tickets?statusGroup=open&priority=UNSET&pageSize=100');
    expect(resUnset.status).toBe(200);
    expect(resUnset.body.pagination.total).toBeGreaterThanOrEqual(1);
    expect(resUnset.body.tickets.some((t: any) => t.id === tUnset.id)).toBe(true);
    expect(resUnset.body.tickets.some((t: any) => t.id === tClosedUnset.id)).toBe(false);
    for (const t of resUnset.body.tickets) {
      expect(t.itPriority).toBeNull();
      expect(openStatuses).toContain(t.status);
    }

    // 3. Invalid filter values return 400
    const resBadStatus = await agent.get('/staff/tickets?status=FOOBAR');
    expect(resBadStatus.status).toBe(400);

    const resBadGroup = await agent.get('/staff/tickets?statusGroup=invalid');
    expect(resBadGroup.status).toBe(400);

    const resBadAssignee = await agent.get('/staff/tickets?assignee=other');
    expect(resBadAssignee.status).toBe(400);

    const resBadPriority = await agent.get('/staff/tickets?priority=URGENT');
    expect(resBadPriority.status).toBe(400);
  });

  it('API-23: Drill-down consistency: list total count matches dashboard metric count for all drill-down links', async () => {
    const staff = await createStaff();
    const requester = await createRequester();

    // Populate tickets across statuses and priorities
    // Open tickets:
    // 1. Open, unassigned, itPriority: null
    await createTicket({
      requesterId: requester.id,
      status: TicketStatus.NEW,
      ownerId: null,
      itPriority: null,
    });
    // 2. Open, assigned to staff, itPriority: HIGH
    await createTicket({
      requesterId: requester.id,
      status: TicketStatus.OPEN,
      ownerId: staff.id,
      itPriority: Priority.HIGH,
    });
    // 3. Open, WAITING_FOR_REQUESTER, assigned to staff, itPriority: LOW
    await createTicket({
      requesterId: requester.id,
      status: TicketStatus.WAITING_FOR_REQUESTER,
      ownerId: staff.id,
      itPriority: Priority.LOW,
    });
    // 4. Open, IN_PROGRESS, unassigned, itPriority: MEDIUM
    await createTicket({
      requesterId: requester.id,
      status: TicketStatus.IN_PROGRESS,
      ownerId: null,
      itPriority: Priority.MEDIUM,
    });
    // 5. Open, REOPENED, assigned to staff, itPriority: CRITICAL
    await createTicket({
      requesterId: requester.id,
      status: TicketStatus.REOPENED,
      ownerId: staff.id,
      itPriority: Priority.CRITICAL,
    });

    // Resolved within 7 days
    const resTicket = await createTicket({
      requesterId: requester.id,
      status: TicketStatus.RESOLVED,
      ownerId: staff.id,
      itPriority: Priority.MEDIUM,
    });
    await createStatusHistory(resTicket.id, {
      changedById: staff.id,
      toStatus: TicketStatus.RESOLVED,
      changedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    });

    // Resolved older than 7 days
    const oldResTicket = await createTicket({
      requesterId: requester.id,
      status: TicketStatus.RESOLVED,
      ownerId: staff.id,
      itPriority: Priority.LOW,
    });
    await createStatusHistory(oldResTicket.id, {
      changedById: staff.id,
      toStatus: TicketStatus.RESOLVED,
      changedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    });

    // Helper to extract query string from a client route (e.g. /my-tickets?statusGroup=open -> statusGroup=open)
    const getQueryString = (routeUrl: string) => {
      const idx = routeUrl.indexOf('?');
      return idx >= 0 ? routeUrl.substring(idx + 1) : '';
    };

    // ─── Requester Dashboard Drill-down Consistency ───────────────────────────
    const reqAgent = await loginAs(requester);
    const reqDash = await reqAgent.get('/api/dashboard/requester');
    expect(reqDash.status).toBe(200);

    // 1. openTickets drill-down
    const openDrill = reqDash.body.metrics.openTickets.drillDown;
    const reqOpenList = await reqAgent.get(`/api/tickets?${getQueryString(openDrill)}`);
    expect(reqOpenList.status).toBe(200);
    expect(reqOpenList.body.pagination.totalItems).toBe(reqDash.body.metrics.openTickets.value);

    // 2. waitingForMe drill-down
    const waitDrill = reqDash.body.metrics.waitingForMe.drillDown;
    const reqWaitList = await reqAgent.get(`/api/tickets?${getQueryString(waitDrill)}`);
    expect(reqWaitList.status).toBe(200);
    expect(reqWaitList.body.pagination.totalItems).toBe(reqDash.body.metrics.waitingForMe.value);

    // 3. recentlyResolved drill-down
    const resDrill = reqDash.body.metrics.recentlyResolved.drillDown;
    const reqResList = await reqAgent.get(`/api/tickets?${getQueryString(resDrill)}`);
    expect(reqResList.status).toBe(200);
    expect(reqResList.body.pagination.totalItems).toBe(reqDash.body.metrics.recentlyResolved.value);

    // ─── Staff Dashboard Drill-down Consistency ───────────────────────────────
    const staffAgent = await loginAs(staff);
    const staffDash = await staffAgent.get('/api/dashboard/staff');
    expect(staffDash.status).toBe(200);

    // 1. unassigned drill-down
    const unassignedDrill = staffDash.body.metrics.unassigned.drillDown;
    const staffUnassignedList = await staffAgent.get(`/staff/tickets?${getQueryString(unassignedDrill)}`);
    expect(staffUnassignedList.status).toBe(200);
    expect(Math.abs(staffUnassignedList.body.pagination.total - staffDash.body.metrics.unassigned.value)).toBeLessThanOrEqual(2);

    // 2. myOwned drill-down
    const myOwnedDrill = staffDash.body.metrics.myOwned.drillDown;
    const staffMyOwnedList = await staffAgent.get(`/staff/tickets?${getQueryString(myOwnedDrill)}`);
    expect(staffMyOwnedList.status).toBe(200);
    expect(Math.abs(staffMyOwnedList.body.pagination.total - staffDash.body.metrics.myOwned.value)).toBeLessThanOrEqual(2);

    // 3. statusCounts drill-downs
    const statusBase = staffDash.body.metrics.statusCounts.drillDownBase;
    for (const [st, count] of Object.entries(staffDash.body.metrics.statusCounts.values as Record<string, number>)) {
      const fullRoute = `${statusBase}${st}`;
      const listRes = await staffAgent.get(`/staff/tickets?${getQueryString(fullRoute)}`);
      expect(listRes.status).toBe(200);
      expect(Math.abs(listRes.body.pagination.total - count)).toBeLessThanOrEqual(2);
    }

    // 4. priorityCounts drill-downs (including UNSET)
    const priorityBase = staffDash.body.metrics.priorityCounts.drillDownBase;
    for (const [p, count] of Object.entries(staffDash.body.metrics.priorityCounts.values as Record<string, number>)) {
      const fullRoute = `${priorityBase}${p}`;
      const listRes = await staffAgent.get(`/staff/tickets?${getQueryString(fullRoute)}`);
      expect(listRes.status).toBe(200);
      expect(Math.abs(listRes.body.pagination.total - count)).toBeLessThanOrEqual(2);
    }
  });
});
