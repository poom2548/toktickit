import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
const ROLE_LABELS = {
    REQUESTER: 'Requester',
    IT_STAFF: 'IT Staff',
    ADMINISTRATOR: 'Administrator',
};
export function AppShell({ children }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };
    const isActive = (path) => location.pathname.startsWith(path);
    return (_jsxs("div", { className: "d-flex flex-column min-vh-100 bg-light", children: [_jsxs("header", { className: "bg-white shadow-sm sticky-top", children: [_jsxs("div", { className: "container-fluid px-4 py-3 d-flex align-items-center justify-content-between", children: [_jsxs("div", { className: "d-flex align-items-center gap-4", children: [_jsxs("span", { className: "h5 mb-0 fw-bold", children: ["TokTickIT ", _jsx("span", { style: { color: "#006B3C" }, children: "Service Desk" })] }), _jsxs("nav", { className: "d-none d-md-flex gap-3", children: [user?.role === 'REQUESTER' && (_jsx(Link, { to: "/tickets", className: `text-decoration-none fw-semibold ${isActive('/tickets') ? 'text-dark' : 'text-muted'}`, children: "My Tickets" })), (user?.role === 'IT_STAFF' || user?.role === 'ADMINISTRATOR') && (_jsx(Link, { to: "/staff/tickets", className: `text-decoration-none fw-semibold ${isActive('/staff/tickets') ? 'text-dark' : 'text-muted'}`, children: "Ticket Queue" })), user?.role === 'ADMINISTRATOR' && (_jsx(Link, { to: "/admin/users", className: `text-decoration-none fw-semibold ${isActive('/admin/users') ? 'text-dark' : 'text-muted'}`, children: "User Management" }))] })] }), _jsxs("div", { className: "d-flex align-items-center gap-3", children: [_jsxs("span", { className: "text-muted d-none d-sm-inline", style: { fontSize: '0.9rem' }, children: [user?.name, " ", _jsx("span", { className: "badge bg-secondary ms-1", children: ROLE_LABELS[user?.role ?? ''] })] }), _jsx("button", { onClick: handleLogout, className: "btn btn-outline-secondary btn-sm", style: { borderRadius: 8 }, children: "Log out" })] })] }), _jsx("div", { className: "container-fluid px-4 py-2 border-top d-md-none bg-white", children: _jsxs("nav", { className: "d-flex gap-3", children: [user?.role === 'REQUESTER' && (_jsx(Link, { to: "/tickets", className: `text-decoration-none fw-semibold ${isActive('/tickets') ? 'text-dark' : 'text-muted'}`, children: "My Tickets" })), (user?.role === 'IT_STAFF' || user?.role === 'ADMINISTRATOR') && (_jsx(Link, { to: "/staff/tickets", className: `text-decoration-none fw-semibold ${isActive('/staff/tickets') ? 'text-dark' : 'text-muted'}`, children: "Ticket Queue" })), user?.role === 'ADMINISTRATOR' && (_jsx(Link, { to: "/admin/users", className: `text-decoration-none fw-semibold ${isActive('/admin/users') ? 'text-dark' : 'text-muted'}`, children: "Users" }))] }) })] }), _jsx("main", { className: "flex-grow-1", children: children })] }));
}
