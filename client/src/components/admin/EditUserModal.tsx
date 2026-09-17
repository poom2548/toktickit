import { useState, FormEvent } from 'react'
import { User } from '../../pages/admin/UserManagementPage'

export function EditUserModal({
  user, currentAdminId, onClose, onUpdated,
}: {
  user: User
  currentAdminId: string
  onClose: () => void
  onUpdated: () => void
}) {
  const isSelf = user.id === currentAdminId

  // Edit form state — pre-populated with current user data (AC-ADMIN-15)
  const [form, setForm] = useState({
    name:     user.name,
    email:    user.email,
    role:     user.role,
    isActive: user.isActive,
  })
  const [editErrors, setEditErrors]   = useState<Partial<typeof form & { api: string }>>({})
  const [editSaving, setEditSaving]   = useState(false)

  // Set New Password section state
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [newPassword, setNewPassword]           = useState('')
  const [passwordError, setPasswordError]       = useState<string | null>(null)
  const [passwordSaving, setPasswordSaving]     = useState(false)
  const [passwordSuccess, setPasswordSuccess]   = useState(false)

  async function handleEditSubmit(e: FormEvent) {
    e.preventDefault()
    const newErrors: typeof editErrors = {}
    if (!form.name.trim())  newErrors.name = 'Name is required.'
    if (!form.email.trim()) newErrors.email = 'Email is required.'
    setEditErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setEditSaving(true)
    setEditErrors({})

    try {
      const res = await fetch(`/admin/users/${user.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:     form.name.trim(),
          email:    form.email.trim(),
          role:     form.role,
          isActive: form.isActive,
        }),
      })

      if (res.status === 403) {
        const err = await res.json()
        setEditErrors({ api: err.error })  // self-deactivation message
        return
      }
      if (res.status === 409) {
        const err = await res.json()
        setEditErrors({ email: err.error })
        return
      }
      if (!res.ok) {
        const err = await res.json()
        setEditErrors({ api: err.error ?? 'Failed to update user.' })
        return
      }

      onUpdated()
    } catch {
      setEditErrors({ api: 'Unable to update user. Please check your connection.' })
    } finally {
      setEditSaving(false)
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault()
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters.')
      return
    }
    setPasswordError(null)
    setPasswordSaving(true)

    try {
      const res = await fetch(`/admin/users/${user.id}/password`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      })

      if (!res.ok) {
        const err = await res.json()
        setPasswordError(err.error ?? 'Failed to update password.')
        return
      }

      setPasswordSuccess(true)
      setNewPassword('')
    } catch {
      setPasswordError('Unable to update password. Please check your connection.')
    } finally {
      setPasswordSaving(false)
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={`Edit ${user.name}`}>
      <div className="modal-panel">
        <div className="modal-header">
          <h2>Edit User — {user.name}</h2>
          <button onClick={onClose} aria-label="Close" className="modal-close-btn">✕</button>
        </div>

        {/* Edit fields form */}
        <form onSubmit={handleEditSubmit} noValidate>
          <div className="form-field">
            <label htmlFor="edit-name">Name *</label>
            <input
              id="edit-name"
              type="text"
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              disabled={editSaving}
            />
            {editErrors.name && <span className="field-error" role="alert">{editErrors.name}</span>}
          </div>

          <div className="form-field">
            <label htmlFor="edit-email">Email Address *</label>
            <input
              id="edit-email"
              type="email"
              value={form.email}
              onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
              disabled={editSaving}
            />
            {editErrors.email && <span className="field-error" role="alert">{editErrors.email}</span>}
          </div>

          <div className="form-field">
            <label htmlFor="edit-role">Role *</label>
            <select
              id="edit-role"
              value={form.role}
              onChange={e => setForm(prev => ({ ...prev, role: e.target.value as any }))}
              disabled={editSaving}
            >
              <option value="REQUESTER">Requester</option>
              <option value="IT_STAFF">IT Staff</option>
              <option value="ADMINISTRATOR">Administrator</option>
            </select>
          </div>

          <div className="form-field form-field--checkbox">
            <label>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={e => setForm(prev => ({ ...prev, isActive: e.target.checked }))}
                disabled={editSaving || isSelf}   // Prevent self-deactivation via UI
              />
              Active
            </label>
            {isSelf && (
              <p className="field-hint">You cannot deactivate your own account.</p>
            )}
          </div>

          {editErrors.api && (
            <div className="api-error" role="alert">{editErrors.api}</div>
          )}

          <div className="modal-section-footer">
            <button type="button" onClick={onClose} disabled={editSaving} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={editSaving} className="btn-primary">
              {editSaving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Set New Password section — always visible in Edit modal (AC-ADMIN-15) */}
        <div className="password-reset-section">
          <h3>Set New Password</h3>
          <p className="section-hint">
            Resets the user's password and requires them to change it at next login.
          </p>

          {!showPasswordForm ? (
            <button
              type="button"
              onClick={() => setShowPasswordForm(true)}
              className="btn-secondary"
              data-testid="show-password-form-btn"
            >
              Set New Password…
            </button>
          ) : (
            <form onSubmit={handlePasswordSubmit} noValidate>
              <div className="form-field">
                <label htmlFor="new-password">New Initial Password</label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  disabled={passwordSaving}
                  autoComplete="new-password"
                />
                {passwordError && <span className="field-error" role="alert">{passwordError}</span>}
                {passwordSuccess && (
                  <span className="field-success" role="status">
                    Password updated. User must change it at next login.
                  </span>
                )}
              </div>
              <div className="password-form-actions">
                <button type="button" onClick={() => setShowPasswordForm(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={passwordSaving || newPassword.length < 8} className="btn-primary">
                  {passwordSaving ? 'Updating…' : 'Update Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
