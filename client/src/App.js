import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/guards/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { ForbiddenPage } from './pages/ForbiddenPage';
import { AppShell } from './components/AppShell';
import RequesterApp from './RequesterApp';
export default function App() {
    return (_jsx(BrowserRouter, { children: _jsx(AuthProvider, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Navigate, { to: "/login", replace: true }) }), _jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { path: "/change-password", element: _jsx(ChangePasswordPage, {}) }), _jsx(Route, { path: "/tickets", element: _jsx(ProtectedRoute, { allowedRoles: ['REQUESTER'], children: _jsx(AppShell, { children: _jsx(RequesterApp, {}) }) }) }), _jsx(Route, { path: "/staff/tickets", element: _jsx(ProtectedRoute, { allowedRoles: ['IT_STAFF', 'ADMINISTRATOR'], children: _jsx(AppShell, { children: _jsx("div", { children: "IT Staff Ticket Queue (Issue 5)" }) }) }) }), _jsx(Route, { path: "/admin/users", element: _jsx(ProtectedRoute, { allowedRoles: ['ADMINISTRATOR'], children: _jsx(AppShell, { children: _jsx("div", { children: "User Management (Issue 7)" }) }) }) }), _jsx(Route, { path: "/forbidden", element: _jsx(ForbiddenPage, {}) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/login", replace: true }) })] }) }) }));
}
