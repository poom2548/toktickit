import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
export function LoginPage() {
    const { login, user } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            await login(email, password);
        }
        catch (err) {
            setError(err.message || 'An unexpected error occurred.');
        }
        finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        if (user) {
            if (user.requiresPasswordChange) {
                navigate('/change-password');
            }
            else {
                switch (user.role) {
                    case 'REQUESTER':
                        navigate('/tickets');
                        break;
                    case 'IT_STAFF':
                        navigate('/staff/tickets');
                        break;
                    case 'ADMINISTRATOR':
                        navigate('/admin/users');
                        break;
                    default:
                        navigate('/login');
                        break;
                }
            }
        }
    }, [user, navigate]);
    return (_jsx("div", { className: "container py-5 d-flex justify-content-center align-items-center", style: { minHeight: '100vh' }, children: _jsx("div", { className: "card shadow-sm", style: { width: '100%', maxWidth: '400px', borderRadius: 8 }, children: _jsxs("div", { className: "card-body p-4", children: [_jsxs("h1", { className: "h4 text-center mb-1", children: ["TokTickIT ", _jsx("span", { style: { color: "#006B3C" }, children: "Service Desk" })] }), _jsx("h2", { className: "h6 text-center text-muted mb-4", children: "Sign In" }), _jsxs("form", { onSubmit: handleSubmit, noValidate: true, children: [_jsxs("div", { className: "mb-3", children: [_jsx("label", { htmlFor: "email", className: "form-label fw-semibold", children: "Email address" }), _jsx("input", { id: "email", type: "email", className: "form-control", value: email, onChange: e => setEmail(e.target.value), required: true, disabled: isLoading, autoComplete: "email" })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { htmlFor: "password", className: "form-label fw-semibold", children: "Password" }), _jsx("input", { id: "password", type: "password", className: "form-control", value: password, onChange: e => setPassword(e.target.value), required: true, disabled: isLoading, autoComplete: "current-password" })] }), error && (_jsx("div", { className: "alert alert-danger p-2 mb-3", role: "alert", style: { fontSize: '0.9rem' }, children: error })), _jsx("button", { type: "submit", className: "btn text-white w-100 fw-semibold", style: { background: "#006B3C", borderRadius: 8 }, disabled: isLoading, children: isLoading ? 'Signing in…' : 'Sign In' })] })] }) }) }));
}
