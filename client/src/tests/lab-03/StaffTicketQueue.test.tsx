import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { StaffTicketQueuePage } from '../../../src/pages/staff/StaffTicketQueuePage'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { describe, it, expect, vi } from 'vitest'

const mockTickets = [
  {
    id: 't1', ticketNumber: 'TKT-001', summary: 'VPN issue',
    status: 'NEW', requestedPriority: 'HIGH', itPriority: 'HIGH',
    category: { id: 'c1', name: 'Network' }, owner: { id: 'u1', name: 'Frank IT' },
    createdAt: '2026-09-01T10:00:00Z', updatedAt: '2026-09-01T12:00:00Z',
  },
]

const mockPagination = { page: 1, pageSize: 20, total: 1, totalPages: 1 }

const mockSuccessResponse = {
  ok: true,
  status: 200,
  json: async () => ({ tickets: mockTickets, pagination: mockPagination }),
}

const renderQueue = () => render(
  <MemoryRouter>
    <StaffTicketQueuePage />
  </MemoryRouter>
)

it('shows loading skeleton while fetching', () => {
  global.fetch = vi.fn(() => new Promise(() => {})) as any
  renderQueue()
  expect(document.querySelector('.skeleton-row') || screen.queryByRole('status', { busy: true }))
    .toBeTruthy()
})

it('renders table with all required columns on desktop', async () => {
  global.fetch = vi.fn(() => Promise.resolve(mockSuccessResponse as Response)) as any
  renderQueue()

  await waitFor(() => {
    expect(screen.getAllByText(/Ticket #/i)[0]).toBeInTheDocument()
    expect(screen.getAllByText(/Created Date/i)[0]).toBeInTheDocument()
    expect(screen.getAllByText(/Summary/i)[0]).toBeInTheDocument()
    expect(screen.getAllByText(/Category/i)[0]).toBeInTheDocument()
    expect(screen.getAllByText(/req.*priority/i)[0]).toBeInTheDocument()
    expect(screen.getAllByText(/it.*priority/i)[0]).toBeInTheDocument()
    expect(screen.getAllByText(/Status/i)[0]).toBeInTheDocument()
    expect(screen.getAllByText(/ticket owner/i)[0]).toBeInTheDocument()
    expect(screen.getAllByText(/last updated/i)[0]).toBeInTheDocument()
  })
})

it('renders ticket data in the table', async () => {
  global.fetch = vi.fn(() => Promise.resolve(mockSuccessResponse as Response)) as any
  renderQueue()

  await waitFor(() => {
    expect(screen.getAllByText('TKT-001')[0]).toBeInTheDocument()
    expect(screen.getAllByText('VPN issue')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Network')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Frank IT')[0]).toBeInTheDocument()
  })
})

it('renders status and priority as badge components (not plain text)', async () => {
  global.fetch = vi.fn(() => Promise.resolve(mockSuccessResponse as Response)) as any
  renderQueue()

  await waitFor(() => {
    const badge = document.querySelector('.badge--new') || document.querySelector('[class*="badge"]')
    expect(badge).toBeTruthy()
  })
})

it('renders "Open Detail" button for each ticket', async () => {
  global.fetch = vi.fn(() => Promise.resolve(mockSuccessResponse as Response)) as any
  renderQueue()

  await waitFor(() => {
    expect(screen.getAllByRole('button', { name: /open detail for ticket TKT-001/i })[0]).toBeInTheDocument()
  })
})

it('shows "No results" state when filters return empty array', async () => {
  global.fetch = vi.fn(() => Promise.resolve({
    ok: true,
    status: 200,
    json: async () => ({
      tickets: [],
      pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    }),
  } as Response)) as any

  renderQueue()
  
  await waitFor(() => {
    fireEvent.change(screen.getByLabelText(/search/i), { target: { value: 'nonexistent' } })
  })

  await waitFor(() => {
    expect(screen.getByText(/no tickets match/i)).toBeInTheDocument()
  })
})

it('shows safe error message (no stack trace) on API failure', async () => {
  global.fetch = vi.fn(() => Promise.resolve({
    ok: false,
    status: 500,
    json: async () => ({ error: 'Internal server error' }),
  } as Response)) as any

  renderQueue()

  await waitFor(() => {
    const errorEl = screen.getByRole('alert')
    expect(errorEl).toBeInTheDocument()
    expect(errorEl.textContent).not.toMatch(/at.*\(.*\.ts/)
    expect(errorEl.textContent).not.toMatch(/Error: /)
    expect(errorEl.textContent?.toLowerCase()).toMatch(/unable|try again|error/i)
  })
})

it('search input calls API with search param after debounce', async () => {
  const mockFetch = vi.fn(() => Promise.resolve(mockSuccessResponse as Response)) as any
  global.fetch = mockFetch

  renderQueue()
  await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1))

  fireEvent.change(screen.getByLabelText(/search/i), { target: { value: 'vpn' } })

  await waitFor(() => {
    const calls = mockFetch.mock.calls as any[]
    const searchCall = calls.find(call =>
      String(call[0]).includes('search=vpn')
    )
    expect(searchCall).toBeTruthy()
  }, { timeout: 1000 })
})

it('status filter dropdown changes API call parameters', async () => {
  const mockFetch = vi.fn(() => Promise.resolve(mockSuccessResponse as Response)) as any
  global.fetch = mockFetch

  renderQueue()
  await waitFor(() => expect(mockFetch).toHaveBeenCalled())

  fireEvent.change(screen.getByLabelText(/status/i), { target: { value: 'IN_PROGRESS' } })

  await waitFor(() => {
    const calls = mockFetch.mock.calls as any[]
    const filteredCall = calls.find(call => String(call[0]).includes('status=IN_PROGRESS'))
    expect(filteredCall).toBeTruthy()
  })
})
