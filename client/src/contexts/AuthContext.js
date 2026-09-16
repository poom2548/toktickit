import { jsx as _jsx } from "react/jsx-runtime";
import { apiFetch } from "../utils/api";
import React, { createContext, useContext, useState, useEffect } from 'react';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const refreshUser = React.useCallback(async () => {
        try {
            const res = await apiFetch('/auth/me');
            if (res.ok) {
                const data = await res.json();
                setUser(data);
            }
            else {
                setUser(null);
            }
        }
        catch {
            setUser(null);
        }
    }, []);
    // On mount: restore session via GET /auth/me
    useEffect(() => {
        refreshUser().finally(() => setIsLoading(false));
    }, [refreshUser]);
    async function login(email, password) {
        const res = await apiFetch('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Login failed.');
        }
        const data = await res.json();
        setUser(data);
    }
    async function logout() {
        await apiFetch('/auth/logout', { method: 'POST' });
        setUser(null);
    }
    return (_jsx(AuthContext.Provider, { value: { user, isLoading, login, logout, refreshUser }, children: children }));
}
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx)
        throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
