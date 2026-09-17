import { useState, FormEvent } from 'react'

interface CreateUserForm {
  name: string
  email: string
  role: string
  isActive: boolean
  password: string
}

export function CreateUserModal({
  onClose, onCreated,
}: {
  onClose: () => void
  onCreated: () => void
}) {
  const [form, setForm] = useState<CreateUserForm>({
    name: '', email: '', role: 'REQUESTER', isActive: true, password: '',
  })
  const [errors, setErrors]       = useState<Partial<Record<keyof CreateUserForm, string>>>({})
  const [apiError, setApiError]   = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function validate(): boolean {
    const newErrors: typeof errors = {}
    if (!form.name.trim())          newErrors.name = 'Name is required.'
    if (!form.email.trim())         newErrors.email = 'Email is required.'
    if (!form.role)                 newErrors.role = 'Role is required.'
    if (form.password.length < 8)   newErrors.password = 'Password must be at least 8 characters.'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setApiError(null)
    setIsSubmitting(true)

    try {
      const res = await fetch('/admin/users', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
          isActive: form.isActive,
          password: form.password,
        }),
      })

      if (res.status === 409) {
        const err = await res.json()
        setErrors(prev => ({ ...prev, email: err.error }))
        return
      }
      if (res.status === 422) {
        const err = await res.json()
        setApiError(err.error)
        return
      }
      if (!res.ok) {
        setApiError('Failed to create user. Please try again.')
        return
      }

      onCreated()
    } catch {
      setApiError('Unable to create user. Please check your connection.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Create User">
      <div className="modal-panel">
        <div className="modal-header">
          <h2>Create User</h2>
          <button onClick={onClose} aria-label="Close" className="modal-close-btn">✕</button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label htmlFor="create-name">Name *</label>
            <input
              id="create-name"
              type="text"
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              disabled={isSubmitting}
            />
            {errors.name && <span className="field-error" role="alert">{errors.name}</span>}
          </div>

          <div className="form-field">
            <label htmlFor="create-email">Email Address *</label>
            <input
              id="create-email"
              type="email"
              value={form.email}
              onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
              disabled={isSubmitting}
              autoComplete="off"
            />
            {errors.email && <span className="field-error" role="alert">{errors.email}</span>}
          </div>

          <div className="form-field">
            <label htmlFor="create-role">Role *</label>
            <select
              id="create-role"
              value={form.role}
              onChange={e => setForm(prev => ({ ...prev, role: e.target.value }))}
              disabled={isSubmitting}
            >
              <option value="REQUESTER">Requester</option>
              <option value="IT_STAFF">IT Staff</option>
              <option value="ADMINISTRATOR">Administrator</option>
            </select>
            {errors.role && <span className="field-error" role="alert">{errors.role}</span>}
          </div>

          <div className="form-field form-field--checkbox">
            <label>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={e => setForm(prev => ({ ...prev, isActive: e.target.checked }))}
                disabled={isSubmitting}
              />
              Active (user can log in immediately)
            </label>
          </div>

          <div className="form-field">
            <label htmlFor="create-password">Initial Password *</label>
            <input
              id="create-password"
              type="password"
              value={form.password}
              onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
              disabled={isSubmitting}
              autoComplete="new-password"
            />
            <p className="field-hint">
              Minimum 8 characters. The user must change this password at first login.
            </p>
            {errors.password && <span className="field-error" role="alert">{errors.password}</span>}
          </div>

          {apiError && (
            <div className="api-error" role="alert">{apiError}</div>
          )}

          <div className="modal-footer">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? 'Creating…' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
