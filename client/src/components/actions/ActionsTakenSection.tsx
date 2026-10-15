import React, { useState, useEffect, useRef } from 'react'
import './ActionsTakenSection.css'
import {
  ActionTaken,
  listActions,
  createAction,
  updateAction,
} from '../../api/actionsTaken'
import { NormalizedApiError, generateIdempotencyKey, toApiError } from '../../api/errors'
import { ActionLimitField, lengthError } from './actionLimits'

export interface ActionsTakenSectionProps {
  ticketId: number | string
  ticketStatus: string
  ticketVersion: number
  isStaff: boolean
  currentUser?: { id: string; name: string; role?: string } | null
  onTicketUpdate?: (updated: any) => void
}

export function formatBangkokDateTime(isoString: string): string {
  try {
    const d = new Date(isoString)
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d)
  } catch {
    return isoString
  }
}

function getBangkokNowForInput(date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const parts = formatter.formatToParts(date)
  const map: Record<string, string> = {}
  for (const part of parts) {
    map[part.type] = part.value
  }
  return `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}`
}

const SNIPPET_MAX = 40

/** Accessible name of the per-row edit button: starts with the visible label, then date/time, then a short snippet. */
function editButtonLabel(action: ActionTaken): string {
  const plain = (action.description || '').replace(/\s+/g, ' ').trim()
  const snippet = plain.length > SNIPPET_MAX ? plain.slice(0, SNIPPET_MAX) + '…' : plain
  const base = `แก้ไข Action เมื่อ ${formatBangkokDateTime(action.actionAt)}`
  return snippet ? `${base} - ${snippet}` : base
}

export function ActionsTakenSection({
  ticketId,
  isStaff,
  currentUser,
}: ActionsTakenSectionProps) {
  const [actions, setActions] = useState<ActionTaken[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<NormalizedApiError | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [conflictError, setConflictError] = useState<NormalizedApiError | null>(null)

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingAction, setEditingAction] = useState<ActionTaken | null>(null)
  const [actionAt, setActionAt] = useState(getBangkokNowForInput())
  const [description, setDescription] = useState('')
  const [result, setResult] = useState('')
  const [followUpRequired, setFollowUpRequired] = useState(false)
  const [followUpNote, setFollowUpNote] = useState('')
  const [attachmentNotes, setAttachmentNotes] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  // One Idempotency-Key per submission intent, remembered with the exact payload it was used for.
  const keyRef = useRef<{ key: string; fingerprint: string } | null>(null)
  const pendingRef = useRef(false)

  function clearKey() {
    keyRef.current = null
  }

  function keyFor(fingerprint: string): string {
    if (keyRef.current && keyRef.current.fingerprint === fingerprint) {
      return keyRef.current.key
    }
    const key = generateIdempotencyKey()
    keyRef.current = { key, fingerprint }
    return key
  }

  useEffect(() => {
    loadActions()
  }, [ticketId])

  async function loadActions() {
    setLoading(true)
    setError(null)
    setConflictError(null)
    try {
      const data = await listActions(ticketId)
      setActions(data)
    } catch (err: unknown) {
      setError(toApiError(err))
    } finally {
      setLoading(false)
    }
  }

  // Typing check shared by the create and edit forms (same limits as submit).
  function changeField(field: ActionLimitField, value: string, setter: (v: string) => void) {
    setter(value)
    const message = lengthError(field, value)
    setFieldErrors((prev) => {
      const next = { ...prev }
      if (message) next[field] = message
      else delete next[field]
      return next
    })
  }

  function openCreateForm() {
    clearKey()
    setEditingAction(null)
    setActionAt(getBangkokNowForInput())
    setDescription('')
    setResult('')
    setFollowUpRequired(false)
    setFollowUpNote('')
    setAttachmentNotes('')
    setFieldErrors({})
    setConflictError(null)
    setIsFormOpen(true)
  }

  function startEdit(action: ActionTaken) {
    clearKey()
    setEditingAction(action)
    try {
      const d = new Date(action.actionAt)
      setActionAt(getBangkokNowForInput(d))
    } catch {
      setActionAt(getBangkokNowForInput())
    }
    setDescription(action.description)
    setResult(action.result)
    setFollowUpRequired(action.followUpRequired)
    setFollowUpNote(action.followUpNote || '')
    setAttachmentNotes(action.attachmentNotes || '')
    setFieldErrors({})
    setConflictError(null)
    setIsFormOpen(true)
  }

  function closeForm() {
    clearKey()
    setIsFormOpen(false)
    setEditingAction(null)
    setFieldErrors({})
    setConflictError(null)
  }

  function toggleFollowUp(checked: boolean) {
    setFollowUpRequired(checked)
    if (!checked) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next.followUpNote
        return next
      })
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting || pendingRef.current) return

    const errors: Record<string, string> = {}
    if (!description.trim()) {
      errors.description = 'กรุณาระบุคำอธิบาย (Description is required)'
    } else {
      const tooLong = lengthError('description', description)
      if (tooLong) errors.description = tooLong
    }

    if (!result.trim()) {
      errors.result = 'กรุณาระบุผลลัพธ์ (Result is required)'
    } else {
      const tooLong = lengthError('result', result)
      if (tooLong) errors.result = tooLong
    }

    if (followUpRequired) {
      if (!followUpNote.trim()) {
        errors.followUpNote = 'กรุณาระบุบันทึกการติดตามผล (Follow-up note is required)'
      } else {
        const tooLong = lengthError('followUpNote', followUpNote)
        if (tooLong) errors.followUpNote = tooLong
      }
    }

    const attachmentTooLong = lengthError('attachmentNotes', attachmentNotes)
    if (attachmentTooLong) errors.attachmentNotes = attachmentTooLong

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    pendingRef.current = true
    setSubmitting(true)
    setFieldErrors({})
    setConflictError(null)

    // Convert datetime-local to ISO string with Bangkok offset (+07:00)
    let actionAtIso: string
    try {
      actionAtIso = new Date(`${actionAt}:00+07:00`).toISOString()
    } catch {
      actionAtIso = new Date().toISOString()
    }

    const payload = {
      actionAt: actionAtIso,
      description: description.trim(),
      result: result.trim(),
      followUpRequired,
      followUpNote: followUpRequired ? followUpNote.trim() : null,
      attachmentNotes: attachmentNotes.trim() || null,
    }

    try {
      if (editingAction) {
        // PATCH carries the version; it does not use an Idempotency-Key.
        await updateAction(ticketId, editingAction.id, {
          version: editingAction.version,
          ...payload,
        })
      } else {
        const idempotencyKey = keyFor(JSON.stringify({ ticketId: String(ticketId), ...payload }))
        await createAction(ticketId, payload, idempotencyKey)
      }

      // Success (including a replayed response): the intent is finished.
      closeForm()
      setStatusMessage('บันทึก Action สำเร็จ')
      await loadActions()
    } catch (err: unknown) {
      const apiError = toApiError(err)
      if (apiError.code === 'IDEMPOTENCY_KEY_REUSED') {
        clearKey()
      }
      if (apiError.isLocked) {
        // Ticket is locked: close form and display blocking error
        closeForm()
        setError(apiError)
      } else if (apiError.isConflict) {
        // 409 Conflict: show conflict banner with reload button, retain typed text
        clearKey()
        setConflictError(apiError)
      } else if (apiError.fields) {
        setFieldErrors(apiError.fields)
      } else {
        setFieldErrors({ general: apiError.message })
      }
    } finally {
      pendingRef.current = false
      setSubmitting(false)
    }
  }

  // Reload handler for conflict resolution
  async function handleReloadConflict() {
    clearKey()
    setConflictError(null)
    await loadActions()
  }

  return (
    <section
      className="actions-taken-section"
      data-testid="actions-taken-section"
      aria-labelledby="actions-taken-heading"
    >
      <div className="actions-header">
        <h3 id="actions-taken-heading">ประวัติการดำเนินงาน (Actions Taken)</h3>
        {isStaff && !isFormOpen && (
          <button
            type="button"
            className="btn-primary"
            onClick={openCreateForm}
          >
            + เพิ่ม Action
          </button>
        )}
      </div>

      {/* Success announcement */}
      {statusMessage && (
        <div className="actions-status-banner" role="status" aria-live="polite">
          {statusMessage}
        </div>
      )}

      {/* General / Locked error alert */}
      {error && (
        <div className="actions-alert" role="alert">
          <span>{error.message}</span>
          <button type="button" className="btn-secondary btn-sm" onClick={loadActions}>
            ลองใหม่ (Retry)
          </button>
        </div>
      )}

      {/* Conflict error banner */}
      {conflictError && (
        <div className="actions-alert" role="alert">
          <div>
            <strong>รายการถูกแก้ไขโดยผู้อื่น (Conflict)</strong>
            <p style={{ margin: '4px 0 0 0' }}>{conflictError.message}</p>
          </div>
          <button
            type="button"
            className="btn-secondary btn-sm"
            onClick={handleReloadConflict}
          >
            โหลดซ้ำ (Reload)
          </button>
        </div>
      )}

      {/* Inline Create/Edit Form (Never modal) */}
      {isStaff && isFormOpen && (
        <form className="action-inline-form" onSubmit={handleSubmit} noValidate>
          <h4 style={{ margin: '0 0 1rem 0', color: 'var(--zen-color-primary, #006B3C)' }}>
            {editingAction ? 'แก้ไขการดำเนินงาน' : 'เพิ่มการดำเนินงานใหม่'}
          </h4>

          {fieldErrors.general && (
            <div className="actions-alert" role="alert">
              {fieldErrors.general}
            </div>
          )}

          <div className="action-form-grid">
            {/* Action Date/Time */}
            <div className="action-field">
              <label htmlFor="action-at-input">
                วันที่/เวลา (Action Date/Time) <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                id="action-at-input"
                type="datetime-local"
                value={actionAt}
                onChange={(e) => setActionAt(e.target.value)}
                disabled={submitting}
                required
              />
            </div>

            {/* Performed By (Read-only / automatic) */}
            <div className="action-field">
              <label id="performed-by-label">ผู้ดำเนินการ (Performed By)</label>
              <span
                className="performed-by-readonly"
                aria-labelledby="performed-by-label"
              >
                {editingAction
                  ? editingAction.performedBy?.name
                  : currentUser?.name || 'CurrentUser'}
              </span>
            </div>

            {/* Description */}
            <div className="action-field action-form-full">
              <label htmlFor="action-desc-input">
                คำอธิบาย (Description) <span style={{ color: 'red' }}>*</span>
              </label>
              <textarea
                id="action-desc-input"
                rows={3}
                value={description}
                onChange={(e) => changeField('description', e.target.value, setDescription)}
                disabled={submitting}
                className={fieldErrors.description ? 'is-invalid' : ''}
                aria-describedby={fieldErrors.description ? 'desc-error' : undefined}
                required
              />
              {fieldErrors.description && (
                <span id="desc-error" className="field-error" role="alert">
                  {fieldErrors.description}
                </span>
              )}
            </div>

            {/* Result */}
            <div className="action-field action-form-full">
              <label htmlFor="action-result-input">
                ผลลัพธ์ (Result) <span style={{ color: 'red' }}>*</span>
              </label>
              <textarea
                id="action-result-input"
                rows={3}
                value={result}
                onChange={(e) => changeField('result', e.target.value, setResult)}
                disabled={submitting}
                className={fieldErrors.result ? 'is-invalid' : ''}
                aria-describedby={fieldErrors.result ? 'result-error' : undefined}
                required
              />
              {fieldErrors.result && (
                <span id="result-error" className="field-error" role="alert">
                  {fieldErrors.result}
                </span>
              )}
            </div>

            {/* Follow-up Checkbox */}
            <div className="action-field action-form-full action-field-checkbox">
              <input
                id="action-follow-up-checkbox"
                type="checkbox"
                checked={followUpRequired}
                onChange={(e) => toggleFollowUp(e.target.checked)}
                disabled={submitting}
              />
              <label htmlFor="action-follow-up-checkbox">ต้องการติดตามผล</label>
            </div>

            {/* Conditional Follow-up Note */}
            {followUpRequired && (
              <div className="action-field action-form-full">
                <label htmlFor="action-follow-up-note">
                  บันทึกการติดตามผล (Follow-up Note) <span style={{ color: 'red' }}>*</span>
                </label>
                <textarea
                  id="action-follow-up-note"
                  rows={2}
                  value={followUpNote}
                  onChange={(e) => changeField('followUpNote', e.target.value, setFollowUpNote)}
                  disabled={submitting}
                  className={fieldErrors.followUpNote ? 'is-invalid' : ''}
                  aria-describedby={fieldErrors.followUpNote ? 'follow-up-note-error' : undefined}
                  required
                />
                {fieldErrors.followUpNote && (
                  <span id="follow-up-note-error" className="field-error" role="alert">
                    {fieldErrors.followUpNote}
                  </span>
                )}
              </div>
            )}

            {/* Attachment Notes */}
            <div className="action-field action-form-full">
              <label htmlFor="action-attachment-notes">
                บันทึกไฟล์แนบ (Attachment Notes)
              </label>
              <input
                id="action-attachment-notes"
                type="text"
                value={attachmentNotes}
                onChange={(e) => changeField('attachmentNotes', e.target.value, setAttachmentNotes)}
                disabled={submitting}
                className={fieldErrors.attachmentNotes ? 'is-invalid' : ''}
                aria-describedby={fieldErrors.attachmentNotes ? 'attachment-notes-error' : undefined}
              />
              {fieldErrors.attachmentNotes && (
                <span id="attachment-notes-error" className="field-error" role="alert">
                  {fieldErrors.attachmentNotes}
                </span>
              )}
            </div>
          </div>

          <div className="action-form-actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? 'กำลังบันทึก…' : 'บันทึก'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={closeForm}
              disabled={submitting}
            >
              ยกเลิก
            </button>
          </div>
        </form>
      )}

      {/* Loading state */}
      {loading ? (
        <div
          role="status"
          aria-label="กำลังโหลด"
          aria-live="polite"
          style={{ padding: '1rem', textAlign: 'center' }}
        >
          กำลังโหลดประวัติการดำเนินงาน...
        </div>
      ) : actions.length === 0 ? (
        <div className="actions-empty">ยังไม่มีประวัติการดำเนินงาน</div>
      ) : (
        <div className="actions-table-wrapper">
          <table className="actions-table">
            <caption>ประวัติการดำเนินงาน (Actions Taken)</caption>
            <thead>
              <tr>
                <th scope="col">วันที่/เวลา</th>
                <th scope="col">ผู้ดำเนินการ</th>
                <th scope="col">คำอธิบาย</th>
                <th scope="col">ผลลัพธ์</th>
                <th scope="col">การติดตามผล / หมายเหตุ</th>
                {isStaff && <th scope="col">จัดการ</th>}
              </tr>
            </thead>
            <tbody>
              {actions.map((act) => (
                <tr key={act.id}>
                  <td data-label="วันที่/เวลา">
                    {formatBangkokDateTime(act.actionAt)}
                  </td>
                  <td data-label="ผู้ดำเนินการ">
                    {act.performedBy?.name || 'N/A'}
                  </td>
                  <td data-label="คำอธิบาย" style={{ whiteSpace: 'pre-wrap' }}>
                    {act.description}
                  </td>
                  <td data-label="ผลลัพธ์" style={{ whiteSpace: 'pre-wrap' }}>
                    {act.result}
                  </td>
                  <td data-label="การติดตามผล / หมายเหตุ">
                    {act.followUpRequired && (
                      <div style={{ marginBottom: '4px' }}>
                        <span className="follow-up-badge">
                          <span aria-hidden="true">⚠️</span> ต้องการติดตามผล
                        </span>
                        {act.followUpNote && (
                          <div style={{ marginTop: '4px', fontStyle: 'italic' }}>
                            {act.followUpNote}
                          </div>
                        )}
                      </div>
                    )}
                    {act.attachmentNotes && (
                      <div style={{ fontSize: '0.85em', color: 'var(--zen-color-text-secondary, #495057)' }}>
                        <span aria-hidden="true">📎 </span>
                        <span>{act.attachmentNotes}</span>
                      </div>
                    )}
                  </td>
                  {isStaff && (
                    <td data-label="จัดการ">
                      <button
                        type="button"
                        className="btn-secondary btn-sm"
                        aria-label={editButtonLabel(act)}
                        onClick={() => startEdit(act)}
                      >
                        แก้ไข
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default ActionsTakenSection
