import { User } from '../../pages/admin/UserManagementPage'
import { RoleBadge } from '../shared/RoleBadge'

export function UserTable({
  users, currentAdminId, onEdit,
}: {
  users: User[]
  currentAdminId: string
  onEdit: (user: User) => void
}) {
  return (
    <div className="table-responsive">
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
                  className="btn-secondary btn-sm"
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
    </div>
  )
}
