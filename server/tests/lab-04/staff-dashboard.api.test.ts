import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import {
  createUser,
  createRequester,
  createStaff,
  createAdmin,
  createInactiveStaff,
  createTicket,
  createTicketsBulk,
  loginAs,
  anonymousRequest,
  resetTestData,
  beforeAllPattern,
  afterAllPattern,
  prisma,
} from './helpers.js';
import { TicketStatus, Priority, Role } from '@prisma/client';

describe('Staff Dashboard', () => {
  beforeAll(async () => {
    await beforeAllPattern();
  });

  afterAll(async () => {
    await afterAllPattern();
  });

  beforeEach(async () => {
    await resetTestData();
  });

  afterEach(async () => {
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

    const openStatuses: TicketStatus[] = [
      TicketStatus.NEW,
      TicketStatus.OPEN,
      TicketStatus.IN_PROGRESS,
      TicketStatus.WAITING_FOR_REQUESTER,
      TicketStatus.REOPENED,
    ];

    // Independent DB queries
    const expectedUnassigned = await prisma.ticket.count({
      where: { ownerId: null, status: { in: openStatuses } },
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

    const expectedRecentTickets = await prisma.ticket.findMany({
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: 5,
      select: { id: true },
    });

    const agent = await loginAs(staff);
    const res = await agent.get('/api/dashboard/staff');
    expect(res.status).toBe(200);

    // Verify unassigned
    expect(res.body.metrics.unassigned.value).toBe(expectedUnassigned);
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
    expect(res.body.metrics.statusCounts.values).toEqual(expectedStatusCounts);

    // Verify sum of statusCounts equals open total
    const totalOpenFromStatusCounts = Object.values(
      res.body.metrics.statusCounts.values as Record<string, number>
    ).reduce((a, b) => a + b, 0);
    const totalOpenInDb = await prisma.ticket.count({
      where: { status: { in: openStatuses } },
    });
    expect(totalOpenFromStatusCounts).toBe(totalOpenInDb);

    // Verify priorityCounts
    expect(res.body.metrics.priorityCounts.label).toBe('By IT Priority');
    expect(res.body.metrics.priorityCounts.drillDownBase).toBe('/staff/tickets?priority=');
    expect(res.body.metrics.priorityCounts.values).toEqual(expectedPriorityCounts);

    // Verify terminal statuses are not in statusCounts
    expect(res.body.metrics.statusCounts.values).not.toHaveProperty('RESOLVED');
    expect(res.body.metrics.statusCounts.values).not.toHaveProperty('CLOSED');
    expect(res.body.metrics.statusCounts.values).not.toHaveProperty('CANCELLED');

    // Verify recentlyUpdated
    expect(res.body.recentlyUpdated).toHaveLength(expectedRecentTickets.length);
    expect(res.body.recentlyUpdated.map((t: any) => t.id)).toEqual(
      expectedRecentTickets.map((t: any) => t.id)
    );
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

    // Compute independent counts (deterministic comparison against DB state)
    const expectedUnassigned = await prisma.ticket.count({
      where: { ownerId: null, status: { in: openStatuses } },
    });
    const expectedMyOwned = await prisma.ticket.count({
      where: { ownerId: staff.id, status: { in: openStatuses } },
    });
    const expectedTotalOpen = await prisma.ticket.count({
      where: { status: { in: openStatuses } },
    });

    const agent = await loginAs(staff);
    const res = await agent.get('/api/dashboard/staff');

    expect(res.status).toBe(200);
    expect(res.body.metrics.unassigned.value).toBe(expectedUnassigned);
    expect(res.body.metrics.myOwned.value).toBe(expectedMyOwned);

    const statusSum = Object.values(
      res.body.metrics.statusCounts.values as Record<string, number>
    ).reduce((a, b) => a + b, 0);
    expect(statusSum).toBe(expectedTotalOpen);

    // If queue is completely empty (no open tickets), counts are all zero
    if (expectedTotalOpen === 0) {
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
  });

  it('SD-04: Admin extras', async () => {
    // Note: userCounts counts all User accounts in the system categorized by isActive,
    // as documented in specification.md section 5/11 and api-spec.md.
    const admin = await createAdmin();
    const staff = await createStaff();
    await createInactiveStaff();

    const expectedActive = await prisma.user.count({ where: { isActive: true } });
    const expectedInactive = await prisma.user.count({ where: { isActive: false } });

    // 1. Administrator request: receives userCounts
    const adminAgent = await loginAs(admin);
    const adminRes = await adminAgent.get('/api/dashboard/staff');
    expect(adminRes.status).toBe(200);
    expect(adminRes.body).toHaveProperty('userCounts');
    expect(adminRes.body.userCounts).toEqual({
      label: 'User Accounts (Admin Only)',
      active: expectedActive,
      inactive: expectedInactive,
    });

    // 2. IT Staff request: NO userCounts key at all (not null, key must be absent)
    const staffAgent = await loginAs(staff);
    const staffRes = await staffAgent.get('/api/dashboard/staff');
    expect(staffRes.status).toBe(200);
    expect('userCounts' in staffRes.body).toBe(false);

    // 3. Both receive the same operational metrics for the same dataset
    expect(staffRes.body.metrics.unassigned.value).toBe(adminRes.body.metrics.unassigned.value);
    expect(staffRes.body.metrics.statusCounts.values).toEqual(
      adminRes.body.metrics.statusCounts.values
    );
    expect(staffRes.body.metrics.priorityCounts.values).toEqual(
      adminRes.body.metrics.priorityCounts.values
    );
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
    const reqOnStaff = await requesterAgent.get('/api/dashboard/staff');
    expect(reqOnStaff.status).toBe(403);
    expect(reqOnStaff.body.error.code).toBe('FORBIDDEN');

    // 2. IT Staff -> requester 403, staff 200
    const staffOnReq = await staffAgent.get('/api/dashboard/requester');
    expect(staffOnReq.status).toBe(403);
    expect(staffOnReq.body.error.code).toBe('FORBIDDEN');
    const staffOnStaff = await staffAgent.get('/api/dashboard/staff');
    expect(staffOnStaff.status).toBe(200);

    // 3. Administrator -> requester 403, staff 200
    const adminOnReq = await adminAgent.get('/api/dashboard/requester');
    expect(adminOnReq.status).toBe(403);
    expect(adminOnReq.body.error.code).toBe('FORBIDDEN');
    const adminOnStaff = await adminAgent.get('/api/dashboard/staff');
    expect(adminOnStaff.status).toBe(200);

    // 4. Anonymous -> 401 on both
    const anonOnReq = await anonAgent.get('/api/dashboard/requester');
    expect(anonOnReq.status).toBe(401);
    expect(anonOnReq.body.error.code).toBe('UNAUTHENTICATED');
    const anonOnStaff = await anonAgent.get('/api/dashboard/staff');
    expect(anonOnStaff.status).toBe(401);
    expect(anonOnStaff.body.error.code).toBe('UNAUTHENTICATED');

    // 5. Non-GET methods -> 404 or 405, nothing modified
    const postReq = await requesterAgent.post('/api/dashboard/requester').send({});
    expect([404, 405]).toContain(postReq.status);

    const patchReq = await requesterAgent.patch('/api/dashboard/requester').send({});
    expect([404, 405]).toContain(patchReq.status);

    const deleteReq = await requesterAgent.delete('/api/dashboard/requester');
    expect([404, 405]).toContain(deleteReq.status);

    const postStaff = await staffAgent.post('/api/dashboard/staff').send({});
    expect([404, 405]).toContain(postStaff.status);

    const patchStaff = await staffAgent.patch('/api/dashboard/staff').send({});
    expect([404, 405]).toContain(patchStaff.status);

    const deleteStaff = await staffAgent.delete('/api/dashboard/staff');
    expect([404, 405]).toContain(deleteStaff.status);
  });
});
