import React, { useState, useEffect, useRef } from 'react'
import './TicketWorkflowControls.css'
import { StatusBadge, STATUS_LABELS } from '../shared/StatusBadge'
import {
  getAllowedTransitions,
  changeStatus,
  changeOwner,
  setResolvedIndication,
  loadActiveStaffAndAdmins,
  AssignableUser,
} from '../../api/workflow'
import {
  NormalizedApiError,
  generateIdempotencyKey,
  parseApiError,
  safeFetch,
  toApiError,
} from '../../api/errors'

export interface TicketWorkflowControlsProps {
  ticket: {
    id: number | string
    ticketNumber?: string
    status: string
    version?: number
    summary?: string
    problemAppearsResolved?: boolean
    requesterMarkedResolvedAt?: string | null
    owner?: { id: string; name: string; role?: string } | null
    itPriority?: string | null
    [key: string]: any
  }
  currentUser?: {
    id: string
    name: string
    role: string
  } | null
  onTicketUpdate: (updatedTicket: any) => void
  loadAssignableUsers?: () => Promise<AssignableUser[]>
}

export function TicketWorkflowControls({
  ticket,
  currentUser,
  onTicketUpdate,
  loadAssignableUsers = loadActiveStaffAndAdmins,
}: TicketWorkflowControlsProps) {
  const isStaff =
    currentUser?.role === 'IT_STAFF' || currentUser?.role === 'ADMINISTRATOR'
  const isAdmin = currentUser?.role === 'ADMINISTRATOR'
  const isRequester = currentUser?.role === 'REQUESTER'

  // Transitions state
  const [allowedTransitions, setAllowedTransitions] = useState<string[]>([])
  const [loadingTransitions, setLoadingTransitions] = useState(true)
  const [transitionsError, setTransitionsError] = useState<NormalizedApiError | null>(null)

  // Status update state
  const [selectedStatus, setSelectedStatus] = useState(ticket.status)
  const [savingStatus, setSavingStatus] = useState(false)
  const [statusError, setStatusError] = useState<NormalizedApiError | null>(null)
  const [statusSuccess, setStatusSuccess] = useState<string | null>(null)

  // Owner state
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([])
  const [selectedOwnerId, setSelectedOwnerId] = useState(ticket.owner?.id || '')
  const [savingOwner, setSavingOwner] = useState(false)
  const [ownerError, setOwnerError] = useState<NormalizedApiError | null>(null)

  // Priority state
  const [priority, setPriority] = useState(ticket.itPriority ?? '')
  const [savingPriority, setSavingPriority] = useState(false)
  const [priorityError, setPriorityError] = useState<string | null>(null)

  // Advisory state
  const [savingAdvisory, setSavingAdvisory] = useState(false)

  // Cancellation modal
  const [showCancelModal, setShowCancelModal] = useState(false)
  const cancelModalRef = useRef<HTMLDivElement>(null)

  // One Idempotency-Key per status-change intent, remembered with the exact payload it was used for.
  const statusKeyRef = useRef<{ key: string; fingerprint: string } | null>(null)
  const statusPendingRef = useRef(false)

  function closeCancelModal() {
    statusKeyRef.current = null
    setShowCancelModal(false)
  }

  useEffect(() => {
    setPriority(ticket.itPriority ?? '')
  }, [ticket.itPriority])

  useEffect(() => {
    fetchTransitions()
  }, [ticket.id, ticket.status])

  useEffect(() => {
    setSelectedStatus(ticket.status)
  }, [ticket.status])

  useEffect(() => {
    setSelectedOwnerId(ticket.owner?.id || '')
  }, [ticket.owner])

  useEffect(() => {
    if (isStaff) {
      loadAssignableUsers()
        .then((users) => setAssignableUsers(users))
        .catch(() => {})
    }
  }, [isStaff])

  // Handle ESC in modal
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && showCancelModal) {
        closeCancelModal()
      }
    }
    if (showCancelModal) {
      window.addEventListener('keydown', handleKeyDown)
      cancelModalRef.current?.focus()
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showCancelModal])

  async function fetchTransitions() {
    setLoadingTransitions(true)
    setTransitionsError(null)
    try {
      const data = await getAllowedTransitions(ticket.id)
      setAllowedTransitions(data.allowedTransitions || [])
    } catch (err: unknown) {
      setTransitionsError(toApiError(err))
    } finally {
      setLoadingTransitions(false)
    }
  }

  async function handleUpdateStatus(targetStatus = selectedStatus) {
    if (targetStatus === 'CANCELLED' && !showCancelModal) {
      setShowCancelModal(true)
      return
    }

    if (statusPendingRef.current) return

    setShowCancelModal(false)
    statusPendingRef.current = true
    setSavingStatus(true)
    setStatusError(null)
    setStatusSuccess(null)

    const version = ticket.version ?? 1
    const fingerprint = JSON.stringify({ ticketId: String(ticket.id), status: targetStatus, version })
    if (!statusKeyRef.current || statusKeyRef.current.fingerprint !== fingerprint) {
      statusKeyRef.current = { key: generateIdempotencyKey(), fingerprint }
    }
    const idempotencyKey = statusKeyRef.current.key

    try {
      const updated = await changeStatus(ticket.id, { status: targetStatus, version }, idempotencyKey)

      // Success (including a replayed response): the intent is finished.
      statusKeyRef.current = null
      setStatusSuccess('อัปเดตสำเร็จ (Status updated successfully)')
      onTicketUpdate(updated)
      await fetchTransitions()
    } catch (err: unknown) {
      const apiError = toApiError(err)
      if (apiError.isConflict || apiError.code === 'IDEMPOTENCY_KEY_REUSED') {
        statusKeyRef.current = null
      }
      setStatusError(apiError)
    } finally {
      statusPendingRef.current = false
      setSavingStatus(false)
    }
  }

  async function handleSaveOwner() {
    setSavingOwner(true)
    setOwnerError(null)
    try {
      const updated = await changeOwner(ticket.id, {
        ownerId: selectedOwnerId || null,
        version: ticket.version ?? 1,
      })
      onTicketUpdate(updated)
    } catch (err: unknown) {
      setOwnerError(toApiError(err))
    } finally {
      setSavingOwner(false)
    }
  }

  async function handleClaimOrUnassign(claim: boolean) {
    setSavingOwner(true)
    setOwnerError(null)
    try {
      const updated = await changeOwner(ticket.id, {
        ownerId: claim ? currentUser?.id || null : null,
        version: ticket.version ?? 1,
      })
      onTicketUpdate(updated)
    } catch (err: unknown) {
      setOwnerError(toApiError(err))
    } finally {
      setSavingOwner(false)
    }
  }

  async function handleSavePriority() {
    setSavingPriority(true)
    setPriorityError(null)
    try {
      const res = await safeFetch(`/staff/tickets/${ticket.id}/priority`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itPriority: priority || null }),
      })
      if (res.ok) {
        const updated = await res.json()
        onTicketUpdate({ ...ticket, ...updated })
      } else {
        let body: any = null
        try {
          body = await res.json()
        } catch {
          body = null
        }
        setPriorityError(parseApiError(res, body).message)
      }
    } catch (err: unknown) {
      setPriorityError(toApiError(err).message)
    } finally {
      setSavingPriority(false)
    }
  }

  async function handleRequesterAdvisory() {
    setSavingAdvisory(true)
    try {
      const idempotencyKey = generateIdempotencyKey()
      const updated = await setResolvedIndication(ticket.id, true, idempotencyKey)
      onTicketUpdate({
        ...ticket,
        problemAppearsResolved: true,
        requesterMarkedResolvedAt: updated.requesterMarkedResolvedAt,
      })
    } catch (err: unknown) {
      setStatusError(toApiError(err))
    } finally {
      setSavingAdvisory(false)
    }
  }

  const isTerminal = !loadingTransitions && allowedTransitions.length === 0
  const canShowAdvisoryButton =
    isRequester &&
    !ticket.problemAppearsResolved &&
    ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'REOPENED'].includes(ticket.status)

  return (
    <section className="ticket-workflow-controls" aria-label="Ticket Workflow Operations">
      <div className="workflow-header">
        <h2>Ticket Operations & Workflow</h2>
      </div>

      {/* Success alert */}
      {statusSuccess && (
        <div className="workflow-status-banner" role="status" aria-live="polite">
          {statusSuccess}
        </div>
      )}

      {/* Staff Advisory Banner */}
      {isStaff && (ticket.problemAppearsResolved || ticket.requesterMarkedResolvedAt) && (
        <div className="advisory-staff-banner" role="status">
          <span>ℹ️ ผู้ร้องขอได้ทำเครื่องหมายว่าแก้ไขแล้ว</span>
        </div>
      )}

      {/* Status / Gate error alert */}
      {statusError && (
        <div className="workflow-alert" role="alert">
          <div>
            <strong>ข้อผิดพลาด: </strong>
            <span>{statusError.message}</span>
          </div>
          {statusError.isConflict && (
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => {
                statusKeyRef.current = null
                fetchTransitions()
              }}
            >
              โหลดซ้ำ (Reload)
            </button>
          )}
        </div>
      )}

      {/* Allowed transitions loading error */}
      {transitionsError && (
        <div className="workflow-alert" role="alert">
          <span>{transitionsError.message}</span>
          <button
            type="button"
            className="btn-secondary btn-sm"
            onClick={fetchTransitions}
          >
            ลองใหม่ (Retry)
          </button>
        </div>
      )}

      <div className="workflow-grid">
        {/* Current Status Row */}
        <div className="workflow-field-row">
          <dt>Current Status</dt>
          <dd data-status={ticket.status}>
            <StatusBadge status={ticket.status} />
          </dd>
        </div>

        {/* Requester Advisory Button */}
        {canShowAdvisoryButton && (
          <div className="workflow-field-row">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleRequesterAdvisory}
              disabled={savingAdvisory}
            >
              {savingAdvisory
                ? 'กำลังบันทึก…'
                : 'ทำเครื่องหมายว่าปัญหาดูเหมือนจะได้รับการแก้ไขแล้ว (Problem Appears Resolved)'}
            </button>
          </div>
        )}

        {/* Requester Cancel Button */}
        {isRequester && allowedTransitions.includes('CANCELLED') && (
          <div className="workflow-field-row">
            <button
              type="button"
              className="btn-secondary"
              style={{ color: 'var(--zen-color-error, #8b0000)' }}
              onClick={() => handleUpdateStatus('CANCELLED')}
              disabled={savingStatus}
            >
              ยกเลิกตั๋ว (Cancel Ticket)
            </button>
          </div>
        )}

        {/* Owner Controls (Staff & Admin only) */}
        {isStaff && (
          <div className="workflow-field-group">
            <label htmlFor="owner-select">Ticket Owner (ผู้รับผิดชอบ)</label>
            <div className="workflow-controls-row">
              <select
                id="owner-select"
                aria-label="Ticket Owner"
                value={selectedOwnerId}
                onChange={(e) => setSelectedOwnerId(e.target.value)}
                disabled={savingOwner}
              >
                <option value="">— Unassigned (ยังไม่ได้มอบหมาย) —</option>
                {assignableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn-primary btn-sm"
                onClick={handleSaveOwner}
                disabled={savingOwner}
              >
                {savingOwner ? 'Saving…' : 'Save Owner'}
              </button>
            </div>
            {ownerError && (
              <span className="field-error" role="alert">
                {ownerError.message}
              </span>
            )}
          </div>
        )}

        {/* IT Priority Controls (Staff only) */}
        {isStaff && (
          <div className="workflow-field-group">
            <label htmlFor="it-priority-select">IT Priority</label>
            <div className="workflow-controls-row">
              <select
                id="it-priority-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                disabled={savingPriority}
              >
                <option value="">— Not set —</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
              <button
                type="button"
                className="btn-primary btn-sm"
                onClick={handleSavePriority}
                disabled={savingPriority}
              >
                {savingPriority ? 'Saving…' : 'Save Priority'}
              </button>
            </div>
            {priorityError && (
              <span className="field-error" role="alert">
                {priorityError}
              </span>
            )}
          </div>
        )}

        {/* Status Transition Controls (Staff only) */}
        {isStaff && (
          <div className="workflow-field-group">
            <label htmlFor="status-select">Update Status</label>
            {loadingTransitions ? (
              <span className="text-muted">กำลังโหลดสถานะที่อนุญาต…</span>
            ) : isTerminal ? (
              <p className="terminal-status-note">
                This ticket is in a terminal state (<strong>{ticket.status}</strong>) and cannot be transitioned further. (ไม่สามารถเปลี่ยนสถานะได้)
              </p>
            ) : (
              <div className="workflow-controls-row">
                <select
                  id="status-select"
                  aria-label="Update Status"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  disabled={savingStatus}
                >
                  <option value={ticket.status}>
                    Current: {ticket.status}
                  </option>
                  {allowedTransitions.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s] || s}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn-primary btn-sm"
                  onClick={() => handleUpdateStatus()}
                  disabled={savingStatus || selectedStatus === ticket.status}
                >
                  {savingStatus ? 'Saving…' : 'Update Status'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal for CANCELLED transition */}
      {showCancelModal && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-modal-title"
          aria-describedby="cancel-modal-desc"
          tabIndex={-1}
          ref={cancelModalRef}
        >
          <div className="modal-content">
            <h3 id="cancel-modal-title" className="modal-title">
              ยืนยันการยกเลิกตั๋ว (Confirm Cancellation)
            </h3>
            <p id="cancel-modal-desc">
              คุณแนใจหรือไม่ว่าต้องการยกเลิกตั๋วนี้? การยกเลิกตั๋วเป็นสถานะสิ้นสุด (Terminal State) และไม่สามารถเปิดใหม่ได้
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={closeCancelModal}
                disabled={savingStatus}
              >
                ยกเลิก (ปิด)
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ backgroundColor: 'var(--zen-color-error, #8b0000)' }}
                onClick={() => handleUpdateStatus('CANCELLED')}
                disabled={savingStatus}
              >
                {savingStatus ? 'กำลังยกเลิก…' : 'ยืนยัน (Confirm)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default TicketWorkflowControls
