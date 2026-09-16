import { useState, useEffect, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function LoginPage() {
  const { login, user, isLoading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    <div className="container py-5 d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <div className="card shadow-sm" style={{ width: '100%', maxWidth: '400px', borderRadius: 8 }}>
        <div className="card-body p-4">
          <h1 className="h4 text-center mb-1">
            TokTickIT <span style={{ color: "#006B3C" }}>Service Desk</span>
          </h1>
          <h2 className="h6 text-center text-muted mb-4">Sign In</h2>
          
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
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="password" className="form-label fw-semibold">Password</label>
              <input
                id="password"
                type="password"
                className="form-control"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="alert alert-danger p-2 mb-3" role="alert" style={{ fontSize: '0.9rem' }}>
                {error}
              </div>
            )}
            
            <button 
              type="submit" 
              className="btn text-white w-100 fw-semibold" 
              style={{ background: "#006B3C", borderRadius: 8 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
