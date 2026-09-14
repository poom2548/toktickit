import { useAuth } from '../contexts/AuthContext'
import { useNavigate, Link, useLocation } from 'react-router-dom'

const ROLE_LABELS: Record<string, string> = {
  REQUESTER: 'Requester',
  IT_STAFF: 'IT Staff',
  ADMINISTRATOR: 'Administrator',
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

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <header className="bg-white shadow-sm sticky-top">
        <div className="container-fluid px-4 py-3 d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-4">
            <span className="h5 mb-0 fw-bold">
              TokTickIT <span style={{ color: "#006B3C" }}>Service Desk</span>
            </span>
            
            <nav className="d-none d-md-flex gap-3">
              {user?.role === 'REQUESTER' && (
                <Link 
                  to="/tickets" 
                  className={`text-decoration-none fw-semibold ${isActive('/tickets') ? 'text-dark' : 'text-muted'}`}
                >
                  My Tickets
                </Link>
              )}
              {(user?.role === 'IT_STAFF' || user?.role === 'ADMINISTRATOR') && (
                <Link 
                  to="/staff/tickets" 
                  className={`text-decoration-none fw-semibold ${isActive('/staff/tickets') ? 'text-dark' : 'text-muted'}`}
                >
                  Ticket Queue
                </Link>
              )}
              {user?.role === 'ADMINISTRATOR' && (
                <Link 
                  to="/admin/users" 
                  className={`text-decoration-none fw-semibold ${isActive('/admin/users') ? 'text-dark' : 'text-muted'}`}
                >
                  User Management
                </Link>
              )}
            </nav>
          </div>

          <div className="d-flex align-items-center gap-3">
            <span className="text-muted d-none d-sm-inline" style={{ fontSize: '0.9rem' }}>
              {user?.name} <span className="badge bg-secondary ms-1">{ROLE_LABELS[user?.role ?? '']}</span>
            </span>
            <button 
              onClick={handleLogout} 
              className="btn btn-outline-secondary btn-sm"
              style={{ borderRadius: 8 }}
            >
              Log out
            </button>
          </div>
        </div>
        {/* Mobile Nav */}
        <div className="container-fluid px-4 py-2 border-top d-md-none bg-white">
          <nav className="d-flex gap-3">
            {user?.role === 'REQUESTER' && (
              <Link to="/tickets" className={`text-decoration-none fw-semibold ${isActive('/tickets') ? 'text-dark' : 'text-muted'}`}>My Tickets</Link>
            )}
            {(user?.role === 'IT_STAFF' || user?.role === 'ADMINISTRATOR') && (
              <Link to="/staff/tickets" className={`text-decoration-none fw-semibold ${isActive('/staff/tickets') ? 'text-dark' : 'text-muted'}`}>Ticket Queue</Link>
            )}
            {user?.role === 'ADMINISTRATOR' && (
              <Link to="/admin/users" className={`text-decoration-none fw-semibold ${isActive('/admin/users') ? 'text-dark' : 'text-muted'}`}>Users</Link>
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
