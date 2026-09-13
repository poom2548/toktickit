import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: Array<'REQUESTER' | 'IT_STAFF' | 'ADMINISTRATOR'>
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()

  if (isLoading) return <div>Loading...</div> // or a Zen Green skeleton

  if (!user) return <Navigate to="/login" replace />

  // Intercept first-login users before any other screen
  if (user.requiresPasswordChange) return <Navigate to="/change-password" replace />

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/forbidden" replace />
  }

  return <>{children}</>
}
