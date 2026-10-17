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
      return new Date(iso).toLocaleDateString('th-TH', {
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
          <h1 className="h4 text-danger mb-3">403 คุณไม่มีสิทธิ์เข้าถึงหน้านี้ (Forbidden)</h1>
          <p className="text-muted mb-4">
            หน้านี้สงวนไว้สำหรับผู้ร้องขอ (Requester) เท่านั้น เจ้าหน้าที่ไอทีหรือผู้ดูแลระบบกรุณาใช้แดชบอร์ดเจ้าหน้าที่
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
              ไปยังแดชบอร์ดเจ้าหน้าที่ (Staff Dashboard)
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
            <strong>เกิดข้อผิดพลาดในการโหลดแดชบอร์ด: </strong>
            <span>{error.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้'}</span>
          </div>
          <button
            type="button"
            className="btn btn-outline-danger btn-sm"
            onClick={() => fetchDashboard(false)}
            style={{ borderRadius: 'var(--zen-radius-md, 8px)', fontWeight: 600 }}
          >
            ลองใหม่ (Retry)
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
            ยินดีต้อนรับกลับ, {user?.name || 'ผู้ร้องขอ'}
          </h1>
          <p className="text-muted small mb-0">
            ภาพรวมตั๋วแจ้งปัญหาและการดำเนินการที่เกี่ยวข้องกับคุณ
          </p>
        </div>
        <div>
          <button
            type="button"
            className="btn btn-sm d-inline-flex align-items-center gap-2"
            onClick={() => fetchDashboard(true)}
            disabled={refreshing}
            aria-label="รีเฟรชข้อมูลแดชบอร์ด"
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
            {refreshing ? 'กำลังรีเฟรช...' : 'รีเฟรช (Refresh)'}
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
          <h2 className="h5 text-muted mb-2">ยังไม่มีข้อมูลตั๋ว (No tickets found)</h2>
          <p className="text-muted small mb-3">
            คุณยังไม่มีตั๋วแจ้งปัญหาในระบบ หรือยังไม่มีตั๋วที่อยู่ในกระบวนการ
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
              ➕ สร้างตั๋วใหม่ทันที
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
              aria-label={`ตั๋วที่ยังเปิดอยู่ ${metrics.openTickets.value} รายการ`}
            >
              <div className="d-flex justify-content-between align-items-start mb-2">
                <span className="text-muted small fw-semibold">ตั๋วที่ยังเปิดอยู่ (My Open Tickets)</span>
                <span className="badge" style={{ backgroundColor: 'var(--zen-color-primary-light, #EAF6EF)', color: 'var(--zen-color-primary, #006B3C)' }}>
                  Open
                </span>
              </div>
              <div className="h2 mb-2 fw-bold" style={{ color: 'var(--zen-color-primary, #006B3C)' }}>
                {metrics.openTickets.value}
              </div>
              <div className="mt-auto small fw-semibold d-flex align-items-center gap-1" style={{ color: 'var(--zen-color-primary, #006B3C)' }}>
                ดูทั้งหมด →
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
              aria-label={`รอฉันดำเนินการ ${metrics.waitingForMe.value} รายการ`}
            >
              <div className="d-flex justify-content-between align-items-start mb-2">
                <span className="text-muted small fw-semibold">รอฉันดำเนินการ (Waiting for Me)</span>
                <span className="badge" style={{ backgroundColor: '#fffbeb', color: '#b45309' }}>
                  Action Needed
                </span>
              </div>
              <div className="h2 mb-2 fw-bold" style={{ color: '#b45309' }}>
                {metrics.waitingForMe.value}
              </div>
              <div className="mt-auto small fw-semibold d-flex align-items-center gap-1" style={{ color: 'var(--zen-color-primary, #006B3C)' }}>
                ดูทั้งหมด →
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
              aria-label={`แก้ปัญหาแล้วล่าสุด ${metrics.recentlyResolved.value} รายการ`}
            >
              <div className="d-flex justify-content-between align-items-start mb-2">
                <span className="text-muted small fw-semibold">แก้ปัญหาแล้วล่าสุด (Recently Resolved)</span>
                <span className="badge" style={{ backgroundColor: '#ecfdf5', color: '#047857' }}>
                  7 วันล่าสุด
                </span>
              </div>
              <div className="h2 mb-2 fw-bold" style={{ color: 'var(--zen-color-secondary, #0B7A46)' }}>
                {metrics.recentlyResolved.value}
              </div>
              <div className="mt-auto small fw-semibold d-flex align-items-center gap-1" style={{ color: 'var(--zen-color-primary, #006B3C)' }}>
                ดูทั้งหมด →
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
                อัปเดตล่าสุด (Recent Updates)
              </h2>
              <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#1e293b', border: '1px solid #cbd5e1' }}>5 รายการล่าสุด</span>
            </div>

            {recentlyUpdated.length === 0 ? (
              <p className="text-muted small my-3">ไม่มีรายการล่าสุด</p>
            ) : (
              <div className="table-responsive" tabIndex={0} aria-label="รายการตั๋วที่ได้รับการอัปเดตล่าสุด">
                <table className="table table-hover align-middle mb-0">
                  <caption className="visually-hidden">รายการตั๋วที่ได้รับการอัปเดตล่าสุด</caption>
                  <thead>
                    <tr className="text-muted small">
                      <th scope="col" style={{ width: 110 }}>หมายเลขตั๋ว</th>
                      <th scope="col">หัวข้อปัญหา</th>
                      <th scope="col" style={{ width: 120 }}>สถานะ</th>
                      <th scope="col" style={{ width: 100 }}>ความสำคัญ</th>
                      <th scope="col" style={{ width: 140 }}>อัปเดตล่าสุด</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentlyUpdated.map((ticket) => (
                      <tr key={ticket.id}>
                        <td className="fw-semibold small" style={{ color: 'var(--zen-color-primary, #006B3C)' }}>
                          {ticket.ticketNumber}
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
                            <span className="text-muted small">—</span>
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
              การดำเนินการด่วน (Quick Actions)
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
                <span>สร้างตั๋วใหม่ (New Ticket)</span>
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
                <span>ดูตั๋วทั้งหมดของฉัน (My Tickets)</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RequesterDashboardPage;
