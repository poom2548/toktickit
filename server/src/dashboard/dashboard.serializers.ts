import { Ticket, TicketStatus, Priority } from '@prisma/client';
import { LABELS, DRILL_DOWNS } from './dashboard.constants.js';

export interface RecentTicketRecord {
  id: number;
  ticketNumber: string;
  summary: string;
  status: TicketStatus;
  itPriority: Priority | null;
  requestedPriority: Priority;
  updatedAt: Date;
}

export interface SerializedRecentTicket {
  id: number;
  ticketNumber: string;
  title: string;
  status: string;
  priority: string | null;
  updatedAt: string;
}

export function serializeRequesterRecentTicket(
  ticket: RecentTicketRecord
): SerializedRecentTicket {
  return {
    id: ticket.id,
    ticketNumber: ticket.ticketNumber,
    title: ticket.summary,
    status: ticket.status,
    priority: ticket.requestedPriority,
    updatedAt: ticket.updatedAt.toISOString(),
  };
}

export function serializeStaffRecentTicket(
  ticket: RecentTicketRecord
): SerializedRecentTicket {
  return {
    id: ticket.id,
    ticketNumber: ticket.ticketNumber,
    title: ticket.summary,
    status: ticket.status,
    priority: ticket.itPriority,
    updatedAt: ticket.updatedAt.toISOString(),
  };
}

export function serializeRecentlyUpdatedTicket(
  ticket: RecentTicketRecord
): SerializedRecentTicket {
  return serializeStaffRecentTicket(ticket);
}

export interface RequesterDashboardData {
  openTickets: number;
  waitingForMe: number;
  recentlyResolved: number;
  recentlyUpdated: RecentTicketRecord[];
}

export function serializeRequesterDashboard(data: RequesterDashboardData) {
  return {
    metrics: {
      openTickets: {
        label: LABELS.requester.openTickets,
        value: data.openTickets,
        drillDown: DRILL_DOWNS.requester.openTickets,
      },
      waitingForMe: {
        label: LABELS.requester.waitingForMe,
        value: data.waitingForMe,
        drillDown: DRILL_DOWNS.requester.waitingForMe,
      },
      recentlyResolved: {
        label: LABELS.requester.recentlyResolved,
        value: data.recentlyResolved,
        drillDown: DRILL_DOWNS.requester.recentlyResolved,
      },
    },
    recentlyUpdated: data.recentlyUpdated.map(serializeRequesterRecentTicket),
  };
}

export interface RecentStaffActionRecord {
  id: string;
  ticketId: number;
  actionAt: Date;
  description: string;
  result: string;
  followUpRequired: boolean;
  ticket: {
    ticketNumber: string;
    summary: string;
  };
}

export interface SerializedStaffAction {
  id: string;
  ticketId: number;
  ticketNumber: string;
  ticketTitle: string;
  action: string;
  result: string;
  followUpRequired: boolean;
  actionAt: string;
}

export function serializeStaffRecentAction(
  record: RecentStaffActionRecord
): SerializedStaffAction {
  return {
    id: record.id,
    ticketId: record.ticketId,
    ticketNumber: record.ticket.ticketNumber,
    ticketTitle: record.ticket.summary,
    action: record.description,
    result: record.result,
    followUpRequired: record.followUpRequired,
    actionAt: record.actionAt.toISOString(),
  };
}

export interface StaffDashboardData {
  unassigned: number;
  myOwned: number;
  myActionsTakenCount?: number;
  statusCounts: Record<string, number>;
  priorityCounts: Record<string, number>;
  recentlyUpdated: RecentTicketRecord[];
  myActionsTaken?: RecentStaffActionRecord[];
  userCounts?: {
    active: number;
    inactive: number;
  };
}

export function serializeStaffDashboard(data: StaffDashboardData) {
  const result: {
    metrics: {
      unassigned: {
        label: string;
        value: number;
        drillDown: string;
      };
      myOwned: {
        label: string;
        value: number;
        drillDown: string;
      };
      myActionsTaken: {
        label: string;
        value: number;
        drillDown: string;
      };
      statusCounts: {
        label: string;
        values: Record<string, number>;
        drillDownBase: string;
      };
      priorityCounts: {
        label: string;
        values: Record<string, number>;
        drillDownBase: string;
      };
    };
    userCounts?: {
      label: string;
      active: number;
      inactive: number;
    };
    recentlyUpdated: SerializedRecentTicket[];
    myActionsTaken: SerializedStaffAction[];
  } = {
    metrics: {
      unassigned: {
        label: LABELS.staff.unassigned,
        value: data.unassigned,
        drillDown: DRILL_DOWNS.staff.unassigned,
      },
      myOwned: {
        label: LABELS.staff.myOwned,
        value: data.myOwned,
        drillDown: DRILL_DOWNS.staff.myOwned,
      },
      myActionsTaken: {
        label: LABELS.staff.myActionsTaken,
        value: data.myActionsTakenCount ?? 0,
        drillDown: DRILL_DOWNS.staff.myActionsTaken,
      },
      statusCounts: {
        label: LABELS.staff.statusCounts,
        values: data.statusCounts,
        drillDownBase: DRILL_DOWNS.staff.statusCountsBase,
      },
      priorityCounts: {
        label: LABELS.staff.priorityCounts,
        values: data.priorityCounts,
        drillDownBase: DRILL_DOWNS.staff.priorityCountsBase,
      },
    },
    recentlyUpdated: data.recentlyUpdated.map(serializeStaffRecentTicket),
    myActionsTaken: (data.myActionsTaken ?? []).map(serializeStaffRecentAction),
  };

  if (data.userCounts) {
    result.userCounts = {
      label: LABELS.staff.userCounts,
      active: data.userCounts.active,
      inactive: data.userCounts.inactive,
    };
  }

  return result;
}
