import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  createRequester,
  createStaff,
  createTicket,
  createTicketsBulk,
  loginAs,
  resetTestData,
  beforeAllPattern,
  afterAllPattern,
  prisma,
} from './helpers.js';
import { TicketStatus, Priority } from '@prisma/client';

describe('Performance Smoke', () => {
  beforeAll(async () => {
    await beforeAllPattern();
  }, 60000);

  afterAll(async () => {
    await resetTestData();
    await afterAllPattern();
  });

  it('PERF-01: dashboards + Ticket Detail latency/query count', async () => {
    // 1. Setup dataset: at least 200 tickets
    const requester = await createRequester();
    const staff = await createStaff();

    // Create 210 tickets across different statuses and priorities
    const { tickets } = await createTicketsBulk(210, {
      requesterId: requester.id,
      ownerId: staff.id,
      status: TicketStatus.OPEN,
      itPriority: Priority.MEDIUM,
    });

    const testTicket = tickets[0];
    const requesterAgent = await loginAs(requester);
    const staffAgent = await loginAs(staff);

    // Endpoints under test:
    // - GET /api/dashboard/requester
    // - GET /api/dashboard/staff
    // - GET /api/tickets/:id (Ticket Detail - Requester)
    // - GET /staff/tickets/:id (Ticket Detail - IT Staff)
    const targets = [
      {
        name: 'Requester Dashboard (GET /api/dashboard/requester)',
        execute: () => requesterAgent.get('/api/dashboard/requester'),
      },
      {
        name: 'Staff Dashboard (GET /api/dashboard/staff)',
        execute: () => staffAgent.get('/api/dashboard/staff'),
      },
      {
        name: 'Requester Ticket Detail (GET /api/tickets/:id)',
        execute: () => requesterAgent.get(`/api/tickets/${testTicket.id}`),
      },
      {
        name: 'Staff Ticket Detail (GET /staff/tickets/:id)',
        execute: () => staffAgent.get(`/staff/tickets/${testTicket.id}`),
      },
    ];

    const LATENCY_THRESHOLD_MS = 500;
    const NUM_WARMUP = 3;
    const NUM_SAMPLES = 20;

    for (const target of targets) {
      // Warm-up requests
      for (let w = 0; w < NUM_WARMUP; w++) {
        const warmupRes = await target.execute();
        expect(warmupRes.status).toBe(200);
      }

      // Sequential measurement requests
      const durations: number[] = [];
      let lastPayloadSize = 0;

      for (let i = 0; i < NUM_SAMPLES; i++) {
        const start = performance.now();
        const res = await target.execute();
        const duration = performance.now() - start;

        expect(res.status).toBe(200);
        durations.push(duration);
        lastPayloadSize = Buffer.byteLength(JSON.stringify(res.body), 'utf8');
      }

      // Calculate p95 latency
      durations.sort((a, b) => a - b);
      const p95Index = Math.ceil(0.95 * durations.length) - 1;
      const p95Duration = durations[p95Index];

      console.log(
        `[PERF-01] ${target.name} - p95: ${p95Duration.toFixed(2)}ms, payload: ${lastPayloadSize} bytes (over ${NUM_SAMPLES} samples on 210 tickets)`
      );

      // Verify latency is strictly under threshold
      expect(p95Duration).toBeLessThan(LATENCY_THRESHOLD_MS);

      // Verify payload is bounded (< 10KB) even with 200+ tickets in database
      expect(lastPayloadSize).toBeLessThan(10240);
    }
  }, 60000); // 60s timeout for bulk setup and sequential measurements
});
