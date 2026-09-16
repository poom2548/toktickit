import { jsx as _jsx } from "react/jsx-runtime";
export const STATUS_LABELS = {
    NEW: 'New',
    OPEN: 'Open',
    IN_PROGRESS: 'In Progress',
    WAITING_FOR_REQUESTER: 'Waiting for Requester',
    RESOLVED: 'Resolved',
    CLOSED: 'Closed',
    REOPENED: 'Reopened',
    CANCELLED: 'Cancelled',
};
import './badges.css';
// CSS class determines color — defined in Zen Green token stylesheet
// e.g., .badge--new { background: var(--zen-status-new-bg); color: var(--zen-status-new-text); }
export function StatusBadge({ status }) {
    return (_jsx("span", { className: `badge badge--status badge--${status.toLowerCase().replace('_', '-')}`, children: STATUS_LABELS[status] ?? status }));
}
