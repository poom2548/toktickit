import { useState, useEffect, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function LoginPage() {
  const { login, user, isLoading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForgotHelp, setShowForgotHelp] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await login(email, password)
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    if (!isLoading && user) {
      if (user.requiresPasswordChange) {
        navigate('/change-password')
      } else {
        switch (user.role) {
          case 'REQUESTER': navigate('/tickets'); break;
          case 'IT_STAFF': navigate('/staff/tickets'); break;
          case 'ADMINISTRATOR': navigate('/admin/users'); break;
          default: navigate('/login'); break;
        }
      }
    }
  }, [user, navigate, isLoading])

  if (isLoading) return <div>Loading…</div>

  return (
    <div style={{ backgroundColor: 'var(--zen-bg-page, #F5F7F6)', minHeight: '100vh' }} className="d-flex justify-content-center align-items-center py-5">
      <div className="card shadow-sm" style={{ width: '100%', maxWidth: '420px', borderRadius: 'var(--zen-radius-lg, 12px)', border: 'none' }}>
        <div className="card-body p-4">
          {/* Branding */}
          <div className="text-center mb-4">
            <span style={{ backgroundColor: '#EAF6EF', color: '#006B3C', borderRadius: '8px', padding: '4px 12px', fontSize: '0.9rem', fontWeight: 700, display: 'inline-block', marginBottom: '12px' }}>TT</span>
            <h1 className="h4 mb-1">
              TokTickIT <span style={{ color: 'var(--zen-color-primary, #006B3C)' }}>Service Desk</span>
            </h1>
            <h2 className="h6 text-muted mb-0">Sign in to your account</h2>
          </div>
          
          {/* Error alert */}
          {error && (
            <div className="alert d-flex align-items-center gap-2 py-2 px-3 mb-3" role="alert" style={{ backgroundColor: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb', borderRadius: 'var(--zen-radius-md, 8px)', fontSize: '0.9rem' }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label htmlFor="email" className="form-label fw-semibold">Email address</label>
              <input
                id="email"
                type="email"
                className="form-control"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
                autoComplete="email"
                placeholder="you@toktickit.com"
                style={{ borderRadius: 'var(--zen-radius-md, 8px)' }}
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="password" className="form-label fw-semibold">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                  autoComplete="current-password"
                  style={{ borderRadius: 'var(--zen-radius-md, 8px)', paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    fontSize: '1.1rem',
                    color: '#6c757d',
                  }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            
            <button 
              type="submit" 
              className="btn w-100 text-white fw-semibold" 
              disabled={isSubmitting}
              style={{
                backgroundColor: 'var(--zen-color-primary, #006B3C)',
                border: 'none',
                borderRadius: 'var(--zen-radius-md, 8px)',
                padding: '0.6rem',
              }}
            >
              {isSubmitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Forgot password */}
          <div className="text-center mt-3">
            <button
              type="button"
              onClick={() => setShowForgotHelp(!showForgotHelp)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--zen-color-primary, #006B3C)',
                cursor: 'pointer',
                fontSize: '0.9rem',
                textDecoration: 'none',
              }}
            >
              Forgot your password?
            </button>
          </div>

          {showForgotHelp && (
            <div className="mt-2 p-3 text-center" role="alert" style={{ backgroundColor: '#EAF6EF', borderRadius: 'var(--zen-radius-md, 8px)', fontSize: '0.85rem', color: 'var(--zen-color-text-secondary, #495057)' }}>
              Please contact your system administrator to reset your password.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
