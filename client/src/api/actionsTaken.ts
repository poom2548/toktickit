import { parseApiError, NormalizedApiError } from './errors'

export interface ActionTaken {
  id: string
  actionAt: string
  description: string
  result: string
  performedBy: { id: string; name: string }
  followUpRequired: boolean
  followUpNote: string | null
  attachmentNotes: string | null
  version: number
  createdAt: string
  updatedAt?: string
}

export interface CreateActionPayload {
  actionAt: string
  description: string
  result: string
  followUpRequired: boolean
  followUpNote?: string | null
  attachmentNotes?: string | null
}

export interface UpdateActionPayload {
  version: number
  actionAt?: string
  description?: string
  result?: string
  followUpRequired?: boolean
  followUpNote?: string | null
  attachmentNotes?: string | null
}

export async function listActions(ticketId: number | string): Promise<ActionTaken[]> {
  const res = await fetch(`/api/tickets/${ticketId}/actions-taken`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!res.ok) {
    let body: any
    try {
      body = await res.json()
    } catch {
      body = null
    }
    throw parseApiError(res, body)
  }

  const data = await res.json()
  return data.actions || []
}

export async function createAction(
  ticketId: number | string,
  payload: CreateActionPayload,
  idempotencyKey?: string
): Promise<ActionTaken> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey
  }

  const res = await fetch(`/api/tickets/${ticketId}/actions-taken`, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    let body: any
    try {
      body = await res.json()
    } catch {
      body = null
    }
    throw parseApiError(res, body)
  }

  return res.json()
}

export async function updateAction(
  ticketId: number | string,
  actionId: string,
  payload: UpdateActionPayload
): Promise<ActionTaken> {
  const res = await fetch(`/api/tickets/${ticketId}/actions-taken/${actionId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    let body: any
    try {
      body = await res.json()
    } catch {
      body = null
    }
    throw parseApiError(res, body)
  }

  return res.json()
}
