import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { getTickets, } from "./api.js";
// ---------------------------------------------------------------------------
// Zen Green colour tokens (consistent with other components)
// ---------------------------------------------------------------------------
const ZEN = {
    primary: "#006B3C",
    primaryLight: "#e8f5ee",
    primaryDark: "#004d2b",
    badgeBg: "#e8f5ee",
    badgeText: "#004d2b",
};
// ---------------------------------------------------------------------------
// Allowed filter values
// ---------------------------------------------------------------------------
const PRIORITIES = ["Low", "Medium", "High"];
const STATUSES = ["New", "In Progress", "Resolved", "Closed"];
// ---------------------------------------------------------------------------
// Priority / Status badge colours
// ---------------------------------------------------------------------------
const PRIORITY_COLORS = {
    Low: "#198754",
    Medium: "#fd7e14",
    High: "#dc3545",
};
const STATUS_COLORS = {
    New: "#0d6efd",
    "In Progress": "#fd7e14",
    Resolved: "#198754",
    Closed: "#6c757d",
};
// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
/** Small coloured badge used for Priority and Status columns */
function Badge({ label, colorMap }) {
    const bg = colorMap[label] ?? "#6c757d";
    return (_jsx("span", { className: "badge", style: {
            background: bg,
            fontSize: 11,
            letterSpacing: 0.3,
            padding: "3px 8px",
            borderRadius: 6,
        }, children: label }));
}
/** Format an ISO date string to a compact locale date */
function formatDate(iso) {
    return new Date(iso).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}
// ---------------------------------------------------------------------------
// Desktop Table Row
// ---------------------------------------------------------------------------
function TicketTableRow({ ticket, onClick }) {
    return (_jsxs("tr", { onClick: () => onClick(ticket.id), style: { cursor: "pointer" }, className: "ticket-row", children: [_jsx("td", { className: "text-muted small", style: { whiteSpace: "nowrap" }, children: ticket.ticketNumber }), _jsx("td", { style: {
                    maxWidth: 220,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                }, title: ticket.summary, children: ticket.summary }), _jsx("td", { className: "small", children: ticket.category?.name ?? "—" }), _jsx("td", { children: _jsx(Badge, { label: ticket.requestedPriority, colorMap: PRIORITY_COLORS }) }), _jsx("td", { children: _jsx(Badge, { label: ticket.status, colorMap: STATUS_COLORS }) }), _jsx("td", { className: "text-muted small", style: { whiteSpace: "nowrap" }, children: formatDate(ticket.createdAt) })] }));
}
// ---------------------------------------------------------------------------
// Mobile Card
// ---------------------------------------------------------------------------
function TicketCard({ ticket, onClick }) {
    return (_jsx("div", { className: "card mb-2 border-0 shadow-sm ticket-card", style: { borderRadius: 10, cursor: "pointer" }, "data-testid": "ticket-card", onClick: () => onClick(ticket.id), children: _jsxs("div", { className: "card-body py-3 px-3", children: [_jsxs("div", { className: "d-flex justify-content-between align-items-start mb-1", children: [_jsx("span", { className: "fw-semibold small", style: { color: ZEN.primary }, children: ticket.ticketNumber }), _jsx("span", { className: "text-muted", style: { fontSize: 11 }, children: formatDate(ticket.createdAt) })] }), _jsx("p", { className: "mb-2 fw-semibold", style: { lineHeight: 1.4 }, children: ticket.summary }), ticket.category && (_jsx("p", { className: "mb-2 text-muted small", children: ticket.category.name })), _jsxs("div", { className: "d-flex gap-2 flex-wrap", children: [_jsx(Badge, { label: ticket.requestedPriority, colorMap: PRIORITY_COLORS }), _jsx(Badge, { label: ticket.status, colorMap: STATUS_COLORS })] })] }) }));
}
function FilterBar({ search, categoryId, priority, status, categories, onSearch, onCategoryId, onPriority, onStatus, onSubmit, onReset, }) {
    function handleSubmit(e) {
        e.preventDefault();
        onSubmit();
    }
    return (_jsx("form", { onSubmit: handleSubmit, className: "mb-4", role: "search", "aria-label": "Filter tickets", children: _jsxs("div", { className: "row g-2", children: [_jsx("div", { className: "col-12 col-sm-6 col-lg-4", children: _jsx("input", { type: "search", className: "form-control", placeholder: "Search summary or description\u2026", "aria-label": "Search", value: search, onChange: (e) => onSearch(e.target.value) }) }), _jsx("div", { className: "col-6 col-sm-3 col-lg-2", children: _jsxs("select", { className: "form-select", "aria-label": "Filter by category", value: categoryId, onChange: (e) => onCategoryId(e.target.value), children: [_jsx("option", { value: "", children: "All Categories" }), categories.map((cat) => (_jsx("option", { value: String(cat.id), children: cat.name }, cat.id)))] }) }), _jsx("div", { className: "col-6 col-sm-3 col-lg-2", children: _jsxs("select", { className: "form-select", "aria-label": "Filter by priority", value: priority, onChange: (e) => onPriority(e.target.value), children: [_jsx("option", { value: "", children: "All Priorities" }), PRIORITIES.map((p) => (_jsx("option", { value: p, children: p }, p)))] }) }), _jsx("div", { className: "col-6 col-sm-3 col-lg-2", children: _jsxs("select", { className: "form-select", "aria-label": "Filter by status", value: status, onChange: (e) => onStatus(e.target.value), children: [_jsx("option", { value: "", children: "All Statuses" }), STATUSES.map((s) => (_jsx("option", { value: s, children: s }, s)))] }) }), _jsxs("div", { className: "col-6 col-sm-3 col-lg-2 d-flex gap-2", children: [_jsx("button", { type: "submit", className: "btn text-white flex-fill", style: { background: ZEN.primary, border: "none", borderRadius: 8 }, "aria-label": "Apply filters", children: "Search" }), _jsx("button", { type: "button", className: "btn btn-outline-secondary flex-fill", style: { borderRadius: 8 }, onClick: onReset, "aria-label": "Reset filters", children: "Reset" })] })] }) }));
}
function PaginationControls({ pagination, onPage }) {
    const { currentPage, totalPages } = pagination;
    if (totalPages <= 1)
        return null;
    return (_jsxs("div", { className: "d-flex align-items-center justify-content-between mt-3", "aria-label": "Pagination", children: [_jsx("button", { className: "btn btn-outline-secondary btn-sm", style: { borderRadius: 8 }, disabled: currentPage <= 1, onClick: () => onPage(currentPage - 1), "aria-label": "Previous page", children: "\u2190 Previous" }), _jsxs("span", { className: "text-muted small", children: ["Page ", currentPage, " of ", totalPages] }), _jsx("button", { className: "btn btn-outline-secondary btn-sm", style: { borderRadius: 8 }, disabled: currentPage >= totalPages, onClick: () => onPage(currentPage + 1), "aria-label": "Next page", children: "Next \u2192" })] }));
}
// ---------------------------------------------------------------------------
// MyTicketsPage
// ---------------------------------------------------------------------------
/**
 * MyTicketsPage — Issue 4
 *
 * Displays the current requester's tickets with:
 * - Search + filter bar (summary/description, category, priority, status)
 * - Desktop (≥768px): Bootstrap <table> with text-overflow ellipsis on summary
 * - Mobile (<768px): vertical card stack — no horizontal scroll
 * - Pagination controls
 * - "No tickets found" empty state
 */
export default function MyTicketsPage({ categories, onNewTicket, onViewTicket }) {
    // ── Filter state ──────────────────────────────────────────────────────────
    const [search, setSearch] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [priority, setPriority] = useState("");
    const [status, setStatus] = useState("");
    // ── Applied filter state (only changes on Search submit or Reset) ─────────
    const [appliedSearch, setAppliedSearch] = useState("");
    const [appliedCategoryId, setAppliedCategoryId] = useState("");
    const [appliedPriority, setAppliedPriority] = useState("");
    const [appliedStatus, setAppliedStatus] = useState("");
    // ── Pagination ────────────────────────────────────────────────────────────
    const [currentPage, setCurrentPage] = useState(1);
    // ── Data state ────────────────────────────────────────────────────────────
    const [tickets, setTickets] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    // ── Fetch whenever applied filters or page changes ────────────────────────
    useEffect(() => {
        setLoading(true);
        setError(null);
        getTickets({
            search: appliedSearch || undefined,
            categoryId: appliedCategoryId ? Number(appliedCategoryId) : undefined,
            priority: appliedPriority || undefined,
            status: appliedStatus || undefined,
            page: currentPage,
            limit: 10,
        })
            .then((res) => {
            setTickets(res.data);
            setPagination(res.pagination);
        })
            .catch(() => {
            setError("Unable to load tickets. Please check your connection and try again.");
        })
            .finally(() => {
            setLoading(false);
        });
    }, [appliedSearch, appliedCategoryId, appliedPriority, appliedStatus, currentPage]);
    // ── Handlers ──────────────────────────────────────────────────────────────
    function handleSearch() {
        setCurrentPage(1);
        setAppliedSearch(search);
        setAppliedCategoryId(categoryId);
        setAppliedPriority(priority);
        setAppliedStatus(status);
    }
    function handleReset() {
        setSearch("");
        setCategoryId("");
        setPriority("");
        setStatus("");
        setCurrentPage(1);
        setAppliedSearch("");
        setAppliedCategoryId("");
        setAppliedPriority("");
        setAppliedStatus("");
    }
    const hasActiveFilters = appliedSearch || appliedCategoryId || appliedPriority || appliedStatus;
    // ── Render ────────────────────────────────────────────────────────────────
    return (_jsxs("div", { children: [_jsxs("div", { className: "d-flex align-items-center justify-content-between mb-4", children: [_jsx("h2", { className: "h4 mb-0", style: { color: ZEN.primaryDark }, children: "\uD83C\uDF9F\uFE0F My Tickets" }), _jsx("button", { type: "button", className: "btn btn-sm fw-semibold text-white", style: { background: ZEN.primary, border: "none", borderRadius: 8 }, onClick: onNewTicket, "aria-label": "Create a new ticket", children: "\u2795 New Ticket" })] }), _jsx(FilterBar, { search: search, categoryId: categoryId, priority: priority, status: status, categories: categories, onSearch: setSearch, onCategoryId: setCategoryId, onPriority: setPriority, onStatus: setStatus, onSubmit: handleSearch, onReset: handleReset }), error && (_jsxs("div", { className: "alert alert-danger", role: "alert", children: ["\u274C ", error] })), loading && (_jsxs("div", { className: "text-center py-5", "aria-label": "Loading tickets", children: [_jsx("div", { className: "spinner-border", style: { color: ZEN.primary }, role: "status", "aria-hidden": "true" }), _jsx("p", { className: "mt-3 text-muted small", children: "Loading tickets\u2026" })] })), !loading && !error && (_jsxs(_Fragment, { children: [tickets.length === 0 && (_jsxs("div", { className: "text-center py-5", "data-testid": "empty-state", children: [_jsx("div", { style: { fontSize: 48 }, children: "\uD83D\uDD0D" }), _jsx("h3", { className: "h5 mt-3 text-muted", children: "No tickets found" }), _jsx("p", { className: "text-muted small", children: hasActiveFilters
                                    ? "No tickets match your current filters. Try adjusting your search."
                                    : "You haven't submitted any tickets yet." }), hasActiveFilters && (_jsx("button", { type: "button", className: "btn btn-outline-secondary btn-sm mt-2", style: { borderRadius: 8 }, onClick: handleReset, children: "Clear Filters" }))] })), tickets.length > 0 && (_jsx("div", { className: "d-none d-md-block", "data-testid": "table-view", children: _jsx("div", { className: "table-responsive", children: _jsxs("table", { className: "table table-hover align-middle mb-0", children: [_jsx("thead", { className: "table-light", children: _jsxs("tr", { children: [_jsx("th", { scope: "col", style: { width: 110 }, children: "Ticket #" }), _jsx("th", { scope: "col", children: "Summary" }), _jsx("th", { scope: "col", style: { width: 130 }, children: "Category" }), _jsx("th", { scope: "col", style: { width: 90 }, children: "Priority" }), _jsx("th", { scope: "col", style: { width: 110 }, children: "Status" }), _jsx("th", { scope: "col", style: { width: 110 }, children: "Date" })] }) }), _jsx("tbody", { children: tickets.map((ticket) => (_jsx(TicketTableRow, { ticket: ticket, onClick: onViewTicket }, ticket.id))) })] }) }) })), tickets.length > 0 && (_jsx("div", { className: "d-md-none", "data-testid": "card-view", children: tickets.map((ticket) => (_jsx(TicketCard, { ticket: ticket, onClick: onViewTicket }, ticket.id))) })), pagination && (_jsx(PaginationControls, { pagination: pagination, onPage: setCurrentPage }))] }))] }));
}
