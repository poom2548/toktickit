import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/guards/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { ChangePasswordPage } from './pages/ChangePasswordPage'
import { ForbiddenPage } from './pages/ForbiddenPage'
import { AppShell } from './components/AppShell'
import RequesterApp from './RequesterApp'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />
          
          <Route path="/tickets" element={
            <ProtectedRoute allowedRoles={['REQUESTER']}>
              <AppShell>
                <RequesterApp />
              </AppShell>
            </ProtectedRoute>
          } />

          <Route path="/staff/tickets" element={
            <ProtectedRoute allowedRoles={['IT_STAFF', 'ADMINISTRATOR']}>
              <AppShell>
                <div>IT Staff Ticket Queue (Issue 5)</div>
              </AppShell>
            </ProtectedRoute>
          } />

          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={['ADMINISTRATOR']}>
              <AppShell>
                <div>User Management (Issue 7)</div>
              </AppShell>
            </ProtectedRoute>
          } />

          <Route path="/forbidden" element={<ForbiddenPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
