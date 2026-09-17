import { useState } from 'react'
import { StatusBadge } from '../shared/StatusBadge'
import { PriorityBadge } from '../shared/PriorityBadge'
import { useAuth } from '../../contexts/AuthContext'

import { TicketDetail } from '../../pages/staff/StaffTicketDetailPage'

interface OperationalSectionProps {
  ticket: TicketDetail
  onTicketUpdate: (updated: TicketDetail) => void
}

const STATUS_LABELS: Record<string, string> = {
  NEW: 'New', OPEN: 'Open', IN_PROGRESS: 'In Progress',
  WAITING_FOR_REQUESTER: 'Waiting for Requester',
  RESOLVED: 'Resolved', CLOSED: 'Closed', REOPENED: 'Reopened', CANCELLED: 'Cancelled',
}

const PERMITTED_TRANSITIONS: Record<string, string[]> = {
  NEW: ['OPEN', 'CANCELLED'],
  OPEN: ['IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'CANCELLED'],
  IN_PROGRESS: ['WAITING_FOR_REQUESTER', 'RESOLVED', 'CANCELLED'],
  WAITING_FOR_REQUESTER: ['IN_PROGRESS', 'RESOLVED', 'CANCELLED'],
  RESOLVED: ['CLOSED', 'REOPENED'],
  CLOSED: [],
  REOPENED: ['OPEN', 'IN_PROGRESS', 'CANCELLED'],
  CANCELLED: [],
}

export function OperationalSection({ ticket, onTicketUpdate }: OperationalSectionProps) {
  const [priority, setPriority]       = useState(ticket.itPriority ?? '')
  const [status, setStatus]           = useState(ticket.status)
  const [saving, setSaving]           = useState<'owner' | 'priority' | 'status' | null>(null)
  const [saveErrors, setSaveErrors]   = useState<{ owner?: string; priority?: string; status?: string }>({})
  const { user } = useAuth()
  const isStaff = user?.role === 'IT_STAFF' || user?.role === 'ADMINISTRATOR'

  async function patchTicket(endpoint: string, body: object, field: 'owner' | 'priority' | 'status') {
    setSaving(field)
    setSaveErrors(prev => ({ ...prev, [field]: undefined }))
    try {
      const res = await fetch(`/staff/tickets/${ticket.id}/${endpoint}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        const updated = await res.json()
        onTicketUpdate({ ...ticket, ...updated })
        if (field === 'priority') setPriority(updated.itPriority ?? '')
        if (field === 'status') setStatus(updated.status)
      } else {
        const err = await res.json()
        setSaveErrors(prev => ({ ...prev, [field]: err.error ?? 'Failed to save.' }))
      }
    } catch {
      setSaveErrors(prev => ({ ...prev, [field]: 'An unexpected error occurred.' }))
    } finally {
      setSaving(null)
    }
  }

  const permittedNextStatuses = PERMITTED_TRANSITIONS[ticket.status] ?? []

  return (
    <section className="operational-section">
      <h2>Ticket Operations</h2>

      <div className="field-row">
        <dt>Current Status</dt>
        <dd><StatusBadge status={ticket.status} /></dd>
      </div>

      <div className="field-group">
        <label htmlFor="owner-select">Ticket Owner</label>
        <div className="owner-input-row">
          <span className="current-owner">
            {ticket.owner ? ticket.owner.name : <em>Unassigned</em>}
          </span>
          {isStaff && (
            <button
              onClick={() => patchTicket('owner', { ownerId: ticket.owner ? null : user?.id }, 'owner')}
              disabled={saving === 'owner'}
              className="claim-btn"
            >
              {saving === 'owner' ? 'Saving…' : ticket.owner ? 'Unassign' : 'Claim (Assign to me)'}
            </button>
          )}
        </div>
        {saveErrors.owner && <span className="field-error" role="alert">{saveErrors.owner}</span>}
      </div>

      <div className="field-group">
        <label htmlFor="it-priority-select">IT Priority</label>
        {isStaff ? (
          <>
            <select
              id="it-priority-select"
              value={priority}
              onChange={e => setPriority(e.target.value)}
              disabled={saving === 'priority'}
            >
              <option value="">— Not set —</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
            <button
              onClick={() => patchTicket('priority', { itPriority: priority || null }, 'priority')}
              disabled={saving === 'priority'}
              className="save-btn"
            >
              {saving === 'priority' ? 'Saving…' : 'Save Priority'}
            </button>
          </>
        ) : (
          <span className="readonly-value">
            {ticket.itPriority ? <PriorityBadge priority={ticket.itPriority} /> : <em>Not set</em>}
          </span>
        )}
        {saveErrors.priority && <span className="field-error" role="alert">{saveErrors.priority}</span>}
      </div>

      <div className="field-group">
        <label htmlFor="status-select">Update Status</label>
        {permittedNextStatuses.length === 0 ? (
          <p className="terminal-status-note">
            This ticket is in a terminal state (<strong>{ticket.status}</strong>) and cannot be transitioned further.
          </p>
        ) : isStaff ? (
          <>
            <select
              id="status-select"
              value={status}
              onChange={e => setStatus(e.target.value)}
              disabled={saving === 'status'}
            >
              <option value={ticket.status}>{STATUS_LABELS[ticket.status]} (current)</option>
              {permittedNextStatuses.map(s => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
            <button
              onClick={() => patchTicket('status', { status }, 'status')}
              disabled={saving === 'status' || status === ticket.status}
              className="save-btn"
            >
              {saving === 'status' ? 'Saving…' : 'Update Status'}
            </button>
          </>
        ) : (
          <span className="readonly-value">
            <StatusBadge status={ticket.status} />
          </span>
        )}
        {saveErrors.status && <span className="field-error" role="alert">{saveErrors.status}</span>}
      </div>
    </section>
  )
}
