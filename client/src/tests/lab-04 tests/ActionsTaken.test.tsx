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

  // ---------------------------------------------------------------------
  // Strengthened coverage: length limits, accessible names, key reuse
  // ---------------------------------------------------------------------
  const staffProps = {
    ticketId: 42,
    ticketStatus: 'IN_PROGRESS',
    ticketVersion: 2,
    isStaff: true,
    currentUser: { id: 'u2', name: 'Frank IT', role: 'IT_STAFF' },
  }

  function installApi(
    actions: any[],
    handlers: { post?: (o: any, n: number) => any; patch?: (o: any, n: number) => any } = {}
  ) {
    const calls = { posts: [] as any[], patches: [] as any[] }
    fetchMock.mockImplementation(async (_url: string, opts: any) => {
      const method = opts?.method || 'GET'
      if (method === 'POST') {
        calls.posts.push(opts)
        const r = handlers.post ? handlers.post(opts, calls.posts.length) : undefined
        if (r instanceof Error) throw r
        return (
          r || {
            ok: true,
            status: 201,
            json: async () => ({ id: 'new', ...JSON.parse(opts.body), performedBy: { id: 'u2', name: 'Frank IT' }, version: 1 }),
          }
        )
      }
      if (method === 'PATCH') {
        calls.patches.push(opts)
        const r = handlers.patch ? handlers.patch(opts, calls.patches.length) : undefined
        if (r instanceof Error) throw r
        return r || { ok: true, status: 200, json: async () => ({ ...actions[0], ...JSON.parse(opts.body) }) }
      }
      return { ok: true, status: 200, json: async () => ({ actions }) }
    })
    return calls
  }

  const LIMIT_CASES = [
    { field: 'description', limit: 2000, label: /คำอธิบาย|description/i },
    { field: 'result', limit: 2000, label: /ผลลัพธ์|result/i },
    { field: 'followUpNote', limit: 1000, label: /บันทึกการติดตามผล/i },
    { field: 'attachmentNotes', limit: 1000, label: /บันทึกไฟล์แนบ|attachment notes/i },
  ]

  async function openCreate(Component: any) {
    const view = render(<Component {...staffProps} />)
    await waitFor(() => expect(screen.getByText('ยังไม่มีประวัติการดำเนินงาน')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /เพิ่ม action/i }))
    fireEvent.change(screen.getByLabelText(/คำอธิบาย|description/i), { target: { value: 'valid description' } })
    fireEvent.change(screen.getByLabelText(/ผลลัพธ์|result/i), { target: { value: 'valid result' } })
    fireEvent.click(screen.getByLabelText(/ต้องการติดตามผล/i))
    fireEvent.change(screen.getByLabelText(/บันทึกการติดตามผล/i), { target: { value: 'valid note' } })
    return view
  }

  it('UI-06: create form accepts exactly the limit and rejects one character over (2000/2000/1000/1000)', async () => {
    const Component = await loadActionsTakenSection()
    for (const c of LIMIT_CASES) {
      // exactly at the limit is accepted
      let calls = installApi([])
      let view = await openCreate(Component)
      fireEvent.change(screen.getByLabelText(c.label), { target: { value: 'A'.repeat(c.limit) } })
      expect(screen.queryByText(new RegExp(`ไม่เกิน ${c.limit} ตัวอักษร`))).not.toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: /บันทึก/i }))
      await waitFor(() => expect(calls.posts.length).toBe(1))
      view.unmount()

      // one character over is rejected, message carries the real number, no request
      calls = installApi([])
      view = await openCreate(Component)
      const input = screen.getByLabelText(c.label)
      fireEvent.change(input, { target: { value: 'A'.repeat(c.limit + 1) } })
      const msg = screen.getByText(new RegExp(`ไม่เกิน ${c.limit} ตัวอักษร`))
      expect(msg).toBeInTheDocument()
      expect(input.getAttribute('aria-describedby') || '').toContain(msg.id)
      fireEvent.click(screen.getByRole('button', { name: /บันทึก/i }))
      expect(calls.posts.length).toBe(0)
      expect(screen.getByText(new RegExp(`ไม่เกิน ${c.limit} ตัวอักษร`))).toBeInTheDocument()
      view.unmount()
    }
  })

  it('UI-06: edit form accepts exactly the limit and rejects one character over (2000/2000/1000/1000)', async () => {
    const Component = await loadActionsTakenSection()
    for (const c of LIMIT_CASES) {
      let calls = installApi(mockActions)
      let view = render(<Component {...staffProps} />)
      await waitFor(() => expect(screen.getByText('Checked router hardware and cables')).toBeInTheDocument())
      fireEvent.click(screen.getAllByRole('button', { name: /แก้ไข/i })[0])
      fireEvent.change(screen.getByLabelText(c.label), { target: { value: 'A'.repeat(c.limit) } })
      fireEvent.click(screen.getByRole('button', { name: /บันทึก/i }))
      await waitFor(() => expect(calls.patches.length).toBe(1))
      view.unmount()

      calls = installApi(mockActions)
      view = render(<Component {...staffProps} />)
      await waitFor(() => expect(screen.getByText('Checked router hardware and cables')).toBeInTheDocument())
      fireEvent.click(screen.getAllByRole('button', { name: /แก้ไข/i })[0])
      const input = screen.getByLabelText(c.label)
      fireEvent.change(input, { target: { value: 'A'.repeat(c.limit + 1) } })
      const msg = screen.getByText(new RegExp(`ไม่เกิน ${c.limit} ตัวอักษร`))
      expect(input.getAttribute('aria-describedby') || '').toContain(msg.id)
      fireEvent.click(screen.getByRole('button', { name: /บันทึก/i }))
      expect(calls.patches.length).toBe(0)
      view.unmount()
    }
  })

  it('UI-07: edit buttons have distinct accessible names that start with the visible label and contain the date/time', async () => {
    const Component = await loadActionsTakenSection()
    installApi(mockActions)
    render(<Component {...staffProps} />)
    await waitFor(() => expect(screen.getByText('Checked router hardware and cables')).toBeInTheDocument())

    const first = screen.getByRole('button', { name: /แก้ไข.*03\/10\/2026, 10:00/ })
    const second = screen.getByRole('button', { name: /แก้ไข.*03\/10\/2026, 11:30/ })
    expect(first).not.toBe(second)
    expect(first.getAttribute('aria-label')!.startsWith('แก้ไข')).toBe(true)
    expect(second.getAttribute('aria-label')!.startsWith('แก้ไข')).toBe(true)
    expect(first.getAttribute('aria-label')).not.toBe(second.getAttribute('aria-label'))
    expect(first).toHaveTextContent(/^แก้ไข$/)
  })

  it('UI-07: edit buttons of actions with the same time are told apart by a truncated description snippet', async () => {
    const Component = await loadActionsTakenSection()
    const long = 'X'.repeat(100)
    const sameTime = [
      { ...mockActions[0], id: 's1', actionAt: '2026-10-03T03:00:00.000Z', description: 'Alpha task' },
      { ...mockActions[1], id: 's2', actionAt: '2026-10-03T03:00:00.000Z', description: long },
    ]
    installApi(sameTime)
    render(<Component {...staffProps} />)
    await waitFor(() => expect(screen.getByText('Alpha task')).toBeInTheDocument())
    const buttons = screen.getAllByRole('button', { name: /แก้ไข/i })
    const labels = buttons.map((b) => b.getAttribute('aria-label')!)
    expect(labels[0]).not.toBe(labels[1])
    expect(labels[0]).toMatch(/03\/10\/2026, 10:00/)
    expect(labels[1]).toMatch(/03\/10\/2026, 10:00/)
    expect(labels[0]).toContain('Alpha task')
    expect(labels[1]).toContain('X'.repeat(40) + '…')
    expect(labels[1]).not.toContain('X'.repeat(41))
  })

  describe('UI-09: idempotency key reuse', () => {
    async function fillAndSubmit(desc = 'Retry me', res = 'Same data') {
      fireEvent.change(screen.getByLabelText(/คำอธิบาย|description/i), { target: { value: desc } })
      fireEvent.change(screen.getByLabelText(/ผลลัพธ์|result/i), { target: { value: res } })
      fireEvent.click(screen.getByRole('button', { name: /บันทึก/i }))
    }
    const keyOf = (calls: any, i: number) => calls.posts[i].headers['Idempotency-Key']
    const serverError = { ok: false, status: 500, json: async () => ({ error: { code: 'INTERNAL_ERROR', message: 'boom' } }) }

    async function openEmpty(Component: any) {
      const view = render(<Component {...staffProps} />)
      await waitFor(() => expect(screen.getByText('ยังไม่มีประวัติการดำเนินงาน')).toBeInTheDocument())
      fireEvent.click(screen.getByRole('button', { name: /เพิ่ม action/i }))
      return view
    }
    async function waitReady(n: number, calls: any) {
      await waitFor(() => expect(calls.posts.length).toBe(n))
      await waitFor(() => expect(screen.getByRole('button', { name: /บันทึก/i })).not.toBeDisabled())
    }

    it('UI-09: a retry after a network failure reuses the same key', async () => {
      const Component = await loadActionsTakenSection()
      const calls = installApi([], { post: (_o, n) => (n === 1 ? new TypeError('Failed to fetch') : undefined) })
      await openEmpty(Component)
      await fillAndSubmit()
      await waitReady(1, calls)
      fireEvent.click(screen.getByRole('button', { name: /บันทึก/i }))
      await waitFor(() => expect(calls.posts.length).toBe(2))
      expect(keyOf(calls, 0)).toBeTruthy()
      expect(keyOf(calls, 1)).toBe(keyOf(calls, 0))
    })

    it('UI-09: a retry after HTTP 500 reuses the same key', async () => {
      const Component = await loadActionsTakenSection()
      const calls = installApi([], { post: (_o, n) => (n === 1 ? serverError : undefined) })
      await openEmpty(Component)
      await fillAndSubmit()
      await waitReady(1, calls)
      fireEvent.click(screen.getByRole('button', { name: /บันทึก/i }))
      await waitFor(() => expect(calls.posts.length).toBe(2))
      expect(keyOf(calls, 1)).toBe(keyOf(calls, 0))
    })

    it('UI-09: editing a field after a failed retry generates a different key', async () => {
      const Component = await loadActionsTakenSection()
      const calls = installApi([], { post: (_o, n) => (n <= 2 ? serverError : undefined) })
      await openEmpty(Component)
      await fillAndSubmit()
      await waitReady(1, calls)
      fireEvent.click(screen.getByRole('button', { name: /บันทึก/i }))
      await waitReady(2, calls)
      expect(keyOf(calls, 1)).toBe(keyOf(calls, 0))
      fireEvent.change(screen.getByLabelText(/คำอธิบาย|description/i), { target: { value: 'Edited description' } })
      fireEvent.click(screen.getByRole('button', { name: /บันทึก/i }))
      await waitFor(() => expect(calls.posts.length).toBe(3))
      expect(keyOf(calls, 2)).toBeTruthy()
      expect(keyOf(calls, 2)).not.toBe(keyOf(calls, 1))
    })

    it('UI-09: a new submission after a success uses a different key', async () => {
      const Component = await loadActionsTakenSection()
      const calls = installApi([])
      await openEmpty(Component)
      await fillAndSubmit()
      await waitFor(() => expect(screen.queryByLabelText(/คำอธิบาย|description/i)).not.toBeInTheDocument())
      fireEvent.click(screen.getByRole('button', { name: /เพิ่ม action/i }))
      await fillAndSubmit('Retry me', 'Same data')
      await waitFor(() => expect(calls.posts.length).toBe(2))
      expect(typeof keyOf(calls, 0)).toBe('string')
      expect(keyOf(calls, 0).length).toBeGreaterThan(0)
      expect(keyOf(calls, 1)).not.toBe(keyOf(calls, 0))
    })

    it('UI-09: a replayed 200 response (Idempotent-Replayed) is treated as success', async () => {
      const Component = await loadActionsTakenSection()
      const calls = installApi([], {
        post: (o) => ({
          ok: true,
          status: 200,
          headers: new Headers({ 'Idempotent-Replayed': 'true' }),
          json: async () => ({ id: 'old', ...JSON.parse(o.body), performedBy: { id: 'u2', name: 'Frank IT' }, version: 1 }),
        }),
      })
      await openEmpty(Component)
      await fillAndSubmit()
      await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/บันทึก action สำเร็จ/i))
      expect(calls.posts.length).toBe(1)
      expect(screen.queryByLabelText(/คำอธิบาย|description/i)).not.toBeInTheDocument()
    })

    it('UI-09: IDEMPOTENCY_KEY_REUSED shows a safe message and the next attempt uses a new key', async () => {
      const Component = await loadActionsTakenSection()
      const reused = { ok: false, status: 422, json: async () => ({ error: { code: 'IDEMPOTENCY_KEY_REUSED', message: 'raw internal text' } }) }
      const calls = installApi([], { post: (_o, n) => (n === 1 ? reused : undefined) })
      await openEmpty(Component)
      await fillAndSubmit()
      await waitReady(1, calls)
      expect(screen.queryByText(/raw internal text/)).not.toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: /บันทึก/i }))
      await waitFor(() => expect(calls.posts.length).toBe(2))
      expect(keyOf(calls, 1)).not.toBe(keyOf(calls, 0))
    })

    it('UI-09: rapid clicks while pending send exactly one request', async () => {
      const Component = await loadActionsTakenSection()
      let release: any
      const calls = installApi([], {
        post: () => new Promise((resolve) => { release = () => resolve({ ok: true, status: 201, json: async () => ({ id: 'x' }) }) }),
      })
      await openEmpty(Component)
      fireEvent.change(screen.getByLabelText(/คำอธิบาย|description/i), { target: { value: 'Rapid' } })
      fireEvent.change(screen.getByLabelText(/ผลลัพธ์|result/i), { target: { value: 'Click' } })
      const btn = screen.getByRole('button', { name: /บันทึก/i })
      fireEvent.click(btn)
      fireEvent.click(btn)
      fireEvent.click(btn)
      expect(calls.posts.length).toBe(1)
      release()
      await waitFor(() => expect(screen.queryByLabelText(/คำอธิบาย|description/i)).not.toBeInTheDocument())
    })
  })
})
