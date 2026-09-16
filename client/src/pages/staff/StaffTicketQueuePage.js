import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { QueueControls } from '../../components/staff/QueueControls';
import { QueueTable } from '../../components/staff/QueueTable';
import { QueueCardList } from '../../components/staff/QueueCardList';
import { Pagination } from '../../components/shared/Pagination';
import './StaffTicketQueue.css';
export function StaffTicketQueuePage() {
    const navigate = useNavigate();
    // Filter/sort/pagination state
    const [search, setSearch] = useState('');
    const [statusFilter, setStatus] = useState('');
    const [priorityFilter, setPriority] = useState('');
    const [sortField, setSortField] = useState('createdAt');
    const [sortDir, setSortDir] = useState('desc');
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 20;
    // Data state
    const [tickets, setTickets] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [fetchState, setFetchState] = useState('idle');
    const [errorMessage, setErrorMessage] = useState(null);
    // Debounced search
    const [debouncedSearch, setDebouncedSearch] = useState('');
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 400);
        return () => clearTimeout(timer);
    }, [search]);
    // Reset to page 1 whenever filters/sort change
    useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter, priorityFilter, sortField, sortDir]);
    // Fetch data
    const fetchTickets = useCallback(async () => {
        setFetchState('loading');
        setErrorMessage(null);
        const params = new URLSearchParams();
        if (debouncedSearch)
            params.set('search', debouncedSearch);
        if (statusFilter)
            params.set('status', statusFilter);
        if (priorityFilter)
            params.set('priority', priorityFilter);
        params.set('sort', sortField);
        params.set('direction', sortDir);
        params.set('page', String(page));
        params.set('pageSize', String(PAGE_SIZE));
        try {
            // In tests and real app, URL might be different based on Vite setup
            // Using /api/staff/tickets assuming backend proxy
            // The instructions mention `/staff/tickets?${params.toString()}`
            // The tests expect `/staff/tickets` in the fetch call exactly as specified.
            // Wait, is it /staff/tickets or /api/staff/tickets? The prompt says `/staff/tickets` for fetch
            const res = await fetch(`/staff/tickets?${params.toString()}`, {
                credentials: 'include',
            });
            if (res.status === 401) {
                window.location.href = '/login';
                return;
            }
            if (res.status === 403) {
                setFetchState('error');
                setErrorMessage('forbidden');
                return;
            }
            if (!res.ok) {
                setFetchState('error');
                setErrorMessage('Unable to load tickets. Please try again.');
                return;
            }
            const data = await res.json();
            setTickets(data.tickets);
            setPagination(data.pagination);
            setFetchState('success');
        }
        catch {
            setFetchState('error');
            setErrorMessage('Unable to load tickets. Please check your connection and try again.');
        }
    }, [debouncedSearch, statusFilter, priorityFilter, sortField, sortDir, page]);
    useEffect(() => { fetchTickets(); }, [fetchTickets]);
    const handleOpenDetail = (ticketId) => {
        navigate(`/staff/tickets/${ticketId}`);
    };
    const handleSort = (field) => {
        if (sortField === field) {
            setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
        }
        else {
            setSortField(field);
            setSortDir('asc');
        }
    };
    const controls = (_jsx(QueueControls, { search: search, onSearchChange: setSearch, statusFilter: statusFilter, onStatusChange: setStatus, priorityFilter: priorityFilter, onPriorityChange: setPriority }));
    if (fetchState === 'loading') {
        return (_jsxs("div", { className: "staff-queue-page", children: [controls, _jsx("div", { className: "skeleton-container", "aria-busy": "true", "aria-label": "Loading tickets", children: Array.from({ length: 5 }).map((_, i) => (_jsx("div", { className: "skeleton-row" }, i))) })] }));
    }
    if (fetchState === 'error' && errorMessage === 'forbidden') {
        return (_jsx("div", { className: "staff-queue-page", children: _jsxs("div", { className: "forbidden-message", role: "alert", children: [_jsx("h2", { children: "Access Denied" }), _jsx("p", { children: "You do not have permission to view the Ticket Queue." })] }) }));
    }
    if (fetchState === 'error') {
        return (_jsxs("div", { className: "staff-queue-page", children: [controls, _jsxs("div", { className: "error-message", role: "alert", children: [_jsx("p", { children: errorMessage }), _jsx("button", { onClick: fetchTickets, children: "Retry" })] })] }));
    }
    const filtersActive = debouncedSearch || statusFilter || priorityFilter;
    if (fetchState === 'success' && tickets.length === 0 && !filtersActive) {
        return (_jsxs("div", { className: "staff-queue-page", children: [controls, _jsx("div", { className: "empty-queue", role: "status", children: _jsx("p", { children: "No tickets in the queue yet." }) })] }));
    }
    if (fetchState === 'success' && tickets.length === 0 && filtersActive) {
        return (_jsxs("div", { className: "staff-queue-page", children: [controls, _jsxs("div", { className: "no-results", role: "status", children: [_jsx("p", { children: "No tickets match your current search or filters." }), _jsx("button", { onClick: () => { setSearch(''); setStatus(''); setPriority(''); }, children: "Clear filters" })] })] }));
    }
    return (_jsxs("div", { className: "staff-queue-page", children: [controls, _jsx(QueueTable, { tickets: tickets, onOpenDetail: handleOpenDetail, onSort: handleSort, sortField: sortField, sortDir: sortDir }), _jsx(QueueCardList, { tickets: tickets, onOpenDetail: handleOpenDetail }), _jsx(Pagination, { pagination: pagination, page: page, onPageChange: setPage })] }));
}
