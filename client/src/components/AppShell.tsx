import { useAuth } from '../contexts/AuthContext'
import { useNavigate, Link, useLocation } from 'react-router-dom'

const ROLE_LABELS: Record<string, string> = {
  REQUESTER: 'Requester',
  IT_STAFF: 'IT Staff',
  ADMINISTRATOR: 'Administrator',
}

const ROLE_BADGE_STYLES: Record<string, React.CSSProperties> = {
  REQUESTER: { backgroundColor: '#e2e3e5', color: '#383d41' },
  IT_STAFF: { backgroundColor: '#cce5ff', color: '#004085' },
  ADMINISTRATOR: { backgroundColor: '#d1ecf1', color: '#0c5460' },
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isActive = (path: string) => location.pathname.startsWith(path)

  const navLinkStyle = (path: string): React.CSSProperties => ({
    color: isActive(path) ? '#ffffff' : 'rgba(255,255,255,0.75)',
    textDecoration: 'none',
    fontWeight: 600,
    borderBottom: isActive(path) ? '2px solid #ffffff' : '2px solid transparent',
    paddingBottom: '2px',
    transition: 'color 0.15s, border-color 0.15s',
  })

  return (
    <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: 'var(--zen-bg-page, #F5F7F6)' }}>
      <header style={{ backgroundColor: 'var(--zen-color-primary, #006B3C)' }} className="sticky-top shadow-sm">
        <div className="container-fluid px-4 py-3 d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-4">
            <span className="h5 mb-0 fw-bold text-white d-flex align-items-center gap-2">
              <span style={{ backgroundColor: '#EAF6EF', color: '#006B3C', borderRadius: '6px', padding: '2px 8px', fontSize: '0.85rem', fontWeight: 700 }}>TT</span>
              TokTickIT <span style={{ fontWeight: 400, opacity: 0.9 }}>Service Desk</span>
            </span>
            
            <nav className="d-none d-md-flex gap-3">
              {user?.role === 'REQUESTER' && (
                <Link to="/tickets" style={navLinkStyle('/tickets')}>My Tickets</Link>
              )}
              {(user?.role === 'IT_STAFF' || user?.role === 'ADMINISTRATOR') && (
                <Link to="/staff/tickets" style={navLinkStyle('/staff/tickets')}>🎫 Ticket Queue</Link>
              )}
              {user?.role === 'ADMINISTRATOR' && (
                <Link to="/admin/users" style={navLinkStyle('/admin/users')}>👥 User Management</Link>
              )}
            </nav>
          </div>

          <div className="d-flex align-items-center gap-3">
            <span className="d-none d-sm-inline-flex align-items-center gap-2" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem' }}>
              {user?.name}
              <span
                className="ms-1"
                style={{
                  display: 'inline-block',
                  padding: '0.2em 0.55em',
                  fontSize: '0.78em',
                  fontWeight: 600,
                  borderRadius: '0.375rem',
                  ...(ROLE_BADGE_STYLES[user?.role ?? ''] || {}),
                }}
              >
                {ROLE_LABELS[user?.role ?? '']}
              </span>
            </span>
            <button 
              onClick={handleLogout} 
              className="btn btn-sm"
              style={{
                borderRadius: 'var(--zen-radius-md, 8px)',
                border: '1.5px solid rgba(255,255,255,0.7)',
                color: '#ffffff',
                backgroundColor: 'transparent',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}
            >
              Log out
            </button>
          </div>
        </div>
        {/* Mobile Nav */}
        <div className="container-fluid px-4 py-2 d-md-none" style={{ borderTop: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'var(--zen-color-primary-dark, #075231)' }}>
          <nav className="d-flex gap-3">
            {user?.role === 'REQUESTER' && (
              <Link to="/tickets" style={navLinkStyle('/tickets')}>My Tickets</Link>
            )}
            {(user?.role === 'IT_STAFF' || user?.role === 'ADMINISTRATOR') && (
              <Link to="/staff/tickets" style={navLinkStyle('/staff/tickets')}>Queue</Link>
            )}
            {user?.role === 'ADMINISTRATOR' && (
              <Link to="/admin/users" style={navLinkStyle('/admin/users')}>Users</Link>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-grow-1">
        {children}
      </main>
    </div>
  )
}
