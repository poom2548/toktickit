import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { getTicketById, uploadAttachment, removeAttachment, downloadAttachment, } from "./api.js";
// ---------------------------------------------------------------------------
// Zen Green colour tokens
// ---------------------------------------------------------------------------
const ZEN = {
    primary: "#006B3C",
    primaryLight: "#e8f5ee",
    errorText: "#dc3545",
    successText: "#198754",
};
export default function TicketDetailPage({ ticketId, onBack }) {
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // Upload state
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    // Remove state
    const [removingId, setRemovingId] = useState(null);
    // ── Requester change guard ────────────────────────────────────────────────
    // ── Data fetching ─────────────────────────────────────────────────────────
    useEffect(() => {
        setLoading(true);
        setError(null);
        getTicketById(ticketId)
            .then((data) => {
            setTicket(data);
            setLoading(false);
        })
            .catch((err) => {
            if (err.status === 404)
                setError("Ticket not found.");
            else if (err.status === 403)
                setError("You are not authorized to view this ticket.");
            else
                setError("Unable to load ticket details.");
            setLoading(false);
        });
    }, [ticketId]);
    // ── Handlers ──────────────────────────────────────────────────────────────
    async function handleUpload(e) {
        e.preventDefault();
        if (!file || !ticket)
            return;
        setUploadError(null);
        setUploadSuccess(false);
        // Client-side validation
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
        if (!allowedTypes.includes(file.type)) {
            setUploadError("Only JPEG, PNG, WebP and PDF files are allowed.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setUploadError("File size exceeds 5 MB limit.");
            return;
        }
        if ((ticket.attachments?.length || 0) >= 5) {
            setUploadError("A ticket may not have more than 5 active attachments.");
            return;
        }
        setUploading(true);
        try {
            const newAttachment = await uploadAttachment(ticketId, file);
            setTicket((prev) => {
                if (!prev)
                    return prev;
                return {
                    ...prev,
                    attachments: [newAttachment, ...(prev.attachments || [])],
                };
            });
            setFile(null);
            setUploadSuccess(true);
            // Auto-hide success message
            setTimeout(() => setUploadSuccess(false), 3000);
        }
        catch (err) {
            setUploadError(err.message || "Failed to upload file");
        }
        finally {
            setUploading(false);
        }
    }
    async function handleRemove(attachmentId) {
        if (!confirm("Are you sure you want to remove this attachment?"))
            return;
        setRemovingId(attachmentId);
        setUploadError(null);
        try {
            await removeAttachment(attachmentId);
            setTicket((prev) => {
                if (!prev)
                    return prev;
                return {
                    ...prev,
                    attachments: prev.attachments?.filter((a) => a.id !== attachmentId),
                };
            });
        }
        catch (err) {
            setUploadError(err.message || "Failed to remove attachment");
        }
        finally {
            setRemovingId(null);
        }
    }
    async function handleDownload(attachmentId, filename) {
        try {
            await downloadAttachment(attachmentId, filename);
        }
        catch (err) {
            alert(err.message || "Failed to download attachment");
        }
    }
    // ── Render ────────────────────────────────────────────────────────────────
    if (loading) {
        return (_jsxs("div", { className: "text-center py-5", children: [_jsx("div", { className: "spinner-border", style: { color: ZEN.primary }, role: "status" }), _jsx("p", { className: "mt-3 text-muted", children: "Loading ticket details\u2026" })] }));
    }
    if (error || !ticket) {
        return (_jsx("div", { className: "alert alert-danger", children: error || "An unknown error occurred." }));
    }
    // Format date helper
    const createdStr = new Date(ticket.createdAt).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
    return (_jsx("div", { className: "card border-0 shadow-sm", style: { borderRadius: 12 }, children: _jsxs("div", { className: "card-body p-4", children: [_jsx("h2", { className: "h4 mb-4", style: { color: ZEN.primary }, children: "Ticket Details" }), _jsxs("div", { className: "row g-3", children: [_jsxs("div", { className: "col-md-6", children: [_jsx("label", { className: "form-label fw-semibold", children: "Ticket No." }), _jsx("input", { type: "text", className: "form-control", value: ticket.ticketNumber, readOnly: true, style: { backgroundColor: ZEN.primaryLight } })] }), _jsxs("div", { className: "col-md-6", children: [_jsx("label", { className: "form-label fw-semibold", children: "Created Date" }), _jsx("input", { type: "text", className: "form-control", value: createdStr, readOnly: true, style: { backgroundColor: ZEN.primaryLight } })] }), _jsxs("div", { className: "col-md-4", children: [_jsx("label", { className: "form-label fw-semibold", children: "Status" }), _jsx("input", { type: "text", className: "form-control", value: ticket.status, readOnly: true, style: { backgroundColor: ZEN.primaryLight } })] }), _jsxs("div", { className: "col-md-4", children: [_jsx("label", { className: "form-label fw-semibold", children: "Category" }), _jsx("input", { type: "text", className: "form-control", value: ticket.category?.name || "Unknown", readOnly: true, style: { backgroundColor: ZEN.primaryLight } })] }), _jsxs("div", { className: "col-md-4", children: [_jsx("label", { className: "form-label fw-semibold", children: "Priority" }), _jsx("input", { type: "text", className: "form-control", value: ticket.requestedPriority, readOnly: true, style: { backgroundColor: ZEN.primaryLight } })] }), _jsxs("div", { className: "col-12", children: [_jsx("label", { className: "form-label fw-semibold", children: "Summary" }), _jsx("input", { type: "text", className: "form-control", value: ticket.summary, readOnly: true, style: { backgroundColor: ZEN.primaryLight } })] }), _jsxs("div", { className: "col-12", children: [_jsx("label", { className: "form-label fw-semibold", children: "Description" }), _jsx("textarea", { className: "form-control", rows: 4, value: ticket.description, readOnly: true, style: { backgroundColor: ZEN.primaryLight } })] })] }), _jsx("hr", { className: "my-5" }), _jsx("h3", { className: "h5 mb-4", style: { color: ZEN.primary }, children: "Attachments" }), uploadError && (_jsx("div", { className: "alert alert-danger py-2", role: "alert", children: uploadError })), uploadSuccess && (_jsx("div", { className: "alert alert-success py-2", role: "alert", children: "Attachment uploaded successfully!" })), _jsxs("form", { onSubmit: handleUpload, className: "mb-4 d-flex gap-2 align-items-center flex-wrap", children: [_jsx("input", { type: "file", className: "form-control w-auto flex-grow-1", accept: ".jpg,.jpeg,.png,.webp,.pdf", onChange: (e) => setFile(e.target.files?.[0] || null), disabled: uploading, "data-testid": "file-upload-input" }), _jsx("button", { type: "submit", className: "btn text-white", style: { backgroundColor: ZEN.primary }, disabled: !file || uploading, children: uploading ? "Uploading..." : "Upload" })] }), _jsx("div", { className: "table-responsive", children: _jsxs("table", { className: "table align-middle", children: [_jsx("thead", { className: "table-light", children: _jsxs("tr", { children: [_jsx("th", { scope: "col", children: "Filename" }), _jsx("th", { scope: "col", style: { width: 120 }, children: "Size" }), _jsx("th", { scope: "col", style: { width: 150 }, children: "Uploaded" }), _jsx("th", { scope: "col", style: { width: 180 }, className: "text-end", children: "Actions" })] }) }), _jsx("tbody", { children: !ticket.attachments || ticket.attachments.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 4, className: "text-center text-muted py-4", children: "No attachments yet." }) })) : (ticket.attachments.map((att) => (_jsxs("tr", { "data-testid": `attachment-row-${att.id}`, children: [_jsx("td", { children: _jsx("span", { className: "text-truncate d-inline-block", style: { maxWidth: 250 }, children: att.filename }) }), _jsxs("td", { className: "small text-muted", children: [(att.size / 1024).toFixed(1), " KB"] }), _jsx("td", { className: "small text-muted", children: new Date(att.createdAt).toLocaleDateString() }), _jsx("td", { className: "text-end", children: _jsxs("div", { className: "d-flex gap-2 justify-content-end", children: [_jsx("button", { type: "button", className: "btn btn-sm btn-outline-secondary", onClick: () => handleDownload(att.id, att.filename), children: "Download" }), _jsx("button", { type: "button", className: "btn btn-sm btn-outline-danger", onClick: () => handleRemove(att.id), disabled: removingId === att.id, children: removingId === att.id ? "Removing..." : "Remove" })] }) })] }, att.id)))) })] }) })] }) }));
}
