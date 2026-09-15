import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
export function ProtectedRoute({ children, allowedRoles }) {
    const { user, isLoading } = useAuth();
    if (isLoading)
        return _jsx("div", { children: "Loading..." }); // or a Zen Green skeleton
    if (!user)
        return _jsx(Navigate, { to: "/login", replace: true });
    // Intercept first-login users before any other screen
    if (user.requiresPasswordChange)
        return _jsx(Navigate, { to: "/change-password", replace: true });
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return _jsx(Navigate, { to: "/forbidden", replace: true });
    }
    return _jsx(_Fragment, { children: children });
}
