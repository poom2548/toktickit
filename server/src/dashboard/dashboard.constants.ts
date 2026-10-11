import { TicketStatus, Priority } from '@prisma/client';

export const OPEN_TICKET_STATUSES: readonly TicketStatus[] = [
  TicketStatus.NEW,
  TicketStatus.OPEN,
  TicketStatus.IN_PROGRESS,
  TicketStatus.WAITING_FOR_REQUESTER,
  TicketStatus.REOPENED,
] as const;

export const IT_PRIORITIES: readonly Priority[] = [
  Priority.LOW,
  Priority.MEDIUM,
  Priority.HIGH,
  Priority.CRITICAL,
] as const;

export const RECENTLY_UPDATED_CAP = 5;

export const DRILL_DOWNS = {
  requester: {
    openTickets: '/tickets?statusGroup=open',
    waitingForMe: '/tickets?status=WAITING_FOR_REQUESTER',
    recentlyResolved: '/tickets?status=RESOLVED',
  },
  staff: {
    unassigned: '/staff/tickets?statusGroup=open&assignee=unassigned',
    myOwned: '/staff/tickets?statusGroup=open&assignee=me',
    statusCountsBase: '/staff/tickets?status=',
    priorityCountsBase: '/staff/tickets?priority=',
  },
} as const;

export const LABELS = {
  requester: {
    openTickets: 'My Open Tickets',
    waitingForMe: 'Waiting for Me',
    recentlyResolved: 'แก้ปัญหาแล้วล่าสุด (Recently Resolved)',
  },
  staff: {
    unassigned: 'Unassigned',
    myOwned: 'My Owned',
    statusCounts: 'By Status',
    priorityCounts: 'By IT Priority',
    userCounts: 'User Accounts (Admin Only)',
  },
} as const;
