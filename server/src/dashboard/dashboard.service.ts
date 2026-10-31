import { getPrisma } from '../prisma.js';
import { TicketStatus, Priority, Role } from '@prisma/client';
import {
  OPEN_TICKET_STATUSES,
  IT_PRIORITIES,
  RECENTLY_UPDATED_CAP,
} from './dashboard.constants.js';
import {
  RequesterDashboardData,
  StaffDashboardData,
} from './dashboard.serializers.js';
import { buildRecentlyResolvedWhere } from '../utils/ticketFilters.js';

export async function getRequesterDashboardData(
  userId: string
): Promise<RequesterDashboardData> {
  const prisma = getPrisma();
  const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [openTickets, waitingForMe, recentlyResolved, recentlyUpdated] =
    await Promise.all([
      prisma.ticket.count({
        where: {
          requesterId: userId,
          status: { in: [...OPEN_TICKET_STATUSES] },
        },
      }),
      prisma.ticket.count({
        where: {
          requesterId: userId,
          status: TicketStatus.WAITING_FOR_REQUESTER,
        },
      }),
      prisma.ticket.count({
        where: {
          requesterId: userId,
          ...buildRecentlyResolvedWhere(cutoffDate),
        },
      }),
      prisma.ticket.findMany({
        where: { requesterId: userId },
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        take: RECENTLY_UPDATED_CAP,
        select: {
          id: true,
          ticketNumber: true,
          summary: true,
          status: true,
          itPriority: true,
          requestedPriority: true,
          updatedAt: true,
        },
      }),
    ]);

  return {
    openTickets,
    waitingForMe,
    recentlyResolved,
    recentlyUpdated,
  };
}

export async function getStaffDashboardData(
  userId: string,
  role: string
): Promise<StaffDashboardData> {
  const prisma = getPrisma();

  const userCountsPromise =
    role === Role.ADMINISTRATOR
      ? Promise.all([
          prisma.user.count({ where: { isActive: true } }),
          prisma.user.count({ where: { isActive: false } }),
        ]).then(([active, inactive]) => ({ active, inactive }))
      : Promise.resolve(undefined);

  const [
    unassigned,
    myOwned,
    myActionsTakenCount,
    statusGroupCounts,
    priorityGroupCounts,
    unsetPriorityCount,
    recentlyUpdated,
    myActionsTaken,
    userCounts,
  ] = await Promise.all([
    prisma.ticket.count({
      where: {
        ownerId: null,
        status: { in: [...OPEN_TICKET_STATUSES] },
      },
    }),
    prisma.ticket.count({
      where: {
        ownerId: userId,
        status: { in: [...OPEN_TICKET_STATUSES] },
      },
    }),
    prisma.actionTaken.count({
      where: {
        performedById: userId,
      },
    }),
    prisma.ticket.groupBy({
      by: ['status'],
      where: {
        status: { in: [...OPEN_TICKET_STATUSES] },
      },
      _count: { id: true },
    }),
    prisma.ticket.groupBy({
      by: ['itPriority'],
      where: {
        status: { in: [...OPEN_TICKET_STATUSES] },
        itPriority: { not: null },
      },
      _count: { id: true },
    }),
    prisma.ticket.count({
      where: {
        status: { in: [...OPEN_TICKET_STATUSES] },
        itPriority: null,
      },
    }),
    prisma.ticket.findMany({
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: RECENTLY_UPDATED_CAP,
      select: {
        id: true,
        ticketNumber: true,
        summary: true,
        status: true,
        itPriority: true,
        requestedPriority: true,
        updatedAt: true,
      },
    }),
    prisma.actionTaken.findMany({
      where: {
        performedById: userId,
      },
      orderBy: [{ actionAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
      take: RECENTLY_UPDATED_CAP,
      select: {
        id: true,
        ticketId: true,
        actionAt: true,
        description: true,
        result: true,
        followUpRequired: true,
        ticket: {
          select: {
            ticketNumber: true,
            summary: true,
          },
        },
      },
    }),
    userCountsPromise,
  ]);

  const statusCounts: Record<string, number> = {
    NEW: 0,
    OPEN: 0,
    IN_PROGRESS: 0,
    WAITING_FOR_REQUESTER: 0,
    REOPENED: 0,
  };
  for (const item of statusGroupCounts) {
    if (item.status in statusCounts) {
      statusCounts[item.status] = item._count.id;
    }
  }

  const priorityCounts: Record<string, number> = {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
    CRITICAL: 0,
    UNSET: unsetPriorityCount,
  };
  for (const item of priorityGroupCounts) {
    if (item.itPriority && item.itPriority in priorityCounts) {
      priorityCounts[item.itPriority] = item._count.id;
    }
  }

  return {
    unassigned,
    myOwned,
    myActionsTakenCount,
    statusCounts,
    priorityCounts,
    recentlyUpdated,
    myActionsTaken,
    userCounts,
  };
}
