import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { UserFilters } from '../../components/admin/UserFilters'
import { UserTable } from '../../components/admin/UserTable'
import { CreateUserModal } from '../../components/admin/CreateUserModal'
import { EditUserModal } from '../../components/admin/EditUserModal'

export interface User {
  id: string
  name: string
  email: string
  role: 'REQUESTER' | 'IT_STAFF' | 'ADMINISTRATOR'
  isActive: boolean
  requiresPasswordChange: boolean
}

type FetchState = 'loading' | 'success' | 'error'

export function UserManagementPage() {
  const { user: currentAdmin } = useAuth()

  const [users, setUsers]           = useState<User[]>([])
  const [fetchState, setFetchState] = useState<FetchState>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Filter state
  const [search, setSearch]         = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  // Modal state
  const [createOpen, setCreateOpen]   = useState(false)
  const [editTarget, setEditTarget]   = useState<User | null>(null)

  const fetchUsers = useCallback(async () => {
    setFetchState('loading')
    setErrorMessage(null)

    const params = new URLSearchParams()
    if (search.trim())  params.set('search', search.trim())
    if (roleFilter)     params.set('role', roleFilter)

    try {
      const res = await fetch(`/admin/users?${params.toString()}`, {
        credentials: 'include',
      })
      if (res.status === 401) { window.location.href = '/login'; return }
      if (res.status === 403) { setFetchState('error'); setErrorMessage('forbidden'); return }
      if (!res.ok) {
        setFetchState('error')
        setErrorMessage('Unable to load users. Please try again.')
        return
      }
      const data = await res.json()
      setUsers(data.users)
      setFetchState('success')
    } catch {
      setFetchState('error')
      setErrorMessage('Unable to load users. Please check your connection.')
    }
  }, [search, roleFilter])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  if (fetchState === 'loading') {
    return <div className="loading-skeleton" aria-busy="true" aria-label="Loading users…" />
  }
  if (fetchState === 'error' && errorMessage === 'forbidden') {
    return (
      <div className="forbidden-page">
        <h1>Access Denied</h1>
        <p>Only Administrators can access User Management.</p>
      </div>
    )
  }
  if (fetchState === 'error') {
    return (
      <div className="error-state" role="alert">
        <p>{errorMessage}</p>
        <button onClick={fetchUsers}>Retry</button>
      </div>
    )
  }

  return (
    <div className="user-management-page">
      <div className="page-header">
        <h1>User Management</h1>
        <button
          className="btn-primary"
          onClick={() => setCreateOpen(true)}
          data-testid="create-user-btn"
        >
          + Create User
        </button>
      </div>

      {/* Inline search + role filter */}
      <UserFilters
        search={search}
        roleFilter={roleFilter}
        onSearchChange={setSearch}
        onRoleChange={setRoleFilter}
      />

      {/* User table */}
      {users.length === 0 ? (
        <div className="empty-state">
          <p>{search || roleFilter ? 'No users match your search.' : 'No users in the system.'}</p>
        </div>
      ) : (
        <UserTable
          users={users}
          currentAdminId={currentAdmin!.id}
          onEdit={setEditTarget}
        />
      )}

      {/* Create User Modal */}
      {createOpen && (
        <CreateUserModal
          onClose={() => setCreateOpen(false)}
          onCreated={() => { setCreateOpen(false); fetchUsers() }}
        />
      )}

      {/* Edit User Modal */}
      {editTarget && (
        <EditUserModal
          user={editTarget}
          currentAdminId={currentAdmin!.id}
          onClose={() => setEditTarget(null)}
          onUpdated={() => { setEditTarget(null); fetchUsers() }}
        />
      )}
    </div>
  )
}
