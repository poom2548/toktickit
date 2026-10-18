import { parseApiError, safeFetch } from './errors'

export interface AllowedTransitionsResponse {
  currentStatus: string
  version: number
  allowedTransitions: string[]
}

export interface TicketStatusUpdatePayload {
  status: string
  version: number
}

export interface TicketOwnerUpdatePayload {
  ownerId: string | null
  version: number
}

export interface TicketSummary {
  id: number
  ticketNumber: string
  status: string
  version: number
  updatedAt: string
  owner?: { id: string; name: string } | null
  problemAppearsResolved?: boolean
  requesterMarkedResolvedAt?: string | null
}

export interface AssignableUser {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
}

export async function getAllowedTransitions(
  ticketId: number | string
): Promise<AllowedTransitionsResponse> {
  const res = await safeFetch(`/api/tickets/${ticketId}/allowed-transitions`, {
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

  return res.json()
}

export async function changeStatus(
  ticketId: number | string,
  payload: TicketStatusUpdatePayload,
  idempotencyKey?: string
): Promise<TicketSummary> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey
  }

  const res = await safeFetch(`/api/tickets/${ticketId}/status`, {
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

export async function changeOwner(
  ticketId: number | string,
  payload: TicketOwnerUpdatePayload
): Promise<any> {
  const res = await safeFetch(`/staff/tickets/${ticketId}/owner`, {
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

export async function setResolvedIndication(
  ticketId: number | string,
  problemAppearsResolved: boolean,
  idempotencyKey?: string
): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey
  }

  const res = await safeFetch(`/api/tickets/${ticketId}/requester-resolved-indication`, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: JSON.stringify({ problemAppearsResolved }),
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

export async function getAssignableUsers(): Promise<AssignableUser[]> {
  const res = await safeFetch('/staff/assignable-users', {
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
  return data.users || []
}

export async function loadActiveStaffAndAdmins(): Promise<AssignableUser[]> {
  return getAssignableUsers()
}
