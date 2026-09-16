import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function AttachmentsSection({ attachments, ticketId, }) {
    if (!attachments || attachments.length === 0) {
        return (_jsxs("section", { className: "attachments-section", children: [_jsx("h2", { children: "Attachments" }), _jsx("p", { className: "empty-pane", children: "No attachments on this ticket." })] }));
    }
    function formatBytes(bytes) {
        if (bytes < 1024)
            return `${bytes} B`;
        if (bytes < 1048576)
            return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1048576).toFixed(1)} MB`;
    }
    return (_jsxs("section", { className: "attachments-section", children: [_jsxs("h2", { children: ["Attachments (", attachments.length, ")"] }), _jsx("ul", { className: "attachment-list", children: attachments.map(a => (_jsxs("li", { className: "attachment-item", children: [_jsx("span", { className: "attachment-name", children: a.filename }), _jsx("span", { className: "attachment-size", children: formatBytes(a.size) }), _jsx("a", { href: `/api/attachments/${a.id}/download`, download: a.filename, className: "download-link", "aria-label": `Download ${a.filename}`, children: "Download" })] }, a.id))) })] }));
}
