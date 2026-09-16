import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function Pagination({ pagination, page, onPageChange }) {
    if (!pagination || pagination.totalPages <= 1)
        return null;
    return (_jsxs("nav", { className: "pagination", "aria-label": "Ticket list pagination", children: [_jsx("button", { onClick: () => onPageChange(page - 1), disabled: page <= 1, "aria-label": "Previous page", children: "\u2190 Previous" }), _jsxs("span", { className: "pagination-info", children: ["Page ", page, " of ", pagination.totalPages, " (", pagination.total, " tickets)"] }), _jsx("button", { onClick: () => onPageChange(page + 1), disabled: page >= pagination.totalPages, "aria-label": "Next page", children: "Next \u2192" })] }));
}
