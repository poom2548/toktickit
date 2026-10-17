import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/guards/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { ChangePasswordPage } from './pages/ChangePasswordPage'
import { ForbiddenPage } from './pages/ForbiddenPage'
import { AppShell } from './components/AppShell'
import RequesterApp from './RequesterApp'
import MyTicketsPage from './MyTicketsPage'
import { RequesterDashboardPage } from './pages/requester/RequesterDashboardPage'
import { StaffDashboardPage } from './pages/staff/StaffDashboardPage'
import { StaffTicketQueuePage } from './pages/staff/StaffTicketQueuePage'
import { StaffTicketDetailPage } from './pages/staff/StaffTicketDetailPage'
import { UserManagementPage } from './pages/admin/UserManagementPage'

function MyTicketsStandalone() {
  const navigate = useNavigate()
  return (
    <div className="container py-4" style={{ maxWidth: 1000 }}>
      <MyTicketsPage
        onNewTicket={() => navigate('/tickets')}
        onViewTicket={(id) => navigate(`/tickets?id=${id}`)}
      />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['REQUESTER']}>
              <AppShell>
                <RequesterDashboardPage />
              </AppShell>
            </ProtectedRoute>
          } />

          <Route path="/my-tickets" element={
            <ProtectedRoute allowedRoles={['REQUESTER']}>
              <AppShell>
                <MyTicketsStandalone />
              </AppShell>
            </ProtectedRoute>
          } />

          <Route path="/tickets" element={
            <ProtectedRoute allowedRoles={['REQUESTER']}>
              <AppShell>
                <RequesterApp />
              </AppShell>
            </ProtectedRoute>
          } />

          <Route path="/staff/dashboard" element={
            <ProtectedRoute allowedRoles={['IT_STAFF', 'ADMINISTRATOR']}>
              <AppShell>
                <StaffDashboardPage />
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
