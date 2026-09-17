import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { StaffTicketDetailPage } from '../../pages/staff/StaffTicketDetailPage'
import { AuthProvider } from '../../contexts/AuthContext'

const mockTicket = {
  id: 't1', ticketNumber: 'TKT-001', summary: 'VPN not working',
  description: 'Cannot connect since yesterday', status: 'IN_PROGRESS',
  requestedPriority: 'HIGH', itPriority: 'HIGH',
  problemAppearsResolved: false,
  createdAt: '2026-09-01T10:00:00Z', updatedAt: '2026-09-01T12:00:00Z',
  requester: { id: 'u1', name: 'Alice Requester', email: 'alice@toktick.dev', role: 'REQUESTER' },
  owner: { id: 'u2', name: 'Frank IT', role: 'IT_STAFF' },
  category: { id: 'c1', name: 'Network' },
  publicComments: [
    { id: 'pc1', content: 'Looking into it.', createdAt: '2026-09-01T11:00:00Z',
      author: { id: 'u2', name: 'Frank IT', role: 'IT_STAFF' } }
  ],
  internalNotes: [
    { id: 'n1', content: 'Root cause: DNS misconfiguration.', createdAt: '2026-09-01T11:30:00Z',
      author: { id: 'u2', name: 'Frank IT', role: 'IT_STAFF' } }
  ],
  attachments: [
    { id: 'a1', filename: 'screenshot.png', mimetype: 'image/png', size: 45678, createdAt: '2026-09-01T10:30:00Z' }
  ],
}

import { vi } from 'vitest'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <MemoryRouter initialEntries={['/staff/tickets/t1']}>
      <Routes>
        <Route path="/staff/tickets/:id" element={children} />
      </Routes>
    </MemoryRouter>
  </AuthProvider>
)

describe('StaffTicketDetailPage', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  it('renders all ticket detail sections', async () => {
    (global.fetch as any).mockResolvedValue({ ok: true, status: 200, json: async () => mockTicket })
    render(<StaffTicketDetailPage />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('TKT-001 — VPN not working')).toBeInTheDocument()
      expect(screen.getByText(/Alice Requester/i)).toBeInTheDocument()
      expect(screen.getByText('💬 Public Comments')).toBeInTheDocument()
      expect(screen.getByText('🔒 Internal Notes')).toBeInTheDocument()
      expect(screen.getByText('Attachments (1)')).toBeInTheDocument()
      expect(screen.getByText('Looking into it.')).toBeInTheDocument()
      expect(screen.getByText('Root cause: DNS misconfiguration.')).toBeInTheDocument()
      expect(screen.getByText('screenshot.png')).toBeInTheDocument()
    })
  })

  it('renders Comments and Notes in visually distinct sections', async () => {
    (global.fetch as any).mockResolvedValue({ ok: true, status: 200, json: async () => mockTicket })
    render(<StaffTicketDetailPage />, { wrapper })

    await waitFor(() => {
      const commentPane = document.querySelector('.public-comments-pane')
      const notesPane   = document.querySelector('.internal-notes-pane')
      expect(commentPane).toBeTruthy()
      expect(notesPane).toBeTruthy()
      expect(commentPane).not.toBe(notesPane)
    })
  })

  it('shows inline error for empty Internal Note (does not submit)', async () => {
    (global.fetch as any).mockResolvedValue({ ok: true, status: 200, json: async () => mockTicket })
    render(<StaffTicketDetailPage />, { wrapper })

    await waitFor(() => screen.getByLabelText(/add an internal note/i))
    const submitBtn = screen.getByRole('button', { name: /add note/i })
    expect(submitBtn).toBeDisabled()
  })

  it('shows resolved flag indicator when problemAppearsResolved is true', async () => {
    const resolvedFlagTicket = { ...mockTicket, problemAppearsResolved: true }
    ;(global.fetch as any).mockResolvedValue({ ok: true, status: 200, json: async () => resolvedFlagTicket })
    render(<StaffTicketDetailPage />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText(/requester has indicated.*appears resolved/i)).toBeInTheDocument()
    })
  })

  it('does NOT show resolved indicator when problemAppearsResolved is false', async () => {
    (global.fetch as any).mockResolvedValue({ ok: true, status: 200, json: async () => mockTicket })
    render(<StaffTicketDetailPage />, { wrapper })

    await waitFor(() => screen.getByText('TKT-001 — VPN not working'))
    expect(screen.queryByText(/requester has indicated/i)).not.toBeInTheDocument()
  })

  it('lists attachments with download links', async () => {
    (global.fetch as any).mockResolvedValue({ ok: true, status: 200, json: async () => mockTicket })
    render(<StaffTicketDetailPage />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('screenshot.png')).toBeInTheDocument()
      const downloadLink = screen.getByRole('link', { name: /download/i })
      expect(downloadLink).toHaveAttribute('download', 'screenshot.png')
    })
  })

  it('renders only permitted status transitions in the status dropdown', async () => {
    (global.fetch as any).mockResolvedValue({ ok: true, status: 200, json: async () => mockTicket })
    render(<StaffTicketDetailPage />, { wrapper })

    await waitFor(() => {
      const statusSelect = screen.getByLabelText(/update status/i)
      const options = Array.from(statusSelect.querySelectorAll('option')).map(o => (o as HTMLOptionElement).value)
      expect(options).toContain('WAITING_FOR_REQUESTER')
      expect(options).toContain('RESOLVED')
      expect(options).toContain('CANCELLED')
      expect(options).not.toContain('NEW')
      expect(options).not.toContain('OPEN')
    })
  })
})
