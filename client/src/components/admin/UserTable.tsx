import { User } from '../../pages/admin/UserManagementPage'

export function UserTable({
  users, currentAdminId, onEdit,
}: {
  users: User[]
  currentAdminId: string
  onEdit: (user: User) => void
}) {
  return (
    <table className="user-table" role="grid" data-testid="user-table">
      <thead>
        <tr>
          <th scope="col">Name</th>
          <th scope="col">Email</th>
          <th scope="col">Role</th>
          <th scope="col">Status</th>
          <th scope="col">Actions</th>
        </tr>
      </thead>
      <tbody>
        {users.map(user => (
          <tr key={user.id} data-testid={`user-row-${user.id}`}>
            <td>{user.name}</td>
            <td>{user.email}</td>
            <td><RoleBadge role={user.role} /></td>
            <td>
              <span className={`status-badge ${user.isActive ? 'badge--active' : 'badge--inactive'}`}>
                {user.isActive ? 'Active' : 'Inactive'}
              </span>
            </td>
            <td>
              <button
                onClick={() => onEdit(user)}
                className="edit-btn"
                aria-label={`Edit ${user.name}`}
                data-testid={`edit-user-btn-${user.id}`}
              >
                Edit
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// Role badge with Zen Green color variants
function RoleBadge({ role }: { role: string }) {
  const classes: Record<string, string> = {
    REQUESTER:     'role-badge role-badge--requester',
    IT_STAFF:      'role-badge role-badge--it-staff',
    ADMINISTRATOR: 'role-badge role-badge--admin',
  }
  const labels: Record<string, string> = {
    REQUESTER: 'Requester', IT_STAFF: 'IT Staff', ADMINISTRATOR: 'Administrator',
  }
  return <span className={classes[role] ?? 'role-badge'}>{labels[role] ?? role}</span>
}
