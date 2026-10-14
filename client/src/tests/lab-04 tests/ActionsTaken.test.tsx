import React from 'react'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Helper to lazily load the component under test
async function loadActionsTakenSection() {
  try {
    const path = '../../components/actions/ActionsTakenSection';
    const mod = await import(/* @vite-ignore */ path)
    return mod.ActionsTakenSection || mod.default
  } catch (err: any) {
    if (err.message && err.message.includes('Cannot find module')) {
      throw new Error('Component not implemented: ActionsTakenSection')
    }
    throw err
  }
}

const mockTicket = {
  id: 42,
  ticketNumber: 'TKT-0042',
  status: 'IN_PROGRESS',
  version: 2,
  summary: 'Network outage in office',
}

const mockActions = [
  {
    id: 'act-1',
    actionAt: '2026-10-03T03:00:00.000Z', // 10:00 Asia/Bangkok
    description: 'Checked router hardware and cables',
    result: 'Cables seated properly; rebooted switch',
    performedBy: { id: 'u2', name: 'Frank IT' },
    followUpRequired: true,
    followUpNote: 'Monitor interface errors for 2 hours',
    attachmentNotes: 'See router_syslog.txt',
    version: 1,
    createdAt: '2026-10-03T03:05:00.000Z',
  },
  {
    id: 'act-2',
    actionAt: '2026-10-03T04:30:00.000Z', // 11:30 Asia/Bangkok
    description: 'Verified gateway route table',
    result: 'Default gateway restored',
    performedBy: { id: 'u3', name: 'Grace Admin' },
    followUpRequired: false,
    followUpNote: null,
    attachmentNotes: null,
    version: 1,
    createdAt: '2026-10-03T04:35:00.000Z',
  },
]

describe('ActionsTaken', () => {
  let fetchMock: any

  beforeEach(() => {
    fetchMock = vi.fn()
    global.fetch = fetchMock
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('UI-05: ActionsTaken legacy tickets view', async () => {
    const Component = await loadActionsTakenSection()

    // Mock API returning the two actions in stable order
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/actions-taken')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ actions: mockActions }),
        }
      }
      return { ok: false, status: 404, json: async () => ({ error: 'Not found' }) }
    })

    const { rerender } = render(
      <Component
        ticketId={42}
        ticketStatus="IN_PROGRESS"
        ticketVersion={2}
        isStaff={true}
        currentUser={{ id: 'u2', name: 'Frank IT', role: 'IT_STAFF' }}
      />
    )

    // Verify loading state is shown initially
    expect(screen.getByRole('status', { name: /กำลังโหลด|loading/i }) || screen.getByText(/กำลังโหลด/i)).toBeInTheDocument()

    // Wait for list to render
    await waitFor(() => {
      expect(screen.getByText('Checked router hardware and cables')).toBeInTheDocument()
    })

    // Verify columns / fields:
    // 1. Date/Time displayed in Asia/Bangkok
    expect(screen.getByText(/10:00/)).toBeInTheDocument()
    expect(screen.getByText(/11:30/)).toBeInTheDocument()

    // 2. Results rendered
    expect(screen.getByText('Cables seated properly; rebooted switch')).toBeInTheDocument()
    expect(screen.getByText('Default gateway restored')).toBeInTheDocument()

    // 3. Performed by
    expect(screen.getByText(/Frank IT/)).toBeInTheDocument()
    expect(screen.getByText(/Grace Admin/)).toBeInTheDocument()

    // 4. Follow-up indicator uses text AND an icon (not color alone), plus follow-up note
    const followUpBadge = screen.getByText(/ต้องการติดตามผล/i)
    expect(followUpBadge).toBeInTheDocument()
    expect(screen.getByText('Monitor interface errors for 2 hours')).toBeInTheDocument()

    // 5. Attachment Notes
    expect(screen.getByText('See router_syslog.txt')).toBeInTheDocument()

    // 6. Semantic table: <caption> and <th scope="col">
    const table = screen.getByRole('table')
    expect(table).toBeInTheDocument()
    expect(table.querySelector('caption')).toBeTruthy()
    const colHeaders = table.querySelectorAll('th[scope="col"]')
    expect(colHeaders.length).toBeGreaterThanOrEqual(4)

    // 7. Empty list test (e.g. legacy ticket with 0 actions)
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/actions-taken')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ actions: [] }),
        }
      }
      return { ok: false, status: 404, json: async () => ({ error: 'Not found' }) }
    })

    rerender(
      <Component
        ticketId={99}
        ticketStatus="OPEN"
        ticketVersion={1}
        isStaff={true}
        currentUser={{ id: 'u2', name: 'Frank IT', role: 'IT_STAFF' }}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('ยังไม่มีประวัติการดำเนินงาน')).toBeInTheDocument()
    })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    // 8. Safe-failure state with retry button when list request fails
    fetchMock.mockImplementation(async () => {
      return { ok: false, status: 500, json: async () => ({ error: { code: 'INTERNAL_ERROR', message: 'DB down' } }) }
    })

    rerender(
      <Component
        ticketId={100}
        ticketStatus="OPEN"
        ticketVersion={1}
        isStaff={true}
        currentUser={{ id: 'u2', name: 'Frank IT', role: 'IT_STAFF' }}
      />
    )

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
    // No raw error text or stack trace
    expect(screen.queryByText(/DB down/i)).not.toBeInTheDocument()
    const retryBtn = screen.getByRole('button', { name: /ลองใหม่|retry/i })
    expect(retryBtn).toBeInTheDocument()
  })

  it('UI-06: ActionsTaken validation and retention', async () => {
    const Component = await loadActionsTakenSection()

    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/actions-taken')) {
        return { ok: true, status: 200, json: async () => ({ actions: [] }) }
      }
      return { ok: false, status: 404, json: async () => ({ error: 'Not found' }) }
    })

    render(
      <Component
        ticketId={42}
        ticketStatus="IN_PROGRESS"
        ticketVersion={2}
        isStaff={true}
        currentUser={{ id: 'u2', name: 'Frank IT', role: 'IT_STAFF' }}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('ยังไม่มีประวัติการดำเนินงาน')).toBeInTheDocument()
    })

    // Click "เพิ่ม Action" to open the inline form
    const addBtn = screen.getByRole('button', { name: /เพิ่ม action/i })
    fireEvent.click(addBtn)

    // Form opens inline above list (no modal dialog)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    const descInput = screen.getByLabelText(/คำอธิบาย|description/i)
    const resultInput = screen.getByLabelText(/ผลลัพธ์|result/i)
    const followUpToggle = screen.getByLabelText(/ต้องการติดตามผล/i)
    const submitBtn = screen.getByRole('button', { name: /บันทึก/i })

    // Date/time defaults to now (Asia/Bangkok)
    const dateInput = screen.getByLabelText(/วันที่\/เวลา|action date/i) as HTMLInputElement
    expect(dateInput.value).toBeTruthy()

    // Performed by is not an editable input, but shown read-only / automatic
    expect(screen.queryByRole('textbox', { name: /ผู้ดำเนินการ/i })).not.toBeInTheDocument()
    expect(screen.getByText(/Frank IT/)).toBeInTheDocument()

    // Submit with empty required fields -> client validation messages
    fireEvent.click(submitBtn)

    expect(screen.getByText(/กรุณาระบุคำอธิบาย|description is required/i)).toBeInTheDocument()
    expect(screen.getByText(/กรุณาระบุผลลัพธ์|result is required/i)).toBeInTheDocument()
    expect(descInput).toHaveAttribute('aria-describedby')

    // Turning on "ต้องการติดตามผล" reveals follow-up note and makes it required
    fireEvent.click(followUpToggle)
    const followUpNoteInput = screen.getByLabelText(/บันทึกการติดตามผล/i)
    expect(followUpNoteInput).toBeInTheDocument()

    // Fill description and result, but leave followUpNote empty
    fireEvent.change(descInput, { target: { value: 'Diagnosed motherboard issue' } })
    fireEvent.change(resultInput, { target: { value: 'Replaced faulty RAM module' } })
    fireEvent.click(submitBtn)

    expect(screen.getByText(/กรุณาระบุบันทึกการติดตามผล|follow-up note is required/i)).toBeInTheDocument()

    // Turning off "ต้องการติดตามผล" hides the follow-up note
    fireEvent.click(followUpToggle)
    expect(screen.queryByLabelText(/บันทึกการติดตามผล/i)).not.toBeInTheDocument()

    // Enforce length limits (2000 chars)
    fireEvent.change(descInput, { target: { value: 'A'.repeat(2001) } })
    expect(screen.getByText(/ความยาวเกิน|exceeds/i)).toBeInTheDocument()
    fireEvent.change(descInput, { target: { value: 'Diagnosed motherboard issue' } })

    // Simulate server 422 with fields mapping
    fetchMock.mockImplementation(async (url: string, opts: any) => {
      if (opts?.method === 'POST') {
        return {
          ok: false,
          status: 422,
          json: async () => ({
            error: {
              code: 'VALIDATION_FAILED',
              message: 'The provided data is invalid.',
              fields: { result: 'Invalid result format' },
            },
          }),
        }
      }
      return { ok: true, status: 200, json: async () => ({ actions: [] }) }
    })

    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText(/invalid result format/i)).toBeInTheDocument()
    })
    // Typed values are preserved after 422 failure
    expect((descInput as HTMLInputElement).value).toBe('Diagnosed motherboard issue')
    expect((resultInput as HTMLInputElement).value).toBe('Replaced faulty RAM module')

    // Simulate successful save
    fetchMock.mockImplementation(async (url: string, opts: any) => {
      if (opts?.method === 'POST') {
        const body = JSON.parse(opts.body)
        expect(body).toHaveProperty('description')
        expect(body).toHaveProperty('result')
        expect(body).toHaveProperty('actionAt')
        expect(body.followUpNote).toBeNull() // followUpRequired was false
        expect(body).not.toHaveProperty('performedBy')
        expect(body).not.toHaveProperty('ticketId')
        return {
          ok: true,
          status: 201,
          json: async () => ({
            id: 'act-new',
            ...body,
            performedBy: { id: 'u2', name: 'Frank IT' },
            version: 1,
            createdAt: new Date().toISOString(),
          }),
        }
      }
      return { ok: true, status: 200, json: async () => ({ actions: [] }) }
    })

    fireEvent.click(submitBtn)

    // On success: form closes and role="status" message "บันทึก Action สำเร็จ" is announced
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/บันทึก action สำเร็จ/i)
    })
    expect(screen.queryByLabelText(/คำอธิบาย|description/i)).not.toBeInTheDocument()
  })

  it('UI-07: ActionsTaken update and stale versions', async () => {
    const Component = await loadActionsTakenSection()

    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/actions-taken')) {
        return { ok: true, status: 200, json: async () => ({ actions: mockActions }) }
      }
      return { ok: false, status: 404, json: async () => ({ error: 'Not found' }) }
    })

    const { rerender } = render(
      <Component
        ticketId={42}
        ticketStatus="IN_PROGRESS"
        ticketVersion={2}
        isStaff={true}
        currentUser={{ id: 'u2', name: 'Frank IT', role: 'IT_STAFF' }}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Checked router hardware and cables')).toBeInTheDocument()
    })

    // Each row has an explicit "แก้ไข" button with accessible label
    const editBtns = screen.getAllByRole('button', { name: /แก้ไข/i })
    expect(editBtns.length).toBe(2)
    expect(editBtns[0]).toHaveAttribute('aria-label')

    // Click edit on the first action -> form opens prefilled
    fireEvent.click(editBtns[0])

    const descInput = screen.getByLabelText(/คำอธิบาย|description/i) as HTMLInputElement
    expect(descInput.value).toBe('Checked router hardware and cables')

    // Edit description
    fireEvent.change(descInput, { target: { value: 'Updated description from tech' } })

    // Simulate 409 CONFLICT (stale version)
    fetchMock.mockImplementation(async (url: string, opts: any) => {
      if (opts?.method === 'PATCH') {
        const body = JSON.parse(opts.body)
        expect(body.version).toBe(1)
        return {
          ok: false,
          status: 409,
          json: async () => ({
            error: {
              code: 'CONFLICT',
              message: 'The action was modified by another user.',
              currentVersion: 2,
            },
          }),
        }
      }
      return { ok: true, status: 200, json: async () => ({ actions: mockActions }) }
    })

    const saveBtn = screen.getByRole('button', { name: /บันทึก/i })
    fireEvent.click(saveBtn)

    // Shows role="alert" banner "รายการถูกแก้ไขโดยผู้อื่น" with "โหลดซ้ำ" action
    await waitFor(() => {
      const banner = screen.getByRole('alert')
      expect(banner).toHaveTextContent(/รายการถูกแก้ไขโดยผู้อื่น|ตั๋วถูกอัปเดตโดยผู้อื่น/i)
      expect(within(banner).getByRole('button', { name: /โหลดซ้ำ/i })).toBeInTheDocument()
    })

    // Typed text is kept available in the form
    expect(descInput.value).toBe('Updated description from tech')

    // Simulate 409 TICKET_LOCKED
    fetchMock.mockImplementation(async (url: string, opts: any) => {
      if (opts?.method === 'PATCH') {
        return {
          ok: false,
          status: 409,
          json: async () => ({
            error: { code: 'TICKET_LOCKED', message: 'Ticket is closed.' },
          }),
        }
      }
      return { ok: true, status: 200, json: async () => ({ actions: mockActions }) }
    })

    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/ticket is locked|closed/i)
    })
    // Form is closed/removed on TICKET_LOCKED
    expect(screen.queryByLabelText(/คำอธิบาย|description/i)).not.toBeInTheDocument()
  })

  it('UI-08: ActionsTaken role view rules', async () => {
    const Component = await loadActionsTakenSection()

    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/actions-taken')) {
        return { ok: true, status: 200, json: async () => ({ actions: mockActions }) }
      }
      return { ok: false, status: 404, json: async () => ({ error: 'Not found' }) }
    })

    const { rerender } = render(
      <Component
        ticketId={42}
        ticketStatus="IN_PROGRESS"
        ticketVersion={2}
        isStaff={false} // Requester view
        currentUser={{ id: 'u1', name: 'Alice Requester', role: 'REQUESTER' }}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Checked router hardware and cables')).toBeInTheDocument()
    })

    // Requester sees ALL actions including follow-up notes and attachment notes
    expect(screen.getByText('Monitor interface errors for 2 hours')).toBeInTheDocument()
    expect(screen.getByText('See router_syslog.txt')).toBeInTheDocument()

    // Requester has NO "เพิ่ม Action" button, no form, no "แก้ไข" button in DOM
    expect(screen.queryByRole('button', { name: /เพิ่ม action/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /แก้ไข/i })).not.toBeInTheDocument()

    // 403 Forbidden handling
    fetchMock.mockImplementation(async () => {
      return { ok: false, status: 403, json: async () => ({ error: { code: 'FORBIDDEN', message: 'Access denied' } }) }
    })

    rerender(
      <Component
        ticketId={999}
        ticketStatus="IN_PROGRESS"
        ticketVersion={1}
        isStaff={false}
        currentUser={{ id: 'u1', name: 'Alice Requester', role: 'REQUESTER' }}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/ไม่มีสิทธิ์|access denied/i)).toBeInTheDocument()
    })
  })

  it('UI-09: ActionsTaken duplicate submission check', async () => {
    const Component = await loadActionsTakenSection()

    let postCount = 0
    let capturedHeaders: any[] = []
    let resolvePost: any

    fetchMock.mockImplementation(async (url: string, opts: any) => {
      if (opts?.method === 'POST') {
        postCount++
        capturedHeaders.push(opts.headers)
        return new Promise((resolve) => {
          resolvePost = () => resolve({
            ok: true,
            status: 201,
            json: async () => ({
              id: 'act-dup-1',
              actionAt: new Date().toISOString(),
              description: 'Duplicate test',
              result: 'Success',
              performedBy: { id: 'u2', name: 'Frank IT' },
              version: 1,
            }),
          })
        })
      }
      return { ok: true, status: 200, json: async () => ({ actions: [] }) }
    })

    render(
      <Component
        ticketId={42}
        ticketStatus="IN_PROGRESS"
        ticketVersion={2}
        isStaff={true}
        currentUser={{ id: 'u2', name: 'Frank IT', role: 'IT_STAFF' }}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('ยังไม่มีประวัติการดำเนินงาน')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /เพิ่ม action/i }))
    fireEvent.change(screen.getByLabelText(/คำอธิบาย|description/i), { target: { value: 'Duplicate test' } })
    fireEvent.change(screen.getByLabelText(/ผลลัพธ์|result/i), { target: { value: 'Success' } })

    const submitBtn = screen.getByRole('button', { name: /บันทึก/i })

    // First click triggers POST
    fireEvent.click(submitBtn)
    expect(postCount).toBe(1)

    // Button disabled with spinner while pending
    expect(submitBtn).toBeDisabled()

    // Rapid second click does not send another request
    fireEvent.click(submitBtn)
    expect(postCount).toBe(1)

    // Check Idempotency-Key header is present
    const firstKey = capturedHeaders[0]['Idempotency-Key']
    expect(firstKey).toBeTruthy()

    // Complete the first request
    resolvePost()

    await waitFor(() => {
      expect(screen.queryByLabelText(/คำอธิบาย|description/i)).not.toBeInTheDocument()
    })
  })
})
