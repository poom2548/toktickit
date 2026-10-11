import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import {
  createRequester,
  createTicket,
  createTicketsBulk,
  createStatusHistory,
  loginAs,
  anonymousRequest,
  resetTestData,
  beforeAllPattern,
  afterAllPattern,
  prisma,
} from './helpers.js';
import { TicketStatus, Priority } from '@prisma/client';

describe('Requester Dashboard', () => {
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

  it('RD-01: only own data (two Requesters)', async () => {
    const requesterA = await createRequester({ name: 'Requester A' });
    const requesterB = await createRequester({ name: 'Requester B' });

    // Requester A tickets
    const ticketA1 = await createTicket({
      requesterId: requesterA.id,
      summary: 'Ticket A1',
      status: TicketStatus.OPEN,
    });
    const ticketA2 = await createTicket({
      requesterId: requesterA.id,
      summary: 'Ticket A2',
      status: TicketStatus.IN_PROGRESS,
    });

    // Requester B tickets
    const ticketB1 = await createTicket({
      requesterId: requesterB.id,
      summary: 'Ticket B1',
      status: TicketStatus.OPEN,
    });
    const ticketB2 = await createTicket({
      requesterId: requesterB.id,
      summary: 'Ticket B2',
      status: TicketStatus.OPEN,
    });
    const ticketB3 = await createTicket({
      requesterId: requesterB.id,
      summary: 'Ticket B3',
      status: TicketStatus.WAITING_FOR_REQUESTER,
    });

    // 1. Requester A calls dashboard, even with query params spoofing requesterB
    const agentA = await loginAs(requesterA);
    const resA = await agentA.get(`/api/dashboard/requester?userId=${requesterB.id}&id=${ticketB1.id}`);
    expect(resA.status).toBe(200);

    // Only Requester A's open tickets count
    expect(resA.body.metrics.openTickets.value).toBe(2);

    // Only Requester A's tickets appear in recentlyUpdated
    const recentIdsA = resA.body.recentlyUpdated.map((t: any) => t.id);
    expect(recentIdsA).toContain(ticketA1.id);
    expect(recentIdsA).toContain(ticketA2.id);
    expect(recentIdsA).not.toContain(ticketB1.id);
    expect(recentIdsA).not.toContain(ticketB2.id);
    expect(recentIdsA).not.toContain(ticketB3.id);

    // 2. Requester B calls dashboard
    const agentB = await loginAs(requesterB);
    const resB = await agentB.get('/api/dashboard/requester');
    expect(resB.status).toBe(200);

    expect(resB.body.metrics.openTickets.value).toBe(3);
    expect(resB.body.metrics.waitingForMe.value).toBe(1);

    const recentIdsB = resB.body.recentlyUpdated.map((t: any) => t.id);
    expect(recentIdsB).toContain(ticketB1.id);
    expect(recentIdsB).toContain(ticketB2.id);
    expect(recentIdsB).toContain(ticketB3.id);
    expect(recentIdsB).not.toContain(ticketA1.id);
    expect(recentIdsB).not.toContain(ticketA2.id);
  });

  it('RD-02: each metric = DB query', async () => {
    const requesterA = await createRequester();
    const requesterB = await createRequester();

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

    // Create tickets across all 8 statuses for both requesters
    for (const status of allStatuses) {
      const tA = await createTicket({
        requesterId: requesterA.id,
        status,
        itPriority: Priority.MEDIUM,
      });
      if (status === TicketStatus.RESOLVED) {
        await createStatusHistory(tA.id, {
          changedById: requesterA.id,
          toStatus: TicketStatus.RESOLVED,
          changedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        });
      }

      const tB = await createTicket({
        requesterId: requesterB.id,
        status,
        itPriority: Priority.HIGH,
      });
      if (status === TicketStatus.RESOLVED) {
        await createStatusHistory(tB.id, {
          changedById: requesterB.id,
          toStatus: TicketStatus.RESOLVED,
          changedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        });
      }
    }

    // Extra waiting-for-requester ticket for requesterA
    await createTicket({
      requesterId: requesterA.id,
      status: TicketStatus.WAITING_FOR_REQUESTER,
    });

    // Independent Prisma queries inside the test
    const openStatuses: TicketStatus[] = [
      TicketStatus.NEW,
      TicketStatus.OPEN,
      TicketStatus.IN_PROGRESS,
      TicketStatus.WAITING_FOR_REQUESTER,
      TicketStatus.REOPENED,
    ];

    const expectedOpenTickets = await prisma.ticket.count({
      where: { requesterId: requesterA.id, status: { in: openStatuses } },
    });
    const expectedWaitingForMe = await prisma.ticket.count({
      where: { requesterId: requesterA.id, status: TicketStatus.WAITING_FOR_REQUESTER },
    });

    const cutoff7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const expectedRecentlyResolved = await prisma.ticket.count({
      where: {
        requesterId: requesterA.id,
        status: TicketStatus.RESOLVED,
        statusHistory: {
          some: {
            toStatus: TicketStatus.RESOLVED,
            changedAt: { gte: cutoff7Days },
          },
        },
      },
    });

    const expectedRecentTickets = await prisma.ticket.findMany({
      where: { requesterId: requesterA.id },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: 5,
      select: { id: true },
    });

    const agent = await loginAs(requesterA);
    const res = await agent.get('/api/dashboard/requester');
    expect(res.status).toBe(200);

    // Verify openTickets
    expect(res.body.metrics.openTickets.value).toBe(expectedOpenTickets);
    expect(res.body.metrics.openTickets.label).toBe('My Open Tickets');
    expect(res.body.metrics.openTickets.drillDown).toBe('/tickets?statusGroup=open');

    // Verify waitingForMe
    expect(res.body.metrics.waitingForMe.value).toBe(expectedWaitingForMe);
    expect(res.body.metrics.waitingForMe.label).toBe('Waiting for Me');
    expect(res.body.metrics.waitingForMe.drillDown).toBe('/tickets?status=WAITING_FOR_REQUESTER');

    // Verify recentlyResolved
    expect(res.body.metrics.recentlyResolved.value).toBe(expectedRecentlyResolved);
    expect(res.body.metrics.recentlyResolved.label).toBe('แก้ปัญหาแล้วล่าสุด (Recently Resolved)');
    expect(res.body.metrics.recentlyResolved.drillDown).toBe('/tickets?status=RESOLVED');

    // Verify recentlyUpdated order and cap of 5
    expect(res.body.recentlyUpdated).toHaveLength(expectedRecentTickets.length);
    const actualIds = res.body.recentlyUpdated.map((t: any) => t.id);
    expect(actualIds).toEqual(expectedRecentTickets.map((t: any) => t.id));
  });

  it('RD-03: empty', async () => {
    // 1. Requester with zero tickets
    const requesterEmpty = await createRequester();
    const agentEmpty = await loginAs(requesterEmpty);
    const resEmpty = await agentEmpty.get('/api/dashboard/requester');

    expect(resEmpty.status).toBe(200);
    expect(resEmpty.body.metrics.openTickets.value).toBe(0);
    expect(resEmpty.body.metrics.waitingForMe.value).toBe(0);
    expect(resEmpty.body.metrics.recentlyResolved.value).toBe(0);
    expect(resEmpty.body.recentlyUpdated).toEqual([]);

    // 2. Requester with only CLOSED / CANCELLED tickets
    const requesterClosed = await createRequester();
    const tClosed = await createTicket({
      requesterId: requesterClosed.id,
      status: TicketStatus.CLOSED,
      summary: 'Closed ticket',
    });
    const tCancelled = await createTicket({
      requesterId: requesterClosed.id,
      status: TicketStatus.CANCELLED,
      summary: 'Cancelled ticket',
    });

    const agentClosed = await loginAs(requesterClosed);
    const resClosed = await agentClosed.get('/api/dashboard/requester');

    expect(resClosed.status).toBe(200);
    expect(resClosed.body.metrics.openTickets.value).toBe(0);
    expect(resClosed.body.metrics.waitingForMe.value).toBe(0);
    expect(resClosed.body.metrics.recentlyResolved.value).toBe(0);
    expect(resClosed.body.recentlyUpdated).toHaveLength(2);
    const recentIds = resClosed.body.recentlyUpdated.map((t: any) => t.id);
    expect(recentIds).toContain(tClosed.id);
    expect(recentIds).toContain(tCancelled.id);
  });

  it('RD-04: payload concise', async () => {
    const requester = await createRequester();
    // Create 22 tickets
    await createTicketsBulk(22, { requesterId: requester.id });

    const agent = await loginAs(requester);
    const res = await agent.get('/api/dashboard/requester');
    expect(res.status).toBe(200);

    // Top-level key allowlist
    expect(Object.keys(res.body).sort()).toEqual(['metrics', 'recentlyUpdated']);

    // Metrics allowlist
    expect(Object.keys(res.body.metrics).sort()).toEqual([
      'openTickets',
      'recentlyResolved',
      'waitingForMe',
    ]);

    // recentlyUpdated capped at 5
    expect(res.body.recentlyUpdated).toHaveLength(5);

    // Item allowlist: exactly id, ticketNumber, title, status, priority, updatedAt
    const allowedItemKeys = ['id', 'priority', 'status', 'ticketNumber', 'title', 'updatedAt'];
    for (const item of res.body.recentlyUpdated) {
      expect(Object.keys(item).sort()).toEqual(allowedItemKeys);
    }

    // No leaks of sensitive or bulky fields
    const rawPayload = JSON.stringify(res.body);
    expect(rawPayload).not.toContain('description');
    expect(rawPayload).not.toContain('password');
    expect(rawPayload).not.toContain('email');
    expect(rawPayload).not.toContain('internalNotes');
    expect(rawPayload).not.toContain('requesterId');
    expect(rawPayload).not.toContain('ownerId');

    // Payload size stays small (< 3000 bytes)
    expect(Buffer.byteLength(rawPayload, 'utf8')).toBeLessThan(3000);
  });

  it('RD-05: time-zone boundary', async () => {
    // Specification: Asia/Bangkok rolling 7 x 24 h (no calendar-day cut-off).
    // recentlyResolved counts tickets whose CURRENT status is RESOLVED and that have
    // a status-history row toStatus = RESOLVED with changedAt inside the last 7 * 24 hours.
    const requester = await createRequester();
    const now = Date.now();
    const insideTime = new Date(now - 7 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000); // 7d - 30min (inside)
    const outsideTime = new Date(now - 7 * 24 * 60 * 60 * 1000 - 30 * 60 * 1000); // 7d + 30min (outside)

    // 1. Ticket inside window -> should count
    const tInside = await createTicket({
      requesterId: requester.id,
      status: TicketStatus.RESOLVED,
    });
    await createStatusHistory(tInside.id, {
      changedById: requester.id,
      toStatus: TicketStatus.RESOLVED,
      changedAt: insideTime,
    });

    // 2. Ticket outside window -> should NOT count
    const tOutside = await createTicket({
      requesterId: requester.id,
      status: TicketStatus.RESOLVED,
    });
    await createStatusHistory(tOutside.id, {
      changedById: requester.id,
      toStatus: TicketStatus.RESOLVED,
      changedAt: outsideTime,
    });

    // 3. Ticket resolved long ago, reopened, and resolved again inside window -> count ONCE
    const tReResolved = await createTicket({
      requesterId: requester.id,
      status: TicketStatus.RESOLVED,
    });
    await createStatusHistory(tReResolved.id, {
      changedById: requester.id,
      fromStatus: TicketStatus.IN_PROGRESS,
      toStatus: TicketStatus.RESOLVED,
      changedAt: new Date(now - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    });
    await createStatusHistory(tReResolved.id, {
      changedById: requester.id,
      fromStatus: TicketStatus.RESOLVED,
      toStatus: TicketStatus.REOPENED,
      changedAt: new Date(now - 3 * 24 * 60 * 60 * 1000),
    });
    await createStatusHistory(tReResolved.id, {
      changedById: requester.id,
      fromStatus: TicketStatus.REOPENED,
      toStatus: TicketStatus.RESOLVED,
      changedAt: new Date(now - 2 * 24 * 60 * 60 * 1000), // 2 days ago (inside)
    });

    // 4. Ticket resolved inside window, but CURRENT status is REOPENED -> should NOT count
    const tNowReopened = await createTicket({
      requesterId: requester.id,
      status: TicketStatus.REOPENED,
    });
    await createStatusHistory(tNowReopened.id, {
      changedById: requester.id,
      fromStatus: TicketStatus.IN_PROGRESS,
      toStatus: TicketStatus.RESOLVED,
      changedAt: new Date(now - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    });
    await createStatusHistory(tNowReopened.id, {
      changedById: requester.id,
      fromStatus: TicketStatus.RESOLVED,
      toStatus: TicketStatus.REOPENED,
      changedAt: new Date(now - 2 * 60 * 1000),
    });

    // 5. Legacy ticket (backfilled status history row at updatedAt inside window) -> should count
    const tLegacy = await createTicket({
      requesterId: requester.id,
      status: TicketStatus.RESOLVED,
      updatedAt: new Date(now - 3 * 24 * 60 * 60 * 1000),
    });
    await createStatusHistory(tLegacy.id, {
      changedById: requester.id,
      fromStatus: null,
      toStatus: TicketStatus.RESOLVED,
      changedAt: tLegacy.updatedAt,
    });

    // Independent query calculation
    const cutoff = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const expectedCount = await prisma.ticket.count({
      where: {
        requesterId: requester.id,
        status: TicketStatus.RESOLVED,
        statusHistory: {
          some: {
            toStatus: TicketStatus.RESOLVED,
            changedAt: { gte: cutoff },
          },
        },
      },
    });

    const agent = await loginAs(requester);
    const res = await agent.get('/api/dashboard/requester');
    expect(res.status).toBe(200);

    // Expected: tInside (1) + tReResolved (1) + tLegacy (1) = 3
    expect(expectedCount).toBe(3);
    expect(res.body.metrics.recentlyResolved.value).toBe(expectedCount);
  });
});
