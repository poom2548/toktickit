import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AppShell } from '../../components/AppShell';

let mockCurrentUser: any = {
  id: 'u1',
  name: 'Alice Requester',
  role: 'REQUESTER',
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

async function loadRequesterDashboard() {
  try {
    const path = '../../pages/requester/RequesterDashboardPage';
    const mod = await import(/* @vite-ignore */ path);
    return mod.RequesterDashboardPage || mod.default;
  } catch (err: any) {
    if (err.message && (err.message.includes('Cannot find module') || err.message.includes('Failed to load'))) {
      throw new Error('Component not implemented: RequesterDashboardPage');
    }
    throw err;
  }
}

const mockRequesterDashboardData = {
  metrics: {
    openTickets: {
      value: 3,
      label: 'My Open Tickets',
      drillDown: '/my-tickets?statusGroup=open',
    },
    waitingForMe: {
      value: 1,
      label: 'Waiting for Me',
      drillDown: '/my-tickets?status=WAITING_FOR_REQUESTER',
    },
    recentlyResolved: {
      value: 2,
      label: 'แก้ปัญหาแล้วล่าสุด (Recently Resolved)',
      drillDown: '/my-tickets?status=RESOLVED&resolvedWithinDays=7',
    },
  },
  recentlyUpdated: [
    {
      id: 1,
      ticketNumber: 'TKT-001',
      title: 'Printer jammed',
      status: 'OPEN',
      priority: 'MEDIUM',
      updatedAt: '2026-10-12T08:00:00.000Z',
    },
    {
      id: 2,
      ticketNumber: 'TKT-002',
      title: 'Cannot access shared drive',
      status: 'WAITING_FOR_REQUESTER',
      priority: 'HIGH',
      updatedAt: '2026-10-12T07:15:00.000Z',
    },
  ],
};

describe('RequesterDashboard', () => {
  let fetchMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentUser = {
      id: 'u1',
      name: 'Alice Requester',
      role: 'REQUESTER',
      requiresPasswordChange: false,
    };
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('UI-03: RequesterDashboard render and click', async () => {
    const RequesterDashboard = await loadRequesterDashboard();

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockRequesterDashboardData,
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <RequesterDashboard />
      </MemoryRouter>
    );

    // 1. Welcome section and refresh button
    await waitFor(() => {
      expect(screen.getByText(/ยินดีต้อนรับกลับ|welcome back/i)).toBeInTheDocument();
    });

    const refreshBtn = screen.getByRole('button', { name: /รีเฟรช|refresh/i });
    expect(refreshBtn).toBeInTheDocument();

    // 2. Metric cards: My Open Tickets, Waiting for Me, Recently Resolved
    const openLink = screen.getByRole('link', { name: /my open tickets|ตั๋วที่ยังเปิดอยู่/i });
    expect(openLink).toHaveAttribute('href', '/my-tickets?statusGroup=open');
    expect(openLink).toHaveTextContent('3');

    const waitingLink = screen.getByRole('link', { name: /waiting for me|รอฉันดำเนินการ/i });
    expect(waitingLink).toHaveAttribute('href', '/my-tickets?status=WAITING_FOR_REQUESTER');
    expect(waitingLink).toHaveTextContent('1');

    const resolvedLink = screen.getByRole('link', { name: /recently resolved|แก้ปัญหาแล้วล่าสุด/i });
    expect(resolvedLink).toHaveAttribute('href', '/my-tickets?status=RESOLVED&resolvedWithinDays=7');
    expect(resolvedLink).toHaveTextContent('2');

    // 3. Recently updated tickets
    expect(screen.getByText('TKT-001')).toBeInTheDocument();
    expect(screen.getByText('Printer jammed')).toBeInTheDocument();
    expect(screen.getByText('TKT-002')).toBeInTheDocument();

    // 4. Quick Actions
    const myTicketsAction = screen.getByRole('link', { name: /ตั๋วทั้งหมดของฉัน|my tickets|\/my-tickets/i });
    expect(myTicketsAction).toHaveAttribute('href', '/my-tickets');

    // 5. Refresh button click refetches
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        ...mockRequesterDashboardData,
        metrics: {
          ...mockRequesterDashboardData.metrics,
          openTickets: { ...mockRequesterDashboardData.metrics.openTickets, value: 4 },
        },
      }),
    });

    fireEvent.click(refreshBtn);
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  it('UI-04: RequesterDashboard empty states and errors', async () => {
    const RequesterDashboard = await loadRequesterDashboard();

    // 1. Loading state
    let resolveLoading: any;
    fetchMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveLoading = resolve;
        })
    );

    const { unmount } = render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <RequesterDashboard />
      </MemoryRouter>
    );

    expect(screen.getByTestId('dashboard-skeleton') || screen.getByText(/กำลังโหลด|loading/i)).toBeInTheDocument();

    // Resolve with empty data (counts = 0)
    resolveLoading({
      ok: true,
      status: 200,
      json: async () => ({
        metrics: {
          openTickets: { value: 0, label: 'My Open Tickets', drillDown: '/my-tickets?statusGroup=open' },
          waitingForMe: { value: 0, label: 'Waiting for Me', drillDown: '/my-tickets?status=WAITING_FOR_REQUESTER' },
          recentlyResolved: { value: 0, label: 'Recently Resolved', drillDown: '/my-tickets?status=RESOLVED&resolvedWithinDays=7' },
        },
        recentlyUpdated: [],
      }),
    });

    await waitFor(() => {
      expect(screen.getByText(/ยังไม่มีข้อมูลตั๋ว|no tickets found/i)).toBeInTheDocument();
    });
    unmount();

    // 2. Network error / 500 banner with retry button
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal Server Error' }),
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <RequesterDashboard />
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
      json: async () => mockRequesterDashboardData,
    });

    fireEvent.click(retryBtn);
    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    // 3. 403 Forbidden state with link back to Staff Dashboard
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({ error: 'Forbidden' }),
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <RequesterDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/403|ไม่มีสิทธิ์|forbidden/i)).toBeInTheDocument();
      const backLink = screen.getByRole('link', { name: /แดชบอร์ดเจ้าหน้าที่|staff dashboard|\/staff\/dashboard/i });
      expect(backLink).toHaveAttribute('href', '/staff/dashboard');
    });
  });

  it('UI-13: Requester navigation', async () => {
    mockCurrentUser = {
      id: 'u1',
      name: 'Alice Requester',
      role: 'REQUESTER',
      requiresPasswordChange: false,
    };

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AppShell>
          <div>Requester Dashboard Content</div>
        </AppShell>
      </MemoryRouter>
    );

    // Look for Dashboard link pointing to /dashboard
    const dashboardNavLinks = screen.getAllByRole('link', { name: /แดชบอร์ด|dashboard/i });
    expect(dashboardNavLinks.length).toBeGreaterThanOrEqual(1);

    const activeLink = dashboardNavLinks.find(
      (link) => link.getAttribute('href') === '/dashboard'
    );
    expect(activeLink).toBeDefined();
    expect(activeLink).toHaveAttribute('aria-current', 'page');

    // Should not show Staff queue link
    expect(screen.queryByRole('link', { name: /ticket queue/i })).not.toBeInTheDocument();
  });
});
