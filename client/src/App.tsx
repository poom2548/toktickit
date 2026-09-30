import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/guards/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { ChangePasswordPage } from './pages/ChangePasswordPage'
import { ForbiddenPage } from './pages/ForbiddenPage'
import { AppShell } from './components/AppShell'
import RequesterApp from './RequesterApp'
import { StaffTicketQueuePage } from './pages/staff/StaffTicketQueuePage'
import { StaffTicketDetailPage } from './pages/staff/StaffTicketDetailPage'
import { UserManagementPage } from './pages/admin/UserManagementPage'

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
                <StaffTicketQueuePage />
              </AppShell>
            </ProtectedRoute>
          } />

          <Route path="/staff/tickets/:id" element={
            <ProtectedRoute allowedRoles={['IT_STAFF', 'ADMINISTRATOR']}>
              <AppShell>
                <StaffTicketDetailPage />
              </AppShell>
            </ProtectedRoute>
          } />

          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={['ADMINISTRATOR']}>
              <AppShell>
                <UserManagementPage />
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
