import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { StatusBadge } from '../shared/StatusBadge';
import { useAuth } from '../../contexts/AuthContext';
const STATUS_LABELS = {
    NEW: 'New', OPEN: 'Open', IN_PROGRESS: 'In Progress',
    WAITING_FOR_REQUESTER: 'Waiting for Requester',
    RESOLVED: 'Resolved', CLOSED: 'Closed', REOPENED: 'Reopened', CANCELLED: 'Cancelled',
};
const PERMITTED_TRANSITIONS = {
    NEW: ['OPEN', 'CANCELLED'],
    OPEN: ['IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'CANCELLED'],
    IN_PROGRESS: ['WAITING_FOR_REQUESTER', 'RESOLVED', 'CANCELLED'],
    WAITING_FOR_REQUESTER: ['IN_PROGRESS', 'RESOLVED', 'CANCELLED'],
    RESOLVED: ['CLOSED', 'REOPENED'],
    CLOSED: [],
    REOPENED: ['OPEN', 'IN_PROGRESS', 'CANCELLED'],
    CANCELLED: [],
};
export function OperationalSection({ ticket, onTicketUpdate }) {
    const [priority, setPriority] = useState(ticket.itPriority ?? '');
    const [status, setStatus] = useState(ticket.status);
    const [saving, setSaving] = useState(null);
    const [saveErrors, setSaveErrors] = useState({});
    const { user } = useAuth();
    async function patchTicket(endpoint, body, field) {
        setSaving(field);
        setSaveErrors(prev => ({ ...prev, [field]: undefined }));
        try {
            const res = await fetch(`/api/staff/tickets/${ticket.id}/${endpoint}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (res.ok) {
                const updated = await res.json();
                onTicketUpdate({ ...ticket, ...updated });
                if (field === 'priority')
                    setPriority(updated.itPriority ?? '');
                if (field === 'status')
                    setStatus(updated.status);
            }
            else {
                const err = await res.json();
                setSaveErrors(prev => ({ ...prev, [field]: err.error ?? 'Failed to save.' }));
            }
        }
        catch {
            setSaveErrors(prev => ({ ...prev, [field]: 'An unexpected error occurred.' }));
        }
        finally {
            setSaving(null);
        }
    }
    const permittedNextStatuses = PERMITTED_TRANSITIONS[ticket.status] ?? [];
    return (_jsxs("section", { className: "operational-section", children: [_jsx("h2", { children: "Ticket Operations" }), _jsxs("div", { className: "field-row", children: [_jsx("dt", { children: "Current Status" }), _jsx("dd", { children: _jsx(StatusBadge, { status: ticket.status }) })] }), _jsxs("div", { className: "field-group", children: [_jsx("label", { htmlFor: "owner-select", children: "Ticket Owner" }), _jsxs("div", { className: "owner-input-row", children: [_jsx("span", { className: "current-owner", children: ticket.owner ? ticket.owner.name : _jsx("em", { children: "Unassigned" }) }), _jsx("button", { onClick: () => patchTicket('owner', { ownerId: ticket.owner ? null : user?.id }, 'owner'), disabled: saving === 'owner', className: "claim-btn", children: saving === 'owner' ? 'Saving…' : ticket.owner ? 'Unassign' : 'Claim (Assign to me)' })] }), saveErrors.owner && _jsx("span", { className: "field-error", role: "alert", children: saveErrors.owner })] }), _jsxs("div", { className: "field-group", children: [_jsx("label", { htmlFor: "it-priority-select", children: "IT Priority" }), _jsxs("select", { id: "it-priority-select", value: priority, onChange: e => setPriority(e.target.value), disabled: saving === 'priority', children: [_jsx("option", { value: "", children: "\u2014 Not set \u2014" }), _jsx("option", { value: "LOW", children: "Low" }), _jsx("option", { value: "MEDIUM", children: "Medium" }), _jsx("option", { value: "HIGH", children: "High" }), _jsx("option", { value: "CRITICAL", children: "Critical" })] }), _jsx("button", { onClick: () => patchTicket('priority', { itPriority: priority || null }, 'priority'), disabled: saving === 'priority', className: "save-btn", children: saving === 'priority' ? 'Saving…' : 'Save Priority' }), saveErrors.priority && _jsx("span", { className: "field-error", role: "alert", children: saveErrors.priority })] }), _jsxs("div", { className: "field-group", children: [_jsx("label", { htmlFor: "status-select", children: "Update Status" }), permittedNextStatuses.length === 0 ? (_jsxs("p", { className: "terminal-status-note", children: ["This ticket is in a terminal state (", _jsx("strong", { children: ticket.status }), ") and cannot be transitioned further."] })) : (_jsxs(_Fragment, { children: [_jsxs("select", { id: "status-select", value: status, onChange: e => setStatus(e.target.value), disabled: saving === 'status', children: [_jsxs("option", { value: ticket.status, children: [STATUS_LABELS[ticket.status], " (current)"] }), permittedNextStatuses.map(s => (_jsx("option", { value: s, children: STATUS_LABELS[s] }, s)))] }), _jsx("button", { onClick: () => patchTicket('status', { status }, 'status'), disabled: saving === 'status' || status === ticket.status, className: "save-btn", children: saving === 'status' ? 'Saving…' : 'Update Status' })] })), saveErrors.status && _jsx("span", { className: "field-error", role: "alert", children: saveErrors.status })] })] }));
}
