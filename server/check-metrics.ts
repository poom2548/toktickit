import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. Manually load .env file before initializing PrismaClient
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPaths = [
  path.resolve(__dirname, '.env'),
  path.resolve(__dirname, '../.env'),
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
      const eqIdx = trimmed.indexOf('=');
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (key && process.env[key] === undefined) {
        process.env[key] = val;
      }
    }
    break;
  }
}

import { PrismaClient, TicketStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: 'grace@toktick.dev' },
  });

  const openStatuses = [
    TicketStatus.NEW,
    TicketStatus.OPEN,
    TicketStatus.IN_PROGRESS,
    TicketStatus.WAITING_FOR_REQUESTER,
    TicketStatus.REOPENED,
  ];

  const unassigned = await prisma.ticket.count({
    where: {
      ownerId: null,
      status: { in: openStatuses },
    },
  });

  const myOwned = user
    ? await prisma.ticket.count({
        where: {
          ownerId: user.id,
          status: { in: openStatuses },
        },
      })
    : 0;

  const myActions = user
    ? await prisma.actionTaken.count({
        where: {
          performedById: user.id,
        },
      })
    : 0;

  const statusGroup = await prisma.ticket.groupBy({
    by: ['status'],
    where: {
      status: { in: openStatuses },
    },
    _count: { id: true },
  });

  const priorityGroup = await prisma.ticket.groupBy({
    by: ['itPriority'],
    where: {
      status: { in: openStatuses },
      itPriority: { not: null },
    },
    _count: { id: true },
  });

  const unsetPriority = await prisma.ticket.count({
    where: {
      status: { in: openStatuses },
      itPriority: null,
    },
  });

  console.log('\n================================================================');
  console.log('       TOKTIKCIT: IT STAFF DASHBOARD DB METRICS VERIFICATION      ');
  console.log('================================================================');
  console.log(`Verified User : ${user?.name ?? 'Grace IT'} (${user?.email ?? 'grace@toktick.dev'})`);
  console.log(`Generated At  : ${new Date().toLocaleString()}`);
  console.log('----------------------------------------------------------------\n');

  console.log('>> [1] SUMMARY METRICS:');
  console.table([
    { 'Metric Name': 'Unassigned Tickets', 'Database Count': unassigned },
    { 'Metric Name': 'My Owned Tickets', 'Database Count': myOwned },
    { 'Metric Name': 'My Actions Taken', 'Database Count': myActions },
  ]);

  console.log('\n>> [2] BY STATUS (Open Tickets):');
  console.table(
    statusGroup.map((s) => ({
      Status: s.status,
      Count: s._count.id,
    }))
  );

  console.log('\n>> [3] BY IT PRIORITY (Open Tickets):');
  const priorityList = priorityGroup.map((p) => ({
    Priority: p.itPriority ?? 'UNSET',
    Count: p._count.id,
  }));
  priorityList.push({ Priority: 'UNSET', Count: unsetPriority });
  console.table(priorityList);
  console.log('================================================================\n');
}

main()
  .catch((e) => {
    console.error('Error running check-metrics:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
