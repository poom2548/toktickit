import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { UserManagementPage, User } from '../../pages/admin/UserManagementPage'
import { vi } from 'vitest'

const mockAdminUser = { id: 'u3', name: 'Grace Admin', role: 'ADMINISTRATOR' }

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockAdminUser, isLoading: false })
}))

const mockUsers: User[] = [
  { id: 'u1', name: 'Alice Requester', email: 'alice@toktick.dev', role: 'REQUESTER', isActive: true, requiresPasswordChange: false },
  { id: 'u2', name: 'Frank IT', email: 'frank@toktick.dev', role: 'IT_STAFF', isActive: true, requiresPasswordChange: false },
  { id: 'u3', name: 'Grace Admin', email: 'grace@toktick.dev', role: 'ADMINISTRATOR', isActive: true, requiresPasswordChange: false },
]

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    {children}
  </MemoryRouter>
)

describe('UserManagementPage', () => {

  beforeEach(() => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/auth/me') {
        return Promise.resolve({ ok: true, status: 200, json: async () => mockAdminUser })
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({ users: mockUsers }) })
    })
  })

  // AC-ADMIN-13
  it('renders the user table with correct columns', async () => {
    render(<UserManagementPage />, { wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('user-table')).toBeInTheDocument()
      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Email')).toBeInTheDocument()
      expect(screen.getAllByText('Role')[0]).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
      expect(screen.getByText('Alice Requester')).toBeInTheDocument()
      expect(screen.getByText('Frank IT')).toBeInTheDocument()
    })
  })

  it('renders Create User button', async () => {
    render(<UserManagementPage />, { wrapper })
    await waitFor(() => expect(screen.getByTestId('create-user-btn')).toBeInTheDocument())
  })

  it('opens Create User modal on button click', async () => {
    render(<UserManagementPage />, { wrapper })
    await waitFor(() => screen.getByTestId('create-user-btn'))
    fireEvent.click(screen.getByTestId('create-user-btn'))
    expect(screen.getByRole('dialog', { name: /create user/i })).toBeInTheDocument()
  })

  // AC-ADMIN-15
  it('opens Edit modal pre-populated with user data', async () => {
    render(<UserManagementPage />, { wrapper })
    await waitFor(() => screen.getByTestId('edit-user-btn-u1'))
    fireEvent.click(screen.getByTestId('edit-user-btn-u1'))

    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(screen.getByDisplayValue('Alice Requester')).toBeInTheDocument()
    expect(screen.getByDisplayValue('alice@toktick.dev')).toBeInTheDocument()
  })

  it('shows empty state when no users match search', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/auth/me') return Promise.resolve({ ok: true, status: 200, json: async () => mockAdminUser })
      return Promise.resolve({ ok: true, status: 200, json: async () => ({ users: [] }) })
    })
    render(<UserManagementPage />, { wrapper })
    
    // Wait for the skeleton to go away
    const searchInput = await screen.findByTestId('user-search-input')
    
    // Type in search to trigger "no users match" text
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } })
    
    await waitFor(() => expect(screen.getByText(/no users match/i)).toBeInTheDocument())
  })

  // AC-ADMIN-14
  it('shows forbidden message for non-Administrator', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/auth/me') return Promise.resolve({ ok: true, status: 200, json: async () => mockAdminUser })
      return Promise.resolve({ ok: false, status: 403, json: async () => ({ error: 'Forbidden' }) })
    })
    render(<UserManagementPage />, { wrapper })
    await waitFor(() => expect(screen.getByText(/access denied/i)).toBeInTheDocument())
  })

  // AC-ADMIN-17
  it('shows safe error message on API failure — no stack trace', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/auth/me') return Promise.resolve({ ok: true, status: 200, json: async () => mockAdminUser })
      return Promise.reject(new Error('Network Error'))
    })
    render(<UserManagementPage />, { wrapper })
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.queryByText(/stack/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/TypeError/i)).not.toBeInTheDocument()
    })
  })

  it('renders role badges for each user row', async () => {
    render(<UserManagementPage />, { wrapper })

    await waitFor(() => {
      expect(document.querySelector('.role-badge--requester')).toBeTruthy()
      expect(document.querySelector('.role-badge--it-staff')).toBeTruthy()
      expect(document.querySelector('.role-badge--admin')).toBeTruthy()
    })
  })
})
