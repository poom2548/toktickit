import { jsx as _jsx } from "react/jsx-runtime";
export const PRIORITY_LABELS = {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
    CRITICAL: 'Critical',
};
import './badges.css';
export function PriorityBadge({ priority }) {
    return (_jsx("span", { className: `badge badge--priority badge--${priority.toLowerCase()}`, children: PRIORITY_LABELS[priority] ?? priority }));
}
