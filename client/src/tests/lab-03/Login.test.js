import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen, fireEvent } from '@testing-library/react';
import { LoginPage } from '../../pages/LoginPage';
import { AuthProvider } from '../../contexts/AuthContext';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import '@testing-library/jest-dom';
const renderLogin = () => render(_jsx(MemoryRouter, { children: _jsx(AuthProvider, { children: _jsx(LoginPage, {}) }) }));
it('renders email and password fields and submit button', () => {
    renderLogin();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
});
it('shows loading state while submitting', async () => {
    global.fetch = vi.fn(() => new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ id: '1', name: 'Alice', role: 'REQUESTER', requiresPasswordChange: false }),
    }), 500)));
    renderLogin();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'alice@toktick.dev' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Dev@123456' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText(/signing in/i)).toBeInTheDocument();
});
it('shows generic error message on 401', async () => {
    global.fetch = vi.fn(() => Promise.resolve({
        ok: false,
        json: async () => ({ error: 'Invalid email or password.' }),
    }));
    renderLogin();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'wrong@toktick.dev' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText('Invalid email or password.')).toBeInTheDocument();
});
