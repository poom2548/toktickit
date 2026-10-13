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
    const requester = await createRequester();
    const staff = await createStaff();

    // 1. Setup baseline dataset: N = 20 tickets
    const { tickets: tickets20 } = await createTicketsBulk(20, {
      requesterId: requester.id,
      ownerId: staff.id,
      status: TicketStatus.OPEN,
      itPriority: Priority.MEDIUM,
    });

    const testTicket = tickets20[0];
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

    // Measurement at N = 20
    const baselineResults: Record<string, { p95: number; payloadSize: number }> = {};
    for (const target of targets) {
      for (let w = 0; w < NUM_WARMUP; w++) {
        const warmupRes = await target.execute();
        expect(warmupRes.status).toBe(200);
      }

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

      durations.sort((a, b) => a - b);
      const p95Index = Math.ceil(0.95 * durations.length) - 1;
      const p95Duration = durations[p95Index];
      baselineResults[target.name] = { p95: p95Duration, payloadSize: lastPayloadSize };
    }

    // 2. Expand dataset to N = 210 tickets (add 190 more)
    await createTicketsBulk(190, {
      requesterId: requester.id,
      ownerId: staff.id,
      status: TicketStatus.OPEN,
      itPriority: Priority.MEDIUM,
    });

    console.log('\n--- PERF-01 Scaling Evidence: N=20 vs N=210 ---');
    console.log(
      'Limitation note: Prisma does not expose query-event counters on the default client without custom setup; scaling evidence uses latency and payload size across dataset sizes.'
    );

    // Measurement at N = 210 and scaling verification
    for (const target of targets) {
      for (let w = 0; w < NUM_WARMUP; w++) {
        const warmupRes = await target.execute();
        expect(warmupRes.status).toBe(200);
      }

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

      durations.sort((a, b) => a - b);
      const p95Index = Math.ceil(0.95 * durations.length) - 1;
      const p95Duration = durations[p95Index];
      const baseline = baselineResults[target.name];

      console.log(
        `[PERF-01] ${target.name}:\n` +
          `  N=20:  p95 = ${baseline.p95.toFixed(2)}ms, payload = ${baseline.payloadSize} bytes\n` +
          `  N=210: p95 = ${p95Duration.toFixed(2)}ms, payload = ${lastPayloadSize} bytes`
      );

      // Verify latency stays under hard limit
      expect(p95Duration).toBeLessThan(LATENCY_THRESHOLD_MS);

      // Assert scaling: p95(200) < 3 * p95(20) + 50ms (sublinear / bounded overhead, not O(N^2))
      expect(p95Duration).toBeLessThan(3 * baseline.p95 + 50);

      // Assert payload size at 200 is within 10% of payload size at 20 (capped payload)
      expect(lastPayloadSize).toBeLessThan(10240);
      expect(
        Math.abs(lastPayloadSize - baseline.payloadSize) / baseline.payloadSize
      ).toBeLessThan(0.1);
    }
  }, 90000); // 60s timeout for bulk setup and sequential measurements
});
