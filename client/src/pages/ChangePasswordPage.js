import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { apiFetch } from "../utils/api";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
export function ChangePasswordPage() {
    const { user, refreshUser, logout } = useAuth();
    const navigate = useNavigate();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [clientError, setClientError] = useState(null);
    const [serverErrors, setServerErrors] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
        else if (!user.requiresPasswordChange) {
            navigate(getRoleHomePath(user.role));
        }
    }, [user, navigate]);
    if (!user || !user.requiresPasswordChange)
        return null;
    const handleSubmit = async (e) => {
        e.preventDefault();
        setClientError(null);
        setServerErrors([]);
        if (newPassword !== confirmPassword) {
            setClientError('Passwords do not match.');
            return;
        }
        setIsLoading(true);
        try {
            const res = await apiFetch('/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPassword }),
            });
            if (res.ok) {
                await refreshUser(); // updates requiresPasswordChange to false
            }
            else {
                const data = await res.json();
                setServerErrors(data.details || [data.error]);
            }
        }
        catch {
            setServerErrors(['An unexpected error occurred. Please try again.']);
        }
        finally {
            setIsLoading(false);
        }
    };
    return (_jsx("div", { className: "container py-5 d-flex justify-content-center align-items-center", style: { minHeight: '100vh' }, children: _jsx("div", { className: "card shadow-sm", style: { width: '100%', maxWidth: '450px', borderRadius: 8 }, children: _jsxs("div", { className: "card-body p-4", children: [_jsx("h1", { className: "h4 text-center mb-3", children: "Change Your Password" }), _jsx("p", { className: "text-muted text-center mb-4", style: { fontSize: '0.9rem' }, children: "You must set a new password before continuing." }), _jsxs("div", { className: "mb-4 p-3 bg-light rounded text-muted", style: { fontSize: '0.85rem' }, children: [_jsx("strong", { className: "d-block mb-1", children: "Password rules:" }), _jsxs("ul", { className: "mb-0 ps-3", children: [_jsx("li", { children: "At least 8 characters" }), _jsx("li", { children: "At least one uppercase letter (A-Z)" }), _jsx("li", { children: "At least one lowercase letter (a-z)" }), _jsx("li", { children: "At least one digit (0-9)" })] })] }), _jsxs("form", { onSubmit: handleSubmit, noValidate: true, children: [_jsxs("div", { className: "mb-3", children: [_jsx("label", { htmlFor: "newPassword", className: "form-label fw-semibold", children: "New password" }), _jsx("input", { id: "newPassword", type: "password", className: "form-control", value: newPassword, onChange: e => setNewPassword(e.target.value), required: true, disabled: isLoading, autoComplete: "new-password" })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { htmlFor: "confirmPassword", className: "form-label fw-semibold", children: "Confirm new password" }), _jsx("input", { id: "confirmPassword", type: "password", className: `form-control ${clientError ? 'is-invalid' : ''}`, value: confirmPassword, onChange: e => setConfirmPassword(e.target.value), required: true, disabled: isLoading, autoComplete: "new-password" }), clientError && (_jsx("div", { className: "invalid-feedback", role: "alert", children: clientError }))] }), serverErrors.length > 0 && (_jsx("div", { className: "alert alert-danger p-2 mb-3", role: "alert", style: { fontSize: '0.9rem' }, children: _jsx("ul", { className: "mb-0 ps-3", children: serverErrors.map((err, i) => _jsx("li", { children: err }, i)) }) })), _jsx("button", { type: "submit", className: "btn text-white w-100 fw-semibold mb-3", style: { background: "#006B3C", borderRadius: 8 }, disabled: isLoading, children: isLoading ? 'Saving…' : 'Set New Password' })] }), _jsx("div", { className: "text-center", children: _jsx("button", { onClick: () => { logout(); navigate('/login'); }, className: "btn btn-link text-decoration-none text-muted p-0", style: { fontSize: '0.9rem' }, children: "Log out instead" }) })] }) }) }));
}
function getRoleHomePath(role) {
    if (role === 'REQUESTER')
        return '/tickets';
    if (role === 'IT_STAFF')
        return '/staff/tickets';
    if (role === 'ADMINISTRATOR')
        return '/admin/users';
    return '/login';
}
