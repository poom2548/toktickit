import { parseApiError } from './errors';

export interface DashboardMetricItem {
  label: string;
  value: number;
  drillDown: string;
}

export interface RequesterDashboardMetrics {
  openTickets: DashboardMetricItem;
  waitingForMe: DashboardMetricItem;
  recentlyResolved: DashboardMetricItem;
}

export interface RecentlyUpdatedTicket {
  id: number;
  ticketNumber: string;
  title: string;
  status: string;
  priority: string | null;
  updatedAt: string;
}

export interface RequesterDashboardResponse {
  metrics: RequesterDashboardMetrics;
  recentlyUpdated: RecentlyUpdatedTicket[];
}

export interface StaffDashboardMetrics {
  unassigned: DashboardMetricItem;
  myOwned: DashboardMetricItem;
  statusCounts: {
    label: string;
    values: {
      NEW: number;
      OPEN: number;
      IN_PROGRESS: number;
      WAITING_FOR_REQUESTER: number;
      REOPENED: number;
    };
    drillDownBase: string;
  };
  priorityCounts: {
    label: string;
    values: {
      LOW: number;
      MEDIUM: number;
      HIGH: number;
      CRITICAL: number;
      UNSET: number;
    };
    drillDownBase: string;
  };
  userCounts?: {
    label: string;
    active: number;
    inactive: number;
  };
}

export interface StaffDashboardResponse {
  metrics: StaffDashboardMetrics;
  userCounts?: {
    label: string;
    active: number;
    inactive: number;
  };
  recentlyUpdated: RecentlyUpdatedTicket[];
}

export async function getRequesterDashboard(): Promise<RequesterDashboardResponse> {
  const res = await fetch('/api/dashboard/requester', {
    credentials: 'include',
  });

  if (!res.ok) {
    let body: any = null;
    try {
      body = await res.json();
    } catch {
      // ignore
    }
    throw parseApiError(res, body);
  }

  return res.json();
}

export async function getStaffDashboard(): Promise<StaffDashboardResponse> {
  const res = await fetch('/api/dashboard/staff', {
    credentials: 'include',
  });

  if (!res.ok) {
    let body: any = null;
    try {
      body = await res.json();
    } catch {
      // ignore
    }
    throw parseApiError(res, body);
  }

  return res.json();
}
