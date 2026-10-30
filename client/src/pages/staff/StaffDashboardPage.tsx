import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getStaffDashboard, StaffDashboardResponse } from '../../api/dashboard';
import { NormalizedApiError } from '../../api/errors';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { PriorityBadge } from '../../components/shared/PriorityBadge';

const STATUS_ORDER = ['NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'REOPENED'] as const;
const PRIORITY_ORDER = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'UNSET'] as const;

export function StaffDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<StaffDashboardResponse | null>(null);
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
      const response = await getStaffDashboard();
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
  if ((error && error.status === 403) || (user && user.role === 'REQUESTER')) {
    return (
      <div className="container py-5" style={{ maxWidth: 720 }}>
        <div
          className="card shadow-sm border-0 p-5 text-center"
          style={{ borderRadius: 'var(--zen-radius-lg, 12px)', backgroundColor: 'var(--zen-bg-surface, #fff)' }}
        >
          <div className="display-4 mb-3">🚫</div>
          <h1 className="h4 text-danger mb-3">403 Forbidden</h1>
          <p className="text-muted mb-4">
            This page is reserved for IT Staff and Administrators only.
          </p>
          <div>
            <Link
              to="/dashboard"
              className="btn text-white px-4 py-2"
              style={{
                backgroundColor: 'var(--zen-color-primary, #006B3C)',
                borderRadius: 'var(--zen-radius-md, 8px)',
                fontWeight: 600,
              }}
            >
              Go to Requester Dashboard
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
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="col-12 col-md-6 col-lg-3">
              <div
                className="card shadow-sm border-0 p-4 placeholder-glow"
                style={{ borderRadius: 'var(--zen-radius-lg, 12px)', minHeight: 130 }}
              >
                <span className="placeholder col-6 mb-3 rounded" style={{ height: 16 }}></span>
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
  const myActionsTaken = data?.myActionsTaken ?? [];
  const myActionsTakenMetric = metrics?.myActionsTaken ?? {
    label: 'My Actions Taken',
    value: myActionsTaken.length,
    drillDown: '/staff/tickets?assignee=me',
  };
  const statusValues = metrics?.statusCounts?.values;
  const priorityValues = metrics?.priorityCounts?.values;

  const isStatusAllZero = statusValues ? Object.values(statusValues).every((v) => v === 0) : true;
  const isPriorityAllZero = priorityValues ? Object.values(priorityValues).every((v) => v === 0) : true;
  const isEmpty =
    metrics &&
    metrics.unassigned.value === 0 &&
    metrics.myOwned.value === 0 &&
    isStatusAllZero &&
    isPriorityAllZero &&
    recentlyUpdated.length === 0;

  const isAdmin = user?.role === 'ADMINISTRATOR';
  const userCounts = data?.userCounts || (metrics as any)?.userCounts;
  const showUserCounts = isAdmin && !!userCounts;
  const topCardColClass = showUserCounts
    ? 'col-12 col-sm-6 col-lg-3'
    : 'col-12 col-sm-6 col-lg-4';

  return (
    <div className="container py-4" style={{ maxWidth: 1140 }}>
      {/* Welcome header & refresh button */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1 fw-bold" style={{ color: 'var(--zen-color-text, #212529)' }}>
            Welcome back, {user?.name || 'IT Staff'}
          </h1>
          <p className="text-muted small mb-0">
            Overview of ticket queues, assignments, and current metrics
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

      {/* Empty State Banner if completely empty */}
      {isEmpty && (
        <div
          className="card shadow-sm border-0 p-5 text-center mb-4"
          style={{ borderRadius: 'var(--zen-radius-lg, 12px)', backgroundColor: 'var(--zen-bg-surface, #fff)' }}
        >
          <div style={{ fontSize: 48 }} className="mb-2">📋</div>
          <h2 className="h5 text-muted mb-2">No tickets found</h2>
          <p className="text-muted small mb-3">
            There are currently no open tickets in the queue.
          </p>
        </div>
      )}

      {/* Top Metric Cards: Unassigned, My Owned, My Actions Taken, User Accounts (Admin only) */}
      {metrics && (
        <div className="row g-3 mb-4">
          {/* Card 1: Unassigned */}
          <div className={topCardColClass}>
            <Link
              to={metrics.unassigned.drillDown}
              className="card text-decoration-none shadow-sm border-0 p-3 h-100 transition-shadow"
              style={{
                borderRadius: 'var(--zen-radius-lg, 12px)',
                backgroundColor: 'var(--zen-bg-surface, #fff)',
                borderLeft: '4px solid #ef4444',
              }}
              aria-label={`Unassigned ${metrics.unassigned.value}`}
            >
              <div className="d-flex justify-content-between align-items-start mb-2">
                <span className="text-muted small fw-semibold">Unassigned</span>
                <span className="badge" style={{ backgroundColor: '#fee2e2', color: '#b91c1c' }}>
                  Queue
                </span>
              </div>
              <div className="h2 mb-2 fw-bold" style={{ color: '#b91c1c' }}>
                {metrics.unassigned.value}
              </div>
              <div className="mt-auto small fw-semibold d-flex align-items-center gap-1" style={{ color: 'var(--zen-color-primary, #006B3C)' }}>
                View unassigned tickets →
              </div>
            </Link>
          </div>

          {/* Card 2: My Owned */}
          <div className={topCardColClass}>
            <Link
              to={metrics.myOwned.drillDown}
              className="card text-decoration-none shadow-sm border-0 p-3 h-100 transition-shadow"
              style={{
                borderRadius: 'var(--zen-radius-lg, 12px)',
                backgroundColor: 'var(--zen-bg-surface, #fff)',
                borderLeft: '4px solid var(--zen-color-primary, #006B3C)',
              }}
              aria-label={`My Owned ${metrics.myOwned.value}`}
            >
              <div className="d-flex justify-content-between align-items-start mb-2">
                <span className="text-muted small fw-semibold">My Owned</span>
                <span className="badge" style={{ backgroundColor: 'var(--zen-color-primary-light, #EAF6EF)', color: 'var(--zen-color-primary, #006B3C)' }}>
                  Assigned
                </span>
              </div>
              <div className="h2 mb-2 fw-bold" style={{ color: 'var(--zen-color-primary, #006B3C)' }}>
                {metrics.myOwned.value}
              </div>
              <div className="mt-auto small fw-semibold d-flex align-items-center gap-1" style={{ color: 'var(--zen-color-primary, #006B3C)' }}>
                View my queue →
              </div>
            </Link>
          </div>

          {/* Card 3: My Actions Taken */}
          <div className={topCardColClass}>
            <Link
              to={myActionsTakenMetric.drillDown}
              className="card text-decoration-none shadow-sm border-0 p-3 h-100 transition-shadow"
              style={{
                borderRadius: 'var(--zen-radius-lg, 12px)',
                backgroundColor: 'var(--zen-bg-surface, #fff)',
                borderLeft: '4px solid #0284c7',
              }}
              aria-label={`My Actions Taken ${myActionsTakenMetric.value}`}
            >
              <div className="d-flex justify-content-between align-items-start mb-2">
                <span className="text-muted small fw-semibold">My Actions Taken</span>
                <span className="badge" style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}>
                  Actions
                </span>
              </div>
              <div className="h2 mb-2 fw-bold" style={{ color: '#0369a1' }}>
                {myActionsTakenMetric.value}
              </div>
              <div className="mt-auto small fw-semibold d-flex align-items-center gap-1" style={{ color: 'var(--zen-color-primary, #006B3C)' }}>
                View my tickets →
              </div>
            </Link>
          </div>

          {/* Card 4: User Accounts (Admin Only) */}
          {showUserCounts && userCounts && (
            <div className={topCardColClass}>
              <div
                className="card shadow-sm border-0 p-3 h-100"
                style={{
                  borderRadius: 'var(--zen-radius-lg, 12px)',
                  backgroundColor: 'var(--zen-bg-surface, #fff)',
                  borderLeft: '4px solid #3b82f6',
                }}
              >
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <span className="text-muted small fw-semibold">User Accounts (Admin Only)</span>
                  <span className="badge" style={{ backgroundColor: '#dbeafe', color: '#1d4ed8' }}>
                    Users
                  </span>
                </div>
                <div className="d-flex align-items-center gap-3 mt-1">
                  <div>
                    <div className="h3 mb-0 fw-bold text-success">{userCounts.active}</div>
                    <div className="text-muted small">Active</div>
                  </div>
                  <div className="vr my-1"></div>
                  <div>
                    <div className="h3 mb-0 fw-bold" style={{ color: '#475569' }}>{userCounts.inactive}</div>
                    <div className="text-muted small">Inactive</div>
                  </div>
                </div>
                <div className="mt-auto pt-2">
                  <Link to="/admin/users" className="small fw-semibold text-decoration-none" style={{ color: '#1d4ed8' }}>
                    Manage users →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Buckets Row: By Status & By IT Priority */}
      {metrics && (
        <div className="row g-4 mb-4">
          {/* By Status (5 buckets) */}
          <div className="col-12 col-lg-6">
            <div
              className="card shadow-sm border-0 p-4 h-100"
              style={{ borderRadius: 'var(--zen-radius-lg, 12px)', backgroundColor: 'var(--zen-bg-surface, #fff)' }}
            >
              <h2 className="h5 mb-3 fw-bold" style={{ color: 'var(--zen-color-text, #212529)' }}>
                By Status
              </h2>
              <div className="d-flex flex-wrap gap-2">
                {STATUS_ORDER.map((statusKey) => {
                  const val = metrics.statusCounts.values[statusKey] ?? 0;
                  const href = `${metrics.statusCounts.drillDownBase}${statusKey}`;
                  return (
                    <Link
                      key={statusKey}
                      to={href}
                      className="btn btn-outline-secondary d-flex align-items-center justify-content-between p-2 flex-grow-1"
                      style={{
                        borderRadius: 'var(--zen-radius-md, 8px)',
                        minWidth: '130px',
                        borderColor: '#e5e7eb',
                        backgroundColor: '#fafafa',
                      }}
                      aria-label={`${statusKey} ${val}`}
                    >
                      <span className="small fw-semibold text-dark">{statusKey}</span>
                      <span className="badge rounded-pill bg-white text-dark border ms-2">
                        {val}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* By IT Priority (5 buckets incl. UNSET) */}
          <div className="col-12 col-lg-6">
            <div
              className="card shadow-sm border-0 p-4 h-100"
              style={{ borderRadius: 'var(--zen-radius-lg, 12px)', backgroundColor: 'var(--zen-bg-surface, #fff)' }}
            >
              <h2 className="h5 mb-3 fw-bold" style={{ color: 'var(--zen-color-text, #212529)' }}>
                By IT Priority
              </h2>
              <div className="d-flex flex-wrap gap-2">
                {PRIORITY_ORDER.map((priorityKey) => {
                  const val = metrics.priorityCounts.values[priorityKey] ?? 0;
                  const href = `${metrics.priorityCounts.drillDownBase}${priorityKey}`;
                  return (
                    <Link
                      key={priorityKey}
                      to={href}
                      className="btn btn-outline-secondary d-flex align-items-center justify-content-between p-2 flex-grow-1"
                      style={{
                        borderRadius: 'var(--zen-radius-md, 8px)',
                        minWidth: '130px',
                        borderColor: '#e5e7eb',
                        backgroundColor: '#fafafa',
                      }}
                      aria-label={`${priorityKey} ${val}`}
                    >
                      <span className="small fw-semibold text-dark">{priorityKey}</span>
                      <span className="badge rounded-pill bg-white text-dark border ms-2">
                        {val}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lower Row: Recent Updates (60%) & Quick Actions (40%) */}
      <div className="row g-4 mb-4">
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
              <div className="table-responsive" tabIndex={0} aria-label="Recently updated tickets for staff">
                <table className="table table-hover align-middle mb-0">
                  <caption className="visually-hidden">Recently updated tickets for staff</caption>
                  <thead>
                    <tr className="text-muted small">
                      <th scope="col" style={{ width: 110 }}>Ticket ID</th>
                      <th scope="col">Summary</th>
                      <th scope="col" style={{ width: 120 }}>Status</th>
                      <th scope="col" style={{ width: 100 }}>IT Priority</th>
                      <th scope="col" style={{ width: 140 }}>Last Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentlyUpdated.map((ticket) => (
                      <tr key={ticket.id}>
                        <td>
                          <Link
                            to={`/staff/tickets/${ticket.id}`}
                            className="fw-semibold small text-decoration-none"
                            style={{ color: 'var(--zen-color-primary, #006B3C)' }}
                          >
                            {ticket.ticketNumber}
                          </Link>
                        </td>
                        <td className="fw-medium text-truncate" style={{ maxWidth: 220 }} title={ticket.title}>
                          {ticket.title}
                        </td>
                        <td>
                          <StatusBadge status={ticket.status} />
                        </td>
                        <td>
                          {ticket.priority ? (
                            <PriorityBadge priority={ticket.priority as any} />
                          ) : (
                            <span className="badge bg-light text-muted border">UNSET</span>
                          )}
                        </td>
                        <td className="text-muted small">
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
                to="/staff/tickets"
                className="btn text-white py-2 text-start d-flex align-items-center gap-2"
                style={{
                  backgroundColor: 'var(--zen-color-primary, #006B3C)',
                  borderRadius: 'var(--zen-radius-md, 8px)',
                  fontWeight: 600,
                }}
              >
                <span>🎫</span>
                <span>Ticket Queue</span>
              </Link>
              <Link
                to="/staff/tickets?statusGroup=open&assignee=me"
                className="btn btn-outline-secondary py-2 text-start d-flex align-items-center gap-2"
                style={{
                  borderRadius: 'var(--zen-radius-md, 8px)',
                  fontWeight: 600,
                  borderColor: '#dee2e6',
                  color: 'var(--zen-color-text, #212529)',
                }}
              >
                <span>👤</span>
                <span>My Queue</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Current-User Actions Taken Section */}
      <div className="row g-4">
        <div className="col-12">
          <div
            className="card shadow-sm border-0 p-4"
            style={{ borderRadius: 'var(--zen-radius-lg, 12px)', backgroundColor: 'var(--zen-bg-surface, #fff)' }}
          >
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h2 className="h5 mb-0 fw-bold" style={{ color: 'var(--zen-color-text, #212529)' }}>
                My Recent Actions Taken
              </h2>
              <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#1e293b', border: '1px solid #cbd5e1' }}>
                Latest 5
              </span>
            </div>

            {myActionsTaken.length === 0 ? (
              <p className="text-muted small my-3">No actions recorded by you yet</p>
            ) : (
              <div className="table-responsive" tabIndex={0} aria-label="Recent actions taken by current user">
                <table className="table table-hover align-middle mb-0">
                  <caption className="visually-hidden">Recent actions taken by current user</caption>
                  <thead>
                    <tr className="text-muted small">
                      <th scope="col" style={{ width: 110 }}>Ticket ID</th>
                      <th scope="col">Action Taken</th>
                      <th scope="col">Result</th>
                      <th scope="col" style={{ width: 140 }}>Follow-Up</th>
                      <th scope="col" style={{ width: 160 }}>Recorded At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myActionsTaken.map((act) => (
                      <tr key={act.id}>
                        <td>
                          <Link
                            to={`/staff/tickets/${act.ticketId}`}
                            className="fw-semibold small text-decoration-none"
                            style={{ color: 'var(--zen-color-primary, #006B3C)' }}
                          >
                            {act.ticketNumber}
                          </Link>
                        </td>
                        <td className="fw-medium text-truncate" style={{ maxWidth: 260 }} title={act.action}>
                          {act.action}
                        </td>
                        <td className="text-muted small text-truncate" style={{ maxWidth: 240 }} title={act.result}>
                          {act.result}
                        </td>
                        <td>
                          {act.followUpRequired ? (
                            <span
                              className="badge"
                              style={{ backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' }}
                            >
                              Follow-up Required
                            </span>
                          ) : (
                            <span
                              className="badge"
                              style={{ backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' }}
                            >
                              None
                            </span>
                          )}
                        </td>
                        <td className="text-muted small">
                          {formatDate(act.actionAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StaffDashboardPage;
