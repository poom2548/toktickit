export async function apiFetch(url, options = {}) {
    const res = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });
    if (res.status === 401 && !url.includes('/auth/login') && window.location.pathname !== '/login') {
        // Session expired — redirect to login
        window.location.href = '/login';
        return res;
    }
    return res;
}
