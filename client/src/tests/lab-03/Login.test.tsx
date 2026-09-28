import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { LoginPage } from '../../pages/LoginPage'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import '@testing-library/jest-dom'

// Mock AuthContext so LoginPage renders without waiting for /auth/me
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    isLoading: false,
    login: vi.fn(async (email: string, password: string) => {
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')
      return data
    }),
    logout: vi.fn(),
  }),
  AuthProvider: ({ children }: any) => <>{children}</>,
}))

const renderLogin = () => render(
  <MemoryRouter>
    <LoginPage />
  </MemoryRouter>
)

it('renders email and password fields and submit button', () => {
  renderLogin()
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
})

it('shows loading state while submitting', async () => {
  global.fetch = vi.fn(() => new Promise(resolve => setTimeout(() => resolve({
    ok: true,
    json: async () => ({ id: '1', name: 'Alice', role: 'REQUESTER', requiresPasswordChange: false }),
  } as Response), 500))) as any

  renderLogin()
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'alice@toktick.dev' } })
  fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'Dev@123456' } })
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

  expect(await screen.findByText(/signing in/i)).toBeInTheDocument()
})

it('shows generic error message on 401', async () => {
  global.fetch = vi.fn(() => Promise.resolve({
    ok: false,
    json: async () => ({ error: 'Invalid email or password.' }),
  } as Response)) as any

  renderLogin()
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'wrong@toktick.dev' } })
  fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'wrongpass' } })
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

  expect(await screen.findByText('Invalid email or password.')).toBeInTheDocument()
})
