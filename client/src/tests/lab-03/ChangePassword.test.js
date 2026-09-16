import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import { render, screen, fireEvent } from '@testing-library/react';
import { ChangePasswordPage } from '../../pages/ChangePasswordPage';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
// Mock the AuthContext so we can render ChangePasswordPage in the correct state
vi.mock('../../contexts/AuthContext', () => ({
    useAuth: () => ({
        user: { id: '1', role: 'REQUESTER', requiresPasswordChange: true },
        refreshUser: vi.fn(),
        logout: vi.fn(),
    }),
    AuthProvider: ({ children }) => _jsx(_Fragment, { children: children }),
}));
const renderChangePassword = () => render(_jsx(MemoryRouter, { children: _jsx(ChangePasswordPage, {}) }));
it('shows inline error without submitting when passwords do not match', async () => {
    renderChangePassword();
    fireEvent.change(screen.getByLabelText(/^new password/i), { target: { value: 'NewPass@1' } });
    fireEvent.change(screen.getByLabelText(/confirm/i), { target: { value: 'DifferentPass@1' } });
    // mock fetch to ensure it's not called
    global.fetch = vi.fn();
    fireEvent.click(screen.getByRole('button', { name: /set new password/i }));
    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
});
it('shows server validation errors for weak password without closing screen', async () => {
    global.fetch = vi.fn(() => Promise.resolve({
        ok: false,
        status: 422,
        json: async () => ({
            error: 'Password does not meet requirements.',
            details: ['Password must be at least 8 characters long.'],
        }),
    }));
    renderChangePassword();
    fireEvent.change(screen.getByLabelText(/^new password/i), { target: { value: 'abc' } });
    fireEvent.change(screen.getByLabelText(/confirm/i), { target: { value: 'abc' } });
    fireEvent.click(screen.getByRole('button', { name: /set new password/i }));
    expect(await screen.findByText(/at least 8 characters long/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^new password/i)).toBeInTheDocument();
});
