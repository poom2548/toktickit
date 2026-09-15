export type TicketStatus = 'NEW' | 'OPEN' | 'IN_PROGRESS' | 'WAITING_FOR_REQUESTER' | 'RESOLVED' | 'CLOSED' | 'REOPENED' | 'CANCELLED'
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type SortField = 'createdAt' | 'updatedAt' | 'ticketNumber' | 'status' | 'requestedPriority' | 'itPriority'
export type SortDirection = 'asc' | 'desc'
export type FetchState = 'idle' | 'loading' | 'success' | 'error'

export interface TicketSummary {
  id: string
  ticketNumber: string
  createdAt: string
  updatedAt: string
  summary: string
  status: TicketStatus
  requestedPriority: Priority
  itPriority: Priority | null
  category: { id: string; name: string } | null
  owner: { id: string; name: string } | null
}

export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}
