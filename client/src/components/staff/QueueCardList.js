import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { StatusBadge } from '../shared/StatusBadge';
import { PriorityBadge } from '../shared/PriorityBadge';
function formatDate(dateStr) {
    return new Date(dateStr).toLocaleString();
}
export function QueueCardList({ tickets, onOpenDetail }) {
    return (_jsx("ul", { className: "queue-card-list", role: "list", children: tickets.map(ticket => (_jsxs("li", { className: "queue-card", children: [_jsxs("div", { className: "card-header", children: [_jsx("span", { className: "ticket-number", children: ticket.ticketNumber }), _jsx(StatusBadge, { status: ticket.status })] }), _jsx("p", { className: "card-summary", children: ticket.summary }), _jsxs("div", { className: "card-meta", children: [_jsxs("span", { children: ["Category: ", ticket.category?.name ?? '—'] }), _jsxs("span", { children: ["Owner: ", ticket.owner?.name ?? 'Unassigned'] })] }), _jsxs("div", { className: "card-priorities", children: [_jsxs("span", { children: ["Req. Priority: ", _jsx(PriorityBadge, { priority: ticket.requestedPriority })] }), ticket.itPriority && _jsxs("span", { children: ["IT Priority: ", _jsx(PriorityBadge, { priority: ticket.itPriority })] })] }), _jsxs("div", { className: "card-dates", children: [_jsxs("span", { children: ["Created: ", formatDate(ticket.createdAt)] }), _jsxs("span", { children: ["Updated: ", formatDate(ticket.updatedAt)] })] }), _jsx("button", { onClick: () => onOpenDetail(ticket.id), className: "open-detail-btn", "aria-label": `Open detail for ticket ${ticket.ticketNumber}`, children: "Open Detail" })] }, ticket.id))) }));
}
