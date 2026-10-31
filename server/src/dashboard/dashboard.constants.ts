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
    openTickets: '/my-tickets?statusGroup=open',
    waitingForMe: '/my-tickets?status=WAITING_FOR_REQUESTER',
    recentlyResolved: '/my-tickets?status=RESOLVED&resolvedWithinDays=7',
  },
  staff: {
    unassigned: '/staff/tickets?statusGroup=open&assignee=unassigned',
    myOwned: '/staff/tickets?statusGroup=open&assignee=me',
    myActionsTaken: '/staff/tickets?assignee=me',
    statusCountsBase: '/staff/tickets?status=',
    priorityCountsBase: '/staff/tickets?statusGroup=open&priority=',
  },
} as const;

export const LABELS = {
  requester: {
    openTickets: 'My Open Tickets',
    waitingForMe: 'Waiting for Me',
    recentlyResolved: 'Recently Resolved',
  },
  staff: {
    unassigned: 'Unassigned',
    myOwned: 'My Owned',
    myActionsTaken: 'My Actions Taken',
    statusCounts: 'By Status',
    priorityCounts: 'By IT Priority',
    userCounts: 'User Accounts (Admin Only)',
  },
} as const;
