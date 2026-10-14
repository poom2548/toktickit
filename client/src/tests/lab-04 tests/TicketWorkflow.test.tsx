import React from 'react'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Helper to lazily load the workflow controls component under test
async function loadTicketWorkflowControls() {
  try {
    const path = '../../components/workflow/TicketWorkflowControls';
    const mod = await import(/* @vite-ignore */ path)
    return mod.TicketWorkflowControls || mod.default
  } catch (err: any) {
    if (err.message && err.message.includes('Cannot find module')) {
      throw new Error('Component not implemented: TicketWorkflowControls')
    }
    throw err
  }
}

const mockTicket = {
  id: 42,
  ticketNumber: 'TKT-0042',
  status: 'IN_PROGRESS',
  version: 2,
  summary: 'Network printer unreachable',
  requesterMarkedResolvedAt: null,
  problemAppearsResolved: false,
  owner: { id: 'u2', name: 'Frank IT', role: 'IT_STAFF' },
}

const mockAdminUsers = {
  users: [
    { id: 'u1', name: 'Alice Requester', email: 'alice@toktick.dev', role: 'REQUESTER', isActive: true },
    { id: 'u2', name: 'Frank IT', email: 'frank@toktick.dev', role: 'IT_STAFF', isActive: true },
    { id: 'u3', name: 'Grace Admin', email: 'grace@toktick.dev', role: 'ADMINISTRATOR', isActive: true },
    { id: 'u4', name: 'Ivy Inactive', email: 'ivy@toktick.dev', role: 'IT_STAFF', isActive: false },
    { id: 'u5', name: 'Inactive Admin', email: 'inadmin@toktick.dev', role: 'ADMINISTRATOR', isActive: false },
  ],
}

describe('TicketWorkflow', () => {
  let fetchMock: any

  beforeEach(() => {
    fetchMock = vi.fn()
    global.fetch = fetchMock
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('UI-10: TicketWorkflow allowed transitions', async () => {
    const Component = await loadTicketWorkflowControls()

    // 1. Unusually restricted transition list (proves no hardcoded matrix in client)
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/allowed-transitions')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            currentStatus: 'IN_PROGRESS',
            version: 2,
            allowedTransitions: ['CANCELLED'], // ONLY CANCELLED returned
          }),
        }
      }
      return { ok: false, status: 404, json: async () => ({ error: 'Not found' }) }
    })

    const { rerender } = render(
      <Component
        ticket={mockTicket}
        currentUser={{ id: 'u2', name: 'Frank IT', role: 'IT_STAFF' }}
        onTicketUpdate={vi.fn()}
      />
    )

    // Wait for allowed transitions to load
    await waitFor(() => {
      expect(screen.getByLabelText(/update status/i)).toBeInTheDocument()
    })

    const select = screen.getByLabelText(/update status/i) as HTMLSelectElement
    const options = Array.from(select.querySelectorAll('option')).map((o) => (o as HTMLOptionElement).value)

    // It MUST contain ONLY CANCELLED and the current status
    expect(options).toContain('CANCELLED')
    expect(options).not.toContain('WAITING_FOR_REQUESTER')
    expect(options).not.toContain('RESOLVED')
    expect(options).not.toContain('OPEN')

    // 2. Terminal state (empty transitions list)
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/allowed-transitions')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            currentStatus: 'CLOSED',
            version: 3,
            allowedTransitions: [],
          }),
        }
      }
      return { ok: false, status: 404, json: async () => ({ error: 'Not found' }) }
    })

    rerender(
      <Component
        ticket={{ ...mockTicket, status: 'CLOSED', version: 3 }}
        currentUser={{ id: 'u2', name: 'Frank IT', role: 'IT_STAFF' }}
        onTicketUpdate={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/terminal state|ไม่สามารถเปลี่ยนสถานะได้/i)).toBeInTheDocument()
    })
    expect(screen.queryByLabelText(/update status/i)).not.toBeInTheDocument()

    // 3. Error state with safe retry button
    fetchMock.mockImplementation(async () => {
      return { ok: false, status: 500, json: async () => ({ error: { code: 'INTERNAL_ERROR', message: 'crash' } }) }
    })

    rerender(
      <Component
        ticket={{ ...mockTicket, id: 999 }}
        currentUser={{ id: 'u2', name: 'Frank IT', role: 'IT_STAFF' }}
        onTicketUpdate={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /ลองใหม่|retry/i })).toBeInTheDocument()
  })

  it('UI-11: TicketWorkflow stale versions and errors', async () => {
    const Component = await loadTicketWorkflowControls()
    const handleTicketUpdate = vi.fn()

    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/allowed-transitions')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            currentStatus: 'IN_PROGRESS',
            version: 2,
            allowedTransitions: ['WAITING_FOR_REQUESTER', 'RESOLVED', 'CANCELLED'],
          }),
        }
      }
      return { ok: false, status: 404, json: async () => ({ error: 'Not found' }) }
    })

    const { rerender } = render(
      <Component
        ticket={mockTicket}
        currentUser={{ id: 'u2', name: 'Frank IT', role: 'IT_STAFF' }}
        onTicketUpdate={handleTicketUpdate}
      />
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/update status/i)).toBeInTheDocument()
    })

    const select = screen.getByLabelText(/update status/i)
    const updateBtn = screen.getByRole('button', { name: /update status/i })

    // 1. Simulate 422 RESOLUTION_GATE_FAILED
    fetchMock.mockImplementation(async (url: string, opts: any) => {
      if (opts?.method === 'POST' && url.includes('/status')) {
        const body = JSON.parse(opts.body)
        expect(body.version).toBe(2)
        expect(opts.headers['Idempotency-Key']).toBeTruthy()
        return {
          ok: false,
          status: 422,
          json: async () => ({
            error: {
              code: 'RESOLUTION_GATE_FAILED',
              message: 'Resolution gate failed.',
              reason: 'Must have at least one Action Taken with a result.',
            },
          }),
        }
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ currentStatus: 'IN_PROGRESS', version: 2, allowedTransitions: ['RESOLVED'] }),
      }
    })

    fireEvent.change(select, { target: { value: 'RESOLVED' } })
    fireEvent.click(updateBtn)

    await waitFor(() => {
      const alert = screen.getByRole('alert')
      expect(alert).toHaveTextContent(/must have at least one action taken with a result/i)
    })
    // Status is unchanged
    expect(handleTicketUpdate).not.toHaveBeenCalled()

    // 2. Simulate 409 CONFLICT (stale version) with "โหลดซ้ำ" button
    fetchMock.mockImplementation(async (url: string, opts: any) => {
      if (opts?.method === 'POST' && url.includes('/status')) {
        return {
          ok: false,
          status: 409,
          json: async () => ({
            error: {
              code: 'CONFLICT',
              message: 'The ticket was modified by another user.',
              currentVersion: 3,
            },
          }),
        }
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ currentStatus: 'IN_PROGRESS', version: 2, allowedTransitions: ['RESOLVED'] }),
      }
    })

    fireEvent.click(updateBtn)

    await waitFor(() => {
      const alert = screen.getByRole('alert')
      expect(alert).toHaveTextContent(/ตั๋วถูกอัปเดตโดยผู้อื่น|modified by another user/i)
      expect(within(alert).getByRole('button', { name: /โหลดซ้ำ/i })).toBeInTheDocument()
    })

    // 3. Requester View & Advisory indication
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/allowed-transitions')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            currentStatus: 'OPEN',
            version: 2,
            allowedTransitions: ['CANCELLED'],
          }),
        }
      }
      return { ok: false, status: 404, json: async () => ({ error: 'Not found' }) }
    })

    rerender(
      <Component
        ticket={{ ...mockTicket, status: 'OPEN', version: 2, problemAppearsResolved: false }}
        currentUser={{ id: 'u1', name: 'Alice Requester', role: 'REQUESTER' }}
        onTicketUpdate={handleTicketUpdate}
      />
    )

    // Requester sees advisory button "ทำเครื่องหมายว่าปัญหาดูเหมือนจะได้รับการแก้ไขแล้ว"
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /ทำเครื่องหมายว่าปัญหาดูเหมือนจะได้รับการแก้ไขแล้ว|appears resolved/i })).toBeInTheDocument()
    })

    // Click advisory button
    fetchMock.mockImplementation(async (url: string, opts: any) => {
      if (url.includes('/requester-resolved-indication')) {
        expect(opts.headers['Idempotency-Key']).toBeTruthy()
        const body = JSON.parse(opts.body)
        expect(body.problemAppearsResolved).toBe(true)
        return {
          ok: true,
          status: 200,
          json: async () => ({
            id: 42,
            ticketNumber: 'TKT-0042',
            status: 'OPEN',
            version: 2, // version DOES NOT increment
            problemAppearsResolved: true,
            requesterMarkedResolvedAt: new Date().toISOString(),
          }),
        }
      }
      return { ok: true, status: 200, json: async () => ({ currentStatus: 'OPEN', version: 2, allowedTransitions: [] }) }
    })

    const advisoryBtn = screen.getByRole('button', { name: /ทำเครื่องหมายว่าปัญหาดูเหมือนจะได้รับการแก้ไขแล้ว|appears resolved/i })
    fireEvent.click(advisoryBtn)

    await waitFor(() => {
      expect(handleTicketUpdate).toHaveBeenCalledWith(expect.objectContaining({ problemAppearsResolved: true }))
    })

    // Staff sees advisory banner when requesterMarkedResolvedAt / problemAppearsResolved is set
    rerender(
      <Component
        ticket={{ ...mockTicket, problemAppearsResolved: true, requesterMarkedResolvedAt: '2026-10-04T08:00:00Z' }}
        currentUser={{ id: 'u2', name: 'Frank IT', role: 'IT_STAFF' }}
        onTicketUpdate={handleTicketUpdate}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/ผู้ร้องขอได้ทำเครื่องหมายว่าแก้ไขแล้ว/i)).toBeInTheDocument()
    })
  })

  it('UI-12: TicketWorkflow assignment and staff', async () => {
    const Component = await loadTicketWorkflowControls()
    const handleTicketUpdate = vi.fn()

    // 1. Administrator role: Owner picker lists only active IT Staff and Administrator users
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/allowed-transitions')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ currentStatus: 'IN_PROGRESS', version: 2, allowedTransitions: [] }),
        }
      }
      if (url.includes('/admin/users')) {
        return { ok: true, status: 200, json: async () => mockAdminUsers }
      }
      return { ok: false, status: 404, json: async () => ({ error: 'Not found' }) }
    })

    const { rerender } = render(
      <Component
        ticket={mockTicket}
        currentUser={{ id: 'u3', name: 'Grace Admin', role: 'ADMINISTRATOR' }}
        onTicketUpdate={handleTicketUpdate}
      />
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/ticket owner|ผู้รับผิดชอบ/i)).toBeInTheDocument()
    })

    const ownerSelect = screen.getByLabelText(/ticket owner|ผู้รับผิดชอบ/i) as HTMLSelectElement
    const ownerOptions = Array.from(ownerSelect.querySelectorAll('option')).map((o) => (o as HTMLOptionElement).text)

    // MUST contain Frank IT (IT_STAFF active) and Grace Admin (ADMINISTRATOR active)
    expect(ownerOptions.some((t) => t.includes('Frank IT'))).toBe(true)
    expect(ownerOptions.some((t) => t.includes('Grace Admin'))).toBe(true)

    // MUST NOT contain Alice Requester (REQUESTER) or Ivy Inactive / Inactive Admin (isActive: false)
    expect(ownerOptions.some((t) => t.includes('Alice Requester'))).toBe(false)
    expect(ownerOptions.some((t) => t.includes('Ivy Inactive'))).toBe(false)
    expect(ownerOptions.some((t) => t.includes('Inactive Admin'))).toBe(false)

    // Selecting an owner sends PATCH with current version
    fetchMock.mockImplementation(async (url: string, opts: any) => {
      if (opts?.method === 'PATCH' && url.includes('/owner')) {
        const body = JSON.parse(opts.body)
        expect(body.version).toBe(2)
        expect(body.ownerId).toBe('u3')
        return {
          ok: true,
          status: 200,
          json: async () => ({
            id: 42,
            version: 3,
            owner: { id: 'u3', name: 'Grace Admin', role: 'ADMINISTRATOR' },
          }),
        }
      }
      return { ok: true, status: 200, json: async () => mockAdminUsers }
    })

    fireEvent.change(ownerSelect, { target: { value: 'u3' } })
    const saveOwnerBtn = screen.getByRole('button', { name: /save owner|บันทึกผู้รับผิดชอบ|assign/i })
    fireEvent.click(saveOwnerBtn)

    await waitFor(() => {
      expect(handleTicketUpdate).toHaveBeenCalledWith(expect.objectContaining({ version: 3 }))
    })

    // 2. IT Staff role: Dropdown picker is NOT rendered; Claim / Unassign controls are rendered
    rerender(
      <Component
        ticket={{ ...mockTicket, owner: null }} // Unassigned ticket
        currentUser={{ id: 'u2', name: 'Frank IT', role: 'IT_STAFF' }}
        onTicketUpdate={handleTicketUpdate}
      />
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /claim/i })).toBeInTheDocument()
    })
    // IT Staff does not have full dropdown picker (documented limitation)
    expect(screen.queryByRole('combobox', { name: /ticket owner/i })).not.toBeInTheDocument()

    // 3. Requester role: Never sees owner picker or Claim buttons
    rerender(
      <Component
        ticket={mockTicket}
        currentUser={{ id: 'u1', name: 'Alice Requester', role: 'REQUESTER' }}
        onTicketUpdate={handleTicketUpdate}
      />
    )

    expect(screen.queryByRole('combobox', { name: /ticket owner/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /claim/i })).not.toBeInTheDocument()
  })

  it('UI-14: TicketWorkflow form state retention', async () => {
    const Component = await loadTicketWorkflowControls()

    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/allowed-transitions')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            currentStatus: 'IN_PROGRESS',
            version: 2,
            allowedTransitions: ['WAITING_FOR_REQUESTER', 'CANCELLED'],
          }),
        }
      }
      if (url.includes('/admin/users')) {
        return { ok: true, status: 200, json: async () => mockAdminUsers }
      }
      return { ok: false, status: 404, json: async () => ({ error: 'Not found' }) }
    })

    render(
      <Component
        ticket={mockTicket}
        currentUser={{ id: 'u3', name: 'Grace Admin', role: 'ADMINISTRATOR' }}
        onTicketUpdate={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/update status/i)).toBeInTheDocument()
    })

    const select = screen.getByLabelText(/update status/i) as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'WAITING_FOR_REQUESTER' } })
    expect(select.value).toBe('WAITING_FOR_REQUESTER')

    // Simulate network error on submit
    fetchMock.mockImplementation(async (url: string, opts: any) => {
      if (opts?.method === 'POST' && url.includes('/status')) {
        throw new Error('Failed to fetch')
      }
      return { ok: true, status: 200, json: async () => ({}) }
    })

    const updateBtn = screen.getByRole('button', { name: /update status/i })
    fireEvent.click(updateBtn)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    // Selected status is retained in the form after recoverable failure
    expect(select.value).toBe('WAITING_FOR_REQUESTER')
  })

  it('STY-01: TicketWorkflow status color and style', async () => {
    const Component = await loadTicketWorkflowControls()

    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/allowed-transitions')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            currentStatus: 'IN_PROGRESS',
            version: 2,
            allowedTransitions: ['RESOLVED'],
          }),
        }
      }
      return { ok: false, status: 404, json: async () => ({ error: 'Not found' }) }
    })

    render(
      <Component
        ticket={mockTicket}
        currentUser={{ id: 'u2', name: 'Frank IT', role: 'IT_STAFF' }}
        onTicketUpdate={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/update status/i)).toBeInTheDocument()
    })

    // Verify status badge renders text and not just color
    const badge = screen.getByText(/in progress/i)
    expect(badge).toBeInTheDocument()
  })
})
