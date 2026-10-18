// @ts-nocheck
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import CreateTicketForm from '../../CreateTicketForm'
import TicketDetailPage from '../../TicketDetailPage'

// ---------------------------------------------------------------------------
// Mock the api module for CreateTicketForm
// ---------------------------------------------------------------------------
vi.mock('../../api', () => {
  class MockApiError extends Error {
    status: number
    details: Array<{ field: string; message: string }>
    constructor(message: string, status: number, details: Array<{ field: string; message: string }> = []) {
      super(message)
      this.name = 'ApiError'
      this.status = status
      this.details = details
    }
  }

  return {
    getRelatedSystems: vi.fn().mockResolvedValue([
      { id: 1, name: 'ERP System' },
      { id: 2, name: 'HR Portal' },
    ]),
    createTicket: vi.fn(),
    uploadAttachment: vi.fn(),
    getTicketById: vi.fn(),
    getComments: vi.fn().mockResolvedValue([]),
    postComment: vi.fn(),
    downloadAttachment: vi.fn(),
    removeAttachment: vi.fn(),
    markResolved: vi.fn(),
    ApiError: MockApiError,
  }
})

describe('Forms Hardening (UI-09)', () => {
  const mockRequester = { id: 1, name: 'Alice Johnson', email: 'alice@example.com' }
  const mockCategories = [
    { id: 1, name: 'Hardware' },
    { id: 2, name: 'Software' },
  ]

  let consoleWarnSpy: any
  let alertSpy: any

  beforeEach(() => {
    vi.clearAllMocks()
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleWarnSpy.mockRestore()
    alertSpy.mockRestore()
  })

  describe('CreateTicketForm hardening', () => {
    it('disables submit button while submission is pending and prevents duplicate submit calls', async () => {
      const api = await import('../../api')
      let resolveCreate: any
      const createPromise = new Promise((resolve) => {
        resolveCreate = resolve
      })
      api.createTicket.mockReturnValue(createPromise)

      render(
        <CreateTicketForm
          requesterProp={mockRequester}
          categoriesProp={mockCategories}
          onDone={vi.fn()}
        />
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/summary/i)).toBeInTheDocument()
      })

      fireEvent.change(screen.getByLabelText(/summary/i), { target: { value: 'Printer issue' } })
      fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Printer is out of paper and jammed' } })
      fireEvent.change(screen.getByLabelText(/category/i), { target: { value: '1' } })
      fireEvent.change(screen.getByLabelText(/related system/i), { target: { value: '1' } })
      fireEvent.change(screen.getByLabelText(/priority/i), { target: { value: 'High' } })

      const submitBtn = screen.getByRole('button', { name: /create ticket|submit/i })
      expect(submitBtn).not.toBeDisabled()

      // Click submit
      fireEvent.click(submitBtn)

      // Button should be disabled while pending
      expect(submitBtn).toBeDisabled()

      // Second click while pending should not trigger another api call
      fireEvent.click(submitBtn)
      expect(api.createTicket).toHaveBeenCalledTimes(1)

      // Resolve creation
      resolveCreate({
        id: 99,
        ticketNumber: 'TKT-0099',
        summary: 'Printer issue',
        description: 'Printer is out of paper and jammed',
        status: 'NEW',
      })

      await waitFor(() => {
        expect(screen.getByText(/ticket created successfully/i)).toBeInTheDocument()
      })
    })

    it('retains entered field values when server returns recoverable 400/422 validation error', async () => {
      const api = await import('../../api')
      api.createTicket.mockRejectedValue(
        new api.ApiError('Validation failed', 400, [
          { field: 'summary', message: 'Summary too short' },
        ])
      )

      render(
        <CreateTicketForm
          requesterProp={mockRequester}
          categoriesProp={mockCategories}
          onDone={vi.fn()}
        />
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/summary/i)).toBeInTheDocument()
      })

      const summaryInput = screen.getByLabelText(/summary/i) as HTMLInputElement
      const descInput = screen.getByLabelText(/description/i) as HTMLTextAreaElement

      fireEvent.change(summaryInput, { target: { value: 'Err' } })
      fireEvent.change(descInput, { target: { value: 'Detailed description that user worked hard to write' } })
      fireEvent.change(screen.getByLabelText(/category/i), { target: { value: '2' } })
      fireEvent.change(screen.getByLabelText(/related system/i), { target: { value: '1' } })

      const submitBtn = screen.getByRole('button', { name: /create ticket|submit/i })
      fireEvent.click(submitBtn)

      await waitFor(() => {
        expect(screen.getByText(/summary too short/i)).toBeInTheDocument()
      })

      // Form inputs must retain their values
      expect(summaryInput.value).toBe('Err')
      expect(descInput.value).toBe('Detailed description that user worked hard to write')
      expect(submitBtn).not.toBeDisabled()
    })

    it('does not call console.warn when attachment upload fails during ticket creation', async () => {
      const api = await import('../../api')
      api.createTicket.mockResolvedValue({
        id: 101,
        ticketNumber: 'TKT-0101',
        summary: 'Network outage',
        description: 'Cannot reach gateway',
        status: 'NEW',
      })
      api.uploadAttachment.mockRejectedValue(new Error('Network error on file upload'))

      render(
        <CreateTicketForm
          requesterProp={mockRequester}
          categoriesProp={mockCategories}
          onDone={vi.fn()}
        />
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/summary/i)).toBeInTheDocument()
      })

      fireEvent.change(screen.getByLabelText(/summary/i), { target: { value: 'Network outage' } })
      fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Cannot reach gateway' } })
      fireEvent.change(screen.getByLabelText(/category/i), { target: { value: '1' } })
      fireEvent.change(screen.getByLabelText(/related system/i), { target: { value: '1' } })

      // Stage a file
      const file = new File(['dummy content'], 'screenshot.png', { type: 'image/png' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      if (fileInput) {
        fireEvent.change(fileInput, { target: { files: [file] } })
      }

      const submitBtn = screen.getByRole('button', { name: /create ticket|submit/i })
      fireEvent.click(submitBtn)

      await waitFor(() => {
        expect(screen.getByText(/ticket created successfully/i)).toBeInTheDocument()
      })

      // Assert console.warn was NOT called
      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })
  })

  describe('TicketDetailPage inline error hardening', () => {
    it('displays inline role="alert" message and does NOT call alert() when comment post fails', async () => {
      const api = await import('../../api')
      api.getTicketById.mockResolvedValue({
        id: 42,
        ticketNumber: 'TKT-0042',
        summary: 'Cannot login',
        description: 'SSO error',
        status: 'OPEN',
        requestedPriority: 'High',
        category: { id: 1, name: 'Auth' },
        relatedSystem: { id: 1, name: 'Okta' },
        attachments: [],
      })
      api.postComment.mockRejectedValue(new Error('Failed to post comment due to server error'))

      render(<TicketDetailPage ticketId={42} onBack={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByDisplayValue(/cannot login/i)).toBeInTheDocument()
      })

      const commentInput = screen.getByPlaceholderText(/add a comment/i)
      fireEvent.change(commentInput, { target: { value: 'Here is more information' } })

      const postBtn = screen.getByRole('button', { name: /post comment|ส่งความคิดเห็น/i })
      fireEvent.click(postBtn)

      await waitFor(() => {
        const errorAlert = screen.getByRole('alert')
        expect(errorAlert).toBeInTheDocument()
        expect(errorAlert).toHaveTextContent(/failed to post comment/i)
      })

      // Must NOT invoke window.alert()
      expect(alertSpy).not.toHaveBeenCalled()
    })
  })
})
