import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import * as AuthContext from '../../contexts/AuthContext'
import React from 'react'

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

describe('AppShell - Mobile Navigation (UI-13, Screen 5)', () => {
  const mockUser = {
    id: 'user-1',
    name: 'Frank IT',
    email: 'frank@toktick.dev',
    role: 'IT_STAFF',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(AuthContext.useAuth as any).mockReturnValue({
      user: mockUser,
      logout: vi.fn(),
    })
  })

  it('renders mobile menu toggle button with label "เมนู" and aria attributes', () => {
    render(
      <BrowserRouter>
        <AppShell>
          <div>Main Content</div>
        </AppShell>
      </BrowserRouter>
    )

    const toggleBtn = screen.getByRole('button', { name: /menu|เมนู/i })
    expect(toggleBtn).toBeInTheDocument()
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'false')
    expect(toggleBtn).toHaveAttribute('aria-controls', 'mobile-nav')
  })

  it('toggles mobile menu open and closed when clicking toggle button', () => {
    render(
      <BrowserRouter>
        <AppShell>
          <div>Main Content</div>
        </AppShell>
      </BrowserRouter>
    )

    const toggleBtn = screen.getByRole('button', { name: /menu|เมนู/i })
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'false')

    // Click to open
    fireEvent.click(toggleBtn)
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'true')
    const mobileNav = document.getElementById('mobile-nav')
    expect(mobileNav).toBeInTheDocument()

    // Click to close
    fireEvent.click(toggleBtn)
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'false')
  })

  it('closes mobile menu when pressing Escape key and returns focus to toggle button', () => {
    render(
      <BrowserRouter>
        <AppShell>
          <div>Main Content</div>
        </AppShell>
      </BrowserRouter>
    )

    const toggleBtn = screen.getByRole('button', { name: /menu|เมนู/i })
    fireEvent.click(toggleBtn)
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'true')

    // Press Escape
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'false')
    expect(document.activeElement).toBe(toggleBtn)
  })

  it('closes mobile menu when clicking a navigation link inside the menu', () => {
    render(
      <BrowserRouter>
        <AppShell>
          <div>Main Content</div>
        </AppShell>
      </BrowserRouter>
    )

    const toggleBtn = screen.getByRole('button', { name: /menu|เมนู/i })
    fireEvent.click(toggleBtn)
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'true')

    const mobileNav = document.getElementById('mobile-nav')
    expect(mobileNav).toBeInTheDocument()

    // Click a nav link inside mobile-nav
    const queueLink = mobileNav?.querySelector('a')
    expect(queueLink).toBeInTheDocument()
    if (queueLink) {
      fireEvent.click(queueLink)
    }
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'false')
  })
})
