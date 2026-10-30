import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getRequesterDashboard, RequesterDashboardResponse } from '../../api/dashboard';
import { NormalizedApiError } from '../../api/errors';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { PriorityBadge } from '../../components/shared/PriorityBadge';

export function RequesterDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<RequesterDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<NormalizedApiError | null>(null);

  const fetchDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await getRequesterDashboard();
      setData(response);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard(false);
  }, [fetchDashboard]);

  // Format date helper
  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  // 1. 403 Forbidden State
  if ((error && error.status === 403) || (user && user.role !== 'REQUESTER')) {
    return (
      <div className="container py-5" style={{ maxWidth: 720 }}>
        <div
          className="card shadow-sm border-0 p-5 text-center"
          style={{ borderRadius: 'var(--zen-radius-lg, 12px)', backgroundColor: 'var(--zen-bg-surface, #fff)' }}
        >
          <div className="display-4 mb-3">🚫</div>
          <h1 className="h4 text-danger mb-3">403 Forbidden</h1>
          <p className="text-muted mb-4">
            This page is reserved for Requesters only. IT Staff and Administrators should use the Staff Dashboard.
          </p>
          <div>
            <Link
              to="/staff/dashboard"
              className="btn text-white px-4 py-2"
              style={{
                backgroundColor: 'var(--zen-color-primary, #006B3C)',
                borderRadius: 'var(--zen-radius-md, 8px)',
                fontWeight: 600,
              }}
            >
              Go to Staff Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Loading Skeleton State
  if (loading && !data) {
    return (
      <div className="container py-4" data-testid="dashboard-skeleton" style={{ maxWidth: 1140 }}>
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div className="placeholder-glow w-50">
            <span className="placeholder col-8 placeholder-lg rounded" style={{ height: 32 }}></span>
          </div>
          <span className="placeholder col-2 rounded" style={{ height: 32 }}></span>
        </div>
        <div className="row g-3 mb-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="col-12 col-md-4">
              <div
                className="card shadow-sm border-0 p-4 placeholder-glow"
                style={{ borderRadius: 'var(--zen-radius-lg, 12px)', minHeight: 140 }}
              >
                <span className="placeholder col-7 mb-3 rounded" style={{ height: 16 }}></span>
                <span className="placeholder col-4 placeholder-lg rounded" style={{ height: 36 }}></span>
              </div>
            </div>
          ))}
        </div>
        <div
          className="card shadow-sm border-0 p-4 placeholder-glow"
          style={{ borderRadius: 'var(--zen-radius-lg, 12px)', minHeight: 200 }}
        >
          <span className="placeholder col-4 mb-3 rounded" style={{ height: 20 }}></span>
          <span className="placeholder col-12 mb-2 rounded" style={{ height: 16 }}></span>
          <span className="placeholder col-12 rounded" style={{ height: 16 }}></span>
        </div>
      </div>
    );
  }

  // 3. General Error State (500, network error)
  if (error && !data) {
    return (
      <div className="container py-4" style={{ maxWidth: 1140 }}>
        <div
          className="alert alert-danger d-flex align-items-center justify-content-between p-3"
          role="alert"
          style={{ borderRadius: 'var(--zen-radius-md, 8px)' }}
        >
          <div>
            <strong>Failed to load dashboard: </strong>
            <span>Unable to load dashboard metrics. Please try again.</span>
          </div>
          <button
            type="button"
            className="btn btn-outline-danger btn-sm"
            onClick={() => fetchDashboard(false)}
            style={{ borderRadius: 'var(--zen-radius-md, 8px)', fontWeight: 600 }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // 4. Data View
  const metrics = data?.metrics;
  const recentlyUpdated = data?.recentlyUpdated ?? [];
  const isEmpty =
    metrics &&
    metrics.openTickets.value === 0 &&
    metrics.waitingForMe.value === 0 &&
    metrics.recentlyResolved.value === 0 &&
    recentlyUpdated.length === 0;

  return (
    <div className="container py-4" style={{ maxWidth: 1140 }}>
      {/* Welcome header & refresh button */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1 fw-bold" style={{ color: 'var(--zen-color-text, #212529)' }}>
            Welcome back, {user?.name || 'Requester'}
          </h1>
          <p className="text-muted small mb-0">
            Overview of your reported tickets and recent activity
          </p>
        </div>
        <div>
          <button
            type="button"
            className="btn btn-sm d-inline-flex align-items-center gap-2"
            onClick={() => fetchDashboard(true)}
            disabled={refreshing}
            aria-label="Refresh dashboard"
            style={{
              borderRadius: 'var(--zen-radius-md, 8px)',
              backgroundColor: 'var(--zen-bg-surface, #fff)',
              border: '1px solid #dee2e6',
              fontWeight: 600,
              color: 'var(--zen-color-text, #212529)',
            }}
          >
            <span
              className={refreshing ? 'spinner-border spinner-border-sm text-success' : ''}
              style={{ display: 'inline-block', width: 14, height: 14 }}
              aria-hidden="true"
            >
              {!refreshing && '🔄'}
            </span>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Empty State Banner if no tickets system-wide for user */}
      {isEmpty && (
        <div
          className="card shadow-sm border-0 p-5 text-center mb-4"
          style={{ borderRadius: 'var(--zen-radius-lg, 12px)', backgroundColor: 'var(--zen-bg-surface, #fff)' }}
        >
          <div style={{ fontSize: 48 }} className="mb-2">📋</div>
          <h2 className="h5 text-muted mb-2">No tickets found</h2>
          <p className="text-muted small mb-3">
            You do not have any tickets in the system yet.
          </p>
          <div>
            <Link
              to="/tickets"
              className="btn text-white btn-sm"
              style={{
                backgroundColor: 'var(--zen-color-primary, #006B3C)',
                borderRadius: 'var(--zen-radius-md, 8px)',
                fontWeight: 600,
              }}
            >
              ➕ Create New Ticket
            </Link>
          </div>
        </div>
      )}

      {/* 3 Metric Cards */}
      {metrics && (
        <div className="row g-3 mb-4">
          {/* Card 1: Open Tickets */}
          <div className="col-12 col-md-4">
            <Link
              to={metrics.openTickets.drillDown}
              className="card text-decoration-none shadow-sm border-0 p-3 h-100 transition-shadow"
              style={{
                borderRadius: 'var(--zen-radius-lg, 12px)',
                backgroundColor: 'var(--zen-bg-surface, #fff)',
                borderLeft: '4px solid var(--zen-color-primary, #006B3C)',
              }}
              aria-label={`My Open Tickets ${metrics.openTickets.value}`}
            >
              <div className="d-flex justify-content-between align-items-start mb-2">
                <span className="text-muted small fw-semibold">My Open Tickets</span>
                <span className="badge" style={{ backgroundColor: 'var(--zen-color-primary-light, #EAF6EF)', color: 'var(--zen-color-primary, #006B3C)' }}>
                  Open
                </span>
              </div>
              <div className="h2 mb-2 fw-bold" style={{ color: 'var(--zen-color-primary, #006B3C)' }}>
                {metrics.openTickets.value}
              </div>
              <div className="mt-auto small fw-semibold d-flex align-items-center gap-1" style={{ color: 'var(--zen-color-primary, #006B3C)' }}>
                View all →
              </div>
            </Link>
          </div>

          {/* Card 2: Waiting for Me */}
          <div className="col-12 col-md-4">
            <Link
              to={metrics.waitingForMe.drillDown}
              className="card text-decoration-none shadow-sm border-0 p-3 h-100 transition-shadow"
              style={{
                borderRadius: 'var(--zen-radius-lg, 12px)',
                backgroundColor: 'var(--zen-bg-surface, #fff)',
                borderLeft: '4px solid #f59e0b',
              }}
              aria-label={`Waiting for Me ${metrics.waitingForMe.value}`}
            >
              <div className="d-flex justify-content-between align-items-start mb-2">
                <span className="text-muted small fw-semibold">Waiting for Me</span>
                <span className="badge" style={{ backgroundColor: '#fffbeb', color: '#b45309' }}>
                  Action Needed
                </span>
              </div>
              <div className="h2 mb-2 fw-bold" style={{ color: '#b45309' }}>
                {metrics.waitingForMe.value}
              </div>
              <div className="mt-auto small fw-semibold d-flex align-items-center gap-1" style={{ color: 'var(--zen-color-primary, #006B3C)' }}>
                View all →
              </div>
            </Link>
          </div>

          {/* Card 3: Recently Resolved */}
          <div className="col-12 col-md-4">
            <Link
              to={metrics.recentlyResolved.drillDown}
              className="card text-decoration-none shadow-sm border-0 p-3 h-100 transition-shadow"
              style={{
                borderRadius: 'var(--zen-radius-lg, 12px)',
                backgroundColor: 'var(--zen-bg-surface, #fff)',
                borderLeft: '4px solid var(--zen-color-secondary, #0B7A46)',
              }}
              aria-label={`Recently Resolved ${metrics.recentlyResolved.value}`}
            >
              <div className="d-flex justify-content-between align-items-start mb-2">
                <span className="text-muted small fw-semibold">Recently Resolved</span>
                <span className="badge" style={{ backgroundColor: '#ecfdf5', color: '#047857' }}>
                  Last 7 Days
                </span>
              </div>
              <div className="h2 mb-2 fw-bold" style={{ color: 'var(--zen-color-secondary, #0B7A46)' }}>
                {metrics.recentlyResolved.value}
              </div>
              <div className="mt-auto small fw-semibold d-flex align-items-center gap-1" style={{ color: 'var(--zen-color-primary, #006B3C)' }}>
                View all →
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Lower Row: Recent Updates (60% on desktop) & Quick Actions (40% on desktop) */}
      <div className="row g-4">
        {/* Recent Updates */}
        <div className="col-12 col-lg-8">
          <div
            className="card shadow-sm border-0 p-4 h-100"
            style={{ borderRadius: 'var(--zen-radius-lg, 12px)', backgroundColor: 'var(--zen-bg-surface, #fff)' }}
          >
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h2 className="h5 mb-0 fw-bold" style={{ color: 'var(--zen-color-text, #212529)' }}>
                Recent Updates
              </h2>
              <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#1e293b', border: '1px solid #cbd5e1' }}>Latest 5</span>
            </div>

            {recentlyUpdated.length === 0 ? (
              <p className="text-muted small my-3">No recent updates</p>
            ) : (
              <div className="table-responsive dashboard-table-wrapper" tabIndex={0} aria-label="Recently updated tickets">
                <table className="table table-hover align-middle mb-0 dashboard-table">
                  <caption className="visually-hidden">Recently updated tickets</caption>
                  <thead>
                    <tr className="text-muted small">
                      <th scope="col" style={{ width: 110 }}>Ticket ID</th>
                      <th scope="col">Summary</th>
                      <th scope="col" style={{ width: 120 }}>Status</th>
                      <th scope="col" style={{ width: 100 }}>Priority</th>
                      <th scope="col" style={{ width: 140 }}>Last Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentlyUpdated.map((ticket) => (
                      <tr key={ticket.id}>
                        <td data-label="Ticket ID" className="fw-semibold small" style={{ color: 'var(--zen-color-primary, #006B3C)' }}>
                          {ticket.ticketNumber}
                        </td>
                        <td data-label="Summary" className="fw-medium text-truncate" style={{ maxWidth: 220 }} title={ticket.title}>
                          {ticket.title}
                        </td>
                        <td data-label="Status">
                          <StatusBadge status={ticket.status} />
                        </td>
                        <td data-label="Priority">
                          {ticket.priority ? (
                            <PriorityBadge priority={ticket.priority as any} />
                          ) : (
                            <span className="text-muted small">—</span>
                          )}
                        </td>
                        <td data-label="Last Updated" className="text-muted small">
                          {formatDate(ticket.updatedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="col-12 col-lg-4">
          <div
            className="card shadow-sm border-0 p-4 h-100"
            style={{ borderRadius: 'var(--zen-radius-lg, 12px)', backgroundColor: 'var(--zen-bg-surface, #fff)' }}
          >
            <h2 className="h5 mb-3 fw-bold" style={{ color: 'var(--zen-color-text, #212529)' }}>
              Quick Actions
            </h2>
            <div className="d-flex flex-column gap-3">
              <Link
                to="/tickets"
                className="btn text-white py-2 text-start d-flex align-items-center gap-2"
                style={{
                  backgroundColor: 'var(--zen-color-primary, #006B3C)',
                  borderRadius: 'var(--zen-radius-md, 8px)',
                  fontWeight: 600,
                }}
              >
                <span>➕</span>
                <span>New Ticket</span>
              </Link>
              <Link
                to="/my-tickets"
                className="btn btn-outline-secondary py-2 text-start d-flex align-items-center gap-2"
                style={{
                  borderRadius: 'var(--zen-radius-md, 8px)',
                  fontWeight: 600,
                  borderColor: '#dee2e6',
                  color: 'var(--zen-color-text, #212529)',
                }}
              >
                <span>🎟️</span>
                <span>My Tickets</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RequesterDashboardPage;
