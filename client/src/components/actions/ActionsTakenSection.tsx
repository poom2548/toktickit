import React, { useState, useEffect } from 'react'
import './ActionsTakenSection.css'
import {
  ActionTaken,
  listActions,
  createAction,
  updateAction,
} from '../../api/actionsTaken'
import { NormalizedApiError, generateIdempotencyKey } from '../../api/errors'

export interface ActionsTakenSectionProps {
  ticketId: number | string
  ticketStatus: string
  ticketVersion: number
  isStaff: boolean
  currentUser?: { id: string; name: string; role?: string } | null
  onTicketUpdate?: (updated: any) => void
}

function formatBangkokDateTime(isoString: string): string {
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

export function ActionsTakenSection({
  ticketId,
  ticketStatus,
  ticketVersion,
  isStaff,
  currentUser,
  onTicketUpdate,
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
    } catch (err: any) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  function handleDescriptionChange(val: string) {
    setDescription(val)
    if (val.length > 2000) {
      setFieldErrors((prev) => ({
        ...prev,
        description: 'ความยาวเกิน 2000 ตัวอักษร (Description exceeds 2000 characters)',
      }))
    } else {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next.description
        return next
      })
    }
  }

  function handleResultChange(val: string) {
    setResult(val)
    if (val.length > 2000) {
      setFieldErrors((prev) => ({
        ...prev,
        result: 'ความยาวเกิน 2000 ตัวอักษร (Result exceeds 2000 characters)',
      }))
    } else {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next.result
        return next
      })
    }
  }

  function handleFollowUpNoteChange(val: string) {
    setFollowUpNote(val)
    if (val.length > 2000) {
      setFieldErrors((prev) => ({
        ...prev,
        followUpNote: 'ความยาวเกิน 2000 ตัวอักษร (Follow-up note exceeds 2000 characters)',
      }))
    } else {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next.followUpNote
        return next
      })
    }
  }

  function openCreateForm() {
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
    setIsFormOpen(false)
    setEditingAction(null)
    setFieldErrors({})
    setConflictError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return

    const errors: Record<string, string> = {}
    if (!description.trim()) {
      errors.description = 'กรุณาระบุคำอธิบาย (Description is required)'
    } else if (description.length > 2000) {
      errors.description = 'ความยาวเกิน 2000 ตัวอักษร (Description exceeds 2000 characters)'
    }

    if (!result.trim()) {
      errors.result = 'กรุณาระบุผลลัพธ์ (Result is required)'
    } else if (result.length > 2000) {
      errors.result = 'ความยาวเกิน 2000 ตัวอักษร (Result exceeds 2000 characters)'
    }

    if (followUpRequired) {
      if (!followUpNote.trim()) {
        errors.followUpNote = 'กรุณาระบุบันทึกการติดตามผล (Follow-up note is required)'
      } else if (followUpNote.length > 2000) {
        errors.followUpNote = 'ความยาวเกิน 2000 ตัวอักษร (Follow-up note exceeds 2000 characters)'
      }
    }

    if (attachmentNotes && attachmentNotes.length > 2000) {
      errors.attachmentNotes = 'ความยาวเกิน 2000 ตัวอักษร'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

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

    try {
      if (editingAction) {
        // Edit mode
        await updateAction(ticketId, editingAction.id, {
          version: editingAction.version,
          actionAt: actionAtIso,
          description: description.trim(),
          result: result.trim(),
          followUpRequired,
          followUpNote: followUpRequired ? followUpNote.trim() : null,
          attachmentNotes: attachmentNotes.trim() || null,
        })
      } else {
        // Create mode
        const idempotencyKey = generateIdempotencyKey()
        await createAction(
          ticketId,
          {
            actionAt: actionAtIso,
            description: description.trim(),
            result: result.trim(),
            followUpRequired,
            followUpNote: followUpRequired ? followUpNote.trim() : null,
            attachmentNotes: attachmentNotes.trim() || null,
          },
          idempotencyKey
        )
      }

      // Success
      closeForm()
      setStatusMessage('บันทึก Action สำเร็จ')
      await loadActions()
    } catch (err: any) {
      if (err.isLocked) {
        // Ticket is locked: close form and display blocking error
        closeForm()
        setError(err)
      } else if (err.isConflict) {
        // 409 Conflict: show conflict banner with reload button, retain typed text
        setConflictError(err)
      } else if (err.isValidation || err.fields) {
        if (err.fields) {
          setFieldErrors(err.fields)
        } else {
          setFieldErrors({ general: err.message })
        }
      } else {
        setFieldErrors({ general: err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ' })
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Reload handler for conflict resolution
  async function handleReloadConflict() {
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
                onChange={(e) => handleDescriptionChange(e.target.value)}
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
                onChange={(e) => handleResultChange(e.target.value)}
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
                onChange={(e) => setFollowUpRequired(e.target.checked)}
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
                  onChange={(e) => handleFollowUpNoteChange(e.target.value)}
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
                onChange={(e) => setAttachmentNotes(e.target.value)}
                disabled={submitting}
                className={fieldErrors.attachmentNotes ? 'is-invalid' : ''}
              />
              {fieldErrors.attachmentNotes && (
                <span className="field-error" role="alert">
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
                        aria-label={`แก้ไข ${act.description}`}
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
