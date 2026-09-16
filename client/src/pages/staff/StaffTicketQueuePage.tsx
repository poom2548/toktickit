import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { QueueControls } from '../../components/staff/QueueControls'
import { QueueTable } from '../../components/staff/QueueTable'
import { QueueCardList } from '../../components/staff/QueueCardList'
import { Pagination } from '../../components/shared/Pagination'
import { TicketSummary, PaginationMeta, TicketStatus, Priority, SortField, SortDirection, FetchState } from '../../types'
import './StaffTicketQueue.css'

export function StaffTicketQueuePage() {
  const navigate = useNavigate()

  // Filter/sort/pagination state
  const [search, setSearch]           = useState('')
  const [statusFilter, setStatus]     = useState<TicketStatus | ''>('')
  const [priorityFilter, setPriority] = useState<Priority | ''>('')
  const [sortField, setSortField]     = useState<SortField>('createdAt')
  const [sortDir, setSortDir]         = useState<SortDirection>('desc')
  const [page, setPage]               = useState(1)
  const PAGE_SIZE = 20

  // Data state
  const [tickets, setTickets]         = useState<TicketSummary[]>([])
  const [pagination, setPagination]   = useState<PaginationMeta | null>(null)
  const [fetchState, setFetchState]   = useState<FetchState>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(timer)
  }, [search])

  // Reset to page 1 whenever filters/sort change
  useEffect(() => { setPage(1) }, [debouncedSearch, statusFilter, priorityFilter, sortField, sortDir])

  // Fetch data
  const fetchTickets = useCallback(async () => {
    setFetchState('loading')
    setErrorMessage(null)

    const params = new URLSearchParams()
    if (debouncedSearch) params.set('search', debouncedSearch)
    if (statusFilter)    params.set('status', statusFilter)
    if (priorityFilter)  params.set('priority', priorityFilter)
    params.set('sort', sortField)
    params.set('direction', sortDir)
    params.set('page', String(page))
    params.set('pageSize', String(PAGE_SIZE))

    try {
      // In tests and real app, URL might be different based on Vite setup
      // Using /api/staff/tickets assuming backend proxy
      // The instructions mention `/staff/tickets?${params.toString()}`
      // The tests expect `/staff/tickets` in the fetch call exactly as specified.
      // Wait, is it /staff/tickets or /api/staff/tickets? The prompt says `/staff/tickets` for fetch
      const res = await fetch(`/staff/tickets?${params.toString()}`, {
        credentials: 'include',
      })

      if (res.status === 401) { window.location.href = '/login'; return }
      if (res.status === 403) { setFetchState('error'); setErrorMessage('forbidden'); return }

      if (!res.ok) {
        setFetchState('error')
        setErrorMessage('Unable to load tickets. Please try again.')
        return
      }

      const data = await res.json()
      setTickets(data.tickets)
      setPagination(data.pagination)
      setFetchState('success')
    } catch {
      setFetchState('error')
      setErrorMessage('Unable to load tickets. Please check your connection and try again.')
    }
  }, [debouncedSearch, statusFilter, priorityFilter, sortField, sortDir, page])

  useEffect(() => { fetchTickets() }, [fetchTickets])

  const handleOpenDetail = (ticketId: string) => {
    navigate(`/staff/tickets/${ticketId}`)
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const controls = (
    <QueueControls
      search={search}
      onSearchChange={setSearch}
      statusFilter={statusFilter}
      onStatusChange={setStatus as any}
      priorityFilter={priorityFilter}
      onPriorityChange={setPriority as any}
    />
  )

  if (fetchState === 'loading') {
    return (
      <div className="staff-queue-page">
        {controls}
        <div className="skeleton-container" aria-busy="true" aria-label="Loading tickets">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton-row" />
          ))}
        </div>
      </div>
    )
  }

  if (fetchState === 'error' && errorMessage === 'forbidden') {
    return (
      <div className="staff-queue-page">
        <div className="forbidden-message" role="alert">
          <h2>Access Denied</h2>
          <p>You do not have permission to view the Ticket Queue.</p>
        </div>
      </div>
    )
  }

  if (fetchState === 'error') {
    return (
      <div className="staff-queue-page">
        {controls}
        <div className="error-message" role="alert">
          <p>{errorMessage}</p>
          <button onClick={fetchTickets}>Retry</button>
        </div>
      </div>
    )
  }

  const filtersActive = debouncedSearch || statusFilter || priorityFilter

  if (fetchState === 'success' && tickets.length === 0 && !filtersActive) {
    return (
      <div className="staff-queue-page">
        {controls}
        <div className="empty-queue" role="status">
          <p>No tickets in the queue yet.</p>
        </div>
      </div>
    )
  }

  if (fetchState === 'success' && tickets.length === 0 && filtersActive) {
    return (
      <div className="staff-queue-page">
        {controls}
        <div className="no-results" role="status">
          <p>No tickets match your current search or filters.</p>
          <button onClick={() => { setSearch(''); setStatus(''); setPriority('') }}>
            Clear filters
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="staff-queue-page">
      {controls}
      <QueueTable tickets={tickets} onOpenDetail={handleOpenDetail} onSort={handleSort} sortField={sortField} sortDir={sortDir} />
      <QueueCardList tickets={tickets} onOpenDetail={handleOpenDetail} />
      <Pagination pagination={pagination} page={page} onPageChange={setPage} />
    </div>
  )
}
