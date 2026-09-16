import { apiFetch } from "../utils/api";
import { useState, FormEvent, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function ChangePasswordPage() {
  const { user, refreshUser, logout } = useAuth()
  const navigate = useNavigate()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [clientError, setClientError] = useState<string | null>(null)
  const [serverErrors, setServerErrors] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      navigate('/login')
    } else if (!user.requiresPasswordChange) {
      navigate(getRoleHomePath(user.role))
    }
  }, [user, navigate])

  if (!user || !user.requiresPasswordChange) return null

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setClientError(null)
    setServerErrors([])

    if (newPassword !== confirmPassword) {
      setClientError('Passwords do not match.')
      return
    }

    setIsLoading(true)
    try {
      const res = await apiFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      })

      if (res.ok) {
        await refreshUser() // updates requiresPasswordChange to false
      } else {
        const data = await res.json()
        setServerErrors(data.details || [data.error])
      }
    } catch {
      setServerErrors(['An unexpected error occurred. Please try again.'])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container py-5 d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <div className="card shadow-sm" style={{ width: '100%', maxWidth: '450px', borderRadius: 8 }}>
        <div className="card-body p-4">
          <h1 className="h4 text-center mb-3">Change Your Password</h1>
          <p className="text-muted text-center mb-4" style={{ fontSize: '0.9rem' }}>
            You must set a new password before continuing.
          </p>
          
          <div className="mb-4 p-3 bg-light rounded text-muted" style={{ fontSize: '0.85rem' }}>
            <strong className="d-block mb-1">Password rules:</strong>
            <ul className="mb-0 ps-3">
              <li>At least 8 characters</li>
              <li>At least one uppercase letter (A-Z)</li>
              <li>At least one lowercase letter (a-z)</li>
              <li>At least one digit (0-9)</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label htmlFor="newPassword" className="form-label fw-semibold">New password</label>
              <input
                id="newPassword"
                type="password"
                className="form-control"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="new-password"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="confirmPassword" className="form-label fw-semibold">Confirm new password</label>
              <input
                id="confirmPassword"
                type="password"
                className={`form-control ${clientError ? 'is-invalid' : ''}`}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="new-password"
              />
              {clientError && (
                <div className="invalid-feedback" role="alert">{clientError}</div>
              )}
            </div>

            {serverErrors.length > 0 && (
              <div className="alert alert-danger p-2 mb-3" role="alert" style={{ fontSize: '0.9rem' }}>
                <ul className="mb-0 ps-3">
                  {serverErrors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            )}
            
            <button 
              type="submit" 
              className="btn text-white w-100 fw-semibold mb-3" 
              style={{ background: "#006B3C", borderRadius: 8 }}
              disabled={isLoading}
            >
              {isLoading ? 'Saving…' : 'Set New Password'}
            </button>
          </form>

          <div className="text-center">
            <button 
              onClick={() => { logout(); navigate('/login') }} 
              className="btn btn-link text-decoration-none text-muted p-0"
              style={{ fontSize: '0.9rem' }}
            >
              Log out instead
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function getRoleHomePath(role: string) {
  if (role === 'REQUESTER') return '/tickets'
  if (role === 'IT_STAFF') return '/staff/tickets'
  if (role === 'ADMINISTRATOR') return '/admin/users'
  return '/login'
}
