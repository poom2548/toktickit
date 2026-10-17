import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from '../../components/AppShell';

let mockCurrentUser: any = {
  id: 'u2',
  name: 'Frank IT',
  role: 'IT_STAFF',
  requiresPasswordChange: false,
};

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockCurrentUser,
    isLoading: false,
    logout: vi.fn(),
    refreshUser: vi.fn(),
  }),
  AuthProvider: ({ children }: any) => <>{children}</>,
}));

async function loadStaffDashboard() {
  try {
    const path = '../../pages/staff/StaffDashboardPage';
    const mod = await import(/* @vite-ignore */ path);
    return mod.StaffDashboardPage || mod.default;
  } catch (err: any) {
    if (err.message && (err.message.includes('Cannot find module') || err.message.includes('Failed to load'))) {
      throw new Error('Component not implemented: StaffDashboardPage');
    }
    throw err;
  }
}

const mockStaffDashboardData = {
  metrics: {
    unassigned: {
      value: 5,
      label: 'Unassigned',
      drillDown: '/staff/tickets?statusGroup=open&assignee=unassigned',
    },
    myOwned: {
      value: 2,
      label: 'My Owned',
      drillDown: '/staff/tickets?statusGroup=open&assignee=me',
    },
    statusCounts: {
      values: {
        NEW: 1,
        OPEN: 2,
        IN_PROGRESS: 2,
        WAITING_FOR_REQUESTER: 1,
        REOPENED: 1,
      },
      label: 'By Status',
      drillDownBase: '/staff/tickets?status=',
    },
    priorityCounts: {
      values: {
        LOW: 1,
        MEDIUM: 2,
        HIGH: 2,
        CRITICAL: 1,
        UNSET: 1,
      },
      label: 'By IT Priority',
      drillDownBase: '/staff/tickets?statusGroup=open&priority=',
    },
    userCounts: {
      active: 10,
      inactive: 2,
      label: 'User Accounts (Admin Only)',
    },
  },
  recentlyUpdated: [
    {
      id: 101,
      ticketNumber: 'TKT-101',
      title: 'Email server slow',
      status: 'OPEN',
      priority: 'HIGH',
      updatedAt: '2026-10-12T08:00:00.000Z',
    },
    {
      id: 102,
      ticketNumber: 'TKT-102',
      title: 'Mouse replacement needed',
      status: 'NEW',
      priority: null,
      updatedAt: '2026-10-12T07:30:00.000Z',
    },
  ],
};

describe('StaffDashboard', () => {
  let fetchMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentUser = {
      id: 'u2',
      name: 'Frank IT',
      role: 'IT_STAFF',
      requiresPasswordChange: false,
    };
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('UI-01: StaffDashboard render and click', async () => {
    const StaffDashboard = await loadStaffDashboard();

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        ...mockStaffDashboardData,
        metrics: {
          ...mockStaffDashboardData.metrics,
          userCounts: undefined, // omitted for IT_STAFF
        },
      }),
    });

    render(
      <MemoryRouter initialEntries={['/staff/dashboard']}>
        <StaffDashboard />
      </MemoryRouter>
    );

    // 1. Welcome section and refresh button
    await waitFor(() => {
      expect(screen.getByText(/ยินดีต้อนรับกลับ|welcome back/i)).toBeInTheDocument();
    });

    const refreshBtn = screen.getByRole('button', { name: /รีเฟรช|refresh/i });
    expect(refreshBtn).toBeInTheDocument();

    // 2. Metric cards: Unassigned and My Owned drill-downs
    const unassignedLink = screen.getByRole('link', { name: /unassigned|ยังไม่ได้มอบหมาย/i });
    expect(unassignedLink).toHaveAttribute('href', '/staff/tickets?statusGroup=open&assignee=unassigned');
    expect(unassignedLink).toHaveTextContent('5');

    const myOwnedLink = screen.getByRole('link', { name: /my owned|คิวของฉัน/i });
    expect(myOwnedLink).toHaveAttribute('href', '/staff/tickets?statusGroup=open&assignee=me');
    expect(myOwnedLink).toHaveTextContent('2');

    // 3. Status count buckets drill-downs
    const inProgressLink = screen.getByRole('link', { name: /IN_PROGRESS/i });
    expect(inProgressLink).toHaveAttribute('href', '/staff/tickets?status=IN_PROGRESS');

    // 4. Priority count buckets drill-downs (including UNSET)
    const unsetPriorityLink = screen.getByRole('link', { name: /UNSET|ยังไม่ระบุ/i });
    expect(unsetPriorityLink).toHaveAttribute('href', '/staff/tickets?statusGroup=open&priority=UNSET');

    // 5. User counts hidden for IT_STAFF
    expect(screen.queryByText(/User Accounts/i)).not.toBeInTheDocument();

    // 6. Recently updated tickets
    expect(screen.getByText('TKT-101')).toBeInTheDocument();
    expect(screen.getByText('Email server slow')).toBeInTheDocument();
    expect(screen.getByText('TKT-102')).toBeInTheDocument();

    // 7. Refresh button click refetches
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        ...mockStaffDashboardData,
        metrics: {
          ...mockStaffDashboardData.metrics,
          unassigned: { ...mockStaffDashboardData.metrics.unassigned, value: 6 },
          userCounts: undefined,
        },
      }),
    });

    fireEvent.click(refreshBtn);
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    // 8. Test Administrator sees userCounts
    mockCurrentUser = {
      id: 'u3',
      name: 'Grace Admin',
      role: 'ADMINISTRATOR',
      requiresPasswordChange: false,
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockStaffDashboardData,
    });

    render(
      <MemoryRouter initialEntries={['/staff/dashboard']}>
        <StaffDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/User Accounts/i)).toBeInTheDocument();
      expect(screen.getByText(/10/)).toBeInTheDocument(); // active
    });
  });

  it('UI-02: StaffDashboard empty states and errors', async () => {
    const StaffDashboard = await loadStaffDashboard();

    // 1. Loading state (deferred promise)
    let resolveLoading: any;
    fetchMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveLoading = resolve;
        })
    );

    const { unmount } = render(
      <MemoryRouter initialEntries={['/staff/dashboard']}>
        <StaffDashboard />
      </MemoryRouter>
    );

    expect(screen.getByTestId('dashboard-skeleton') || screen.getByText(/กำลังโหลด|loading/i)).toBeInTheDocument();

    // Resolve with empty data (counts = 0)
    resolveLoading({
      ok: true,
      status: 200,
      json: async () => ({
        metrics: {
          unassigned: { value: 0, label: 'Unassigned', drillDown: '/staff/tickets?statusGroup=open&assignee=unassigned' },
          myOwned: { value: 0, label: 'My Owned', drillDown: '/staff/tickets?statusGroup=open&assignee=me' },
          statusCounts: {
            values: { NEW: 0, OPEN: 0, IN_PROGRESS: 0, WAITING_FOR_REQUESTER: 0, REOPENED: 0 },
            label: 'By Status',
            drillDownBase: '/staff/tickets?status=',
          },
          priorityCounts: {
            values: { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0, UNSET: 0 },
            label: 'By IT Priority',
            drillDownBase: '/staff/tickets?statusGroup=open&priority=',
          },
        },
        recentlyUpdated: [],
      }),
    });

    await waitFor(() => {
      expect(screen.getByText(/ยังไม่มีข้อมูลตั๋ว|no tickets found/i)).toBeInTheDocument();
    });
    unmount();

    // 2. Network error / 500 error banner with retry button
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal Server Error' }),
    });

    render(
      <MemoryRouter initialEntries={['/staff/dashboard']}>
        <StaffDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    const retryBtn = screen.getByRole('button', { name: /ลองใหม่|retry/i });
    expect(retryBtn).toBeInTheDocument();

    // Clicking retry reloads
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockStaffDashboardData,
    });

    fireEvent.click(retryBtn);
    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    // 3. 403 Forbidden state with link back to Requester Dashboard
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({ error: 'Forbidden' }),
    });

    render(
      <MemoryRouter initialEntries={['/staff/dashboard']}>
        <StaffDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/403|ไม่มีสิทธิ์|forbidden/i)).toBeInTheDocument();
      const backLink = screen.getByRole('link', { name: /แดชบอร์ดผู้ร้องขอ|requester dashboard|\/dashboard/i });
      expect(backLink).toHaveAttribute('href', '/dashboard');
    });
  });

  it('UI-13: Staff navigation', async () => {
    mockCurrentUser = {
      id: 'u2',
      name: 'Frank IT',
      role: 'IT_STAFF',
      requiresPasswordChange: false,
    };

    render(
      <MemoryRouter initialEntries={['/staff/dashboard']}>
        <AppShell>
          <div>Staff Dashboard Content</div>
        </AppShell>
      </MemoryRouter>
    );

    // Look for Dashboard link in navigation pointing to /staff/dashboard
    const dashboardNavLinks = screen.getAllByRole('link', { name: /แดชบอร์ด|dashboard/i });
    expect(dashboardNavLinks.length).toBeGreaterThanOrEqual(1);

    const activeLink = dashboardNavLinks.find(
      (link) => link.getAttribute('href') === '/staff/dashboard'
    );
    expect(activeLink).toBeDefined();
    expect(activeLink).toHaveAttribute('aria-current', 'page');

    // Should not show Requester my-tickets/dashboard link
    expect(screen.queryByRole('link', { name: /my tickets/i })).not.toBeInTheDocument();
  });
});
