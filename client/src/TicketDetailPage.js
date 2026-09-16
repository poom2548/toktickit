import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { getTicketById, uploadAttachment, removeAttachment, downloadAttachment, getComments, postComment, markResolved } from "./api";
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
    // Comments & resolved state
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [postingComment, setPostingComment] = useState(false);
    const [resolving, setResolving] = useState(false);
    // ── Data fetching ─────────────────────────────────────────────────────────
    useEffect(() => {
        setLoading(true);
        setError(null);
        Promise.all([
            getTicketById(ticketId),
            getComments(ticketId)
        ])
            .then(([data, commentsData]) => {
            setTicket(data);
            setComments(commentsData);
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
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
        if (!allowedTypes.includes(file.type)) {
            setUploadError("Invalid file type. Only JPG, PNG, WEBP, and PDF are allowed.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setUploadError("File size exceeds 5MB limit.");
            return;
        }
        if ((ticket.attachments?.length || 0) >= 5) {
            setUploadError("Maximum of 5 attachments allowed.");
            return;
        }
        setUploading(true);
        try {
            const newAtt = await uploadAttachment(ticket.id, file);
            setTicket((prev) => {
                if (!prev)
                    return prev;
                return {
                    ...prev,
                    attachments: [...(prev.attachments || []), newAtt],
                };
            });
            setUploadSuccess(true);
            setFile(null);
            document.querySelector('input[type="file"]').value = "";
        }
        catch (err) {
            setUploadError(err.message || "Failed to upload attachment");
        }
        finally {
            setUploading(false);
        }
    }
    async function handleRemove(attachmentId) {
        if (!window.confirm("Are you sure you want to remove this attachment?"))
            return;
        setRemovingId(attachmentId);
        setUploadSuccess(false);
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
    async function handlePostComment(e) {
        e.preventDefault();
        if (!newComment.trim())
            return;
        setPostingComment(true);
        try {
            const comment = await postComment(ticketId, newComment);
            setComments((prev) => [...prev, comment]);
            setNewComment("");
        }
        catch (err) {
            alert(err.message || "Failed to post comment");
        }
        finally {
            setPostingComment(false);
        }
    }
    async function handleMarkResolved() {
        setResolving(true);
        try {
            const res = await markResolved(ticketId);
            setTicket((prev) => prev ? { ...prev, problemAppearsResolved: res.problemAppearsResolved } : prev);
        }
        catch (err) {
            alert(err.message || "Failed to mark resolved");
        }
        finally {
            setResolving(false);
        }
    }
    // ── Render ────────────────────────────────────────────────────────────────
    if (loading) {
        return (_jsxs("div", { className: "text-center py-5", children: [_jsx("div", { className: "spinner-border", style: { color: ZEN.primary }, role: "status" }), _jsx("p", { className: "mt-3 text-muted", children: "Loading ticket details\u2026" })] }));
    }
    if (error || !ticket) {
        return (_jsxs("div", { className: "alert alert-danger", children: [error || "An unknown error occurred.", _jsx("button", { className: "btn btn-sm btn-outline-danger ms-3", onClick: onBack, children: "Go Back" })] }));
    }
    const createdStr = new Date(ticket.createdAt).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
    return (_jsx("div", { className: "card border-0 shadow-sm", style: { borderRadius: 12 }, children: _jsxs("div", { className: "card-body p-4", children: [_jsxs("div", { className: "d-flex justify-content-between align-items-center mb-4", children: [_jsx("h2", { className: "h4 mb-0", style: { color: ZEN.primary }, children: "Ticket Details" }), _jsx("button", { className: "btn btn-outline-secondary", onClick: onBack, children: "Back to List" })] }), _jsxs("div", { className: "row g-3", children: [_jsxs("div", { className: "col-md-6", children: [_jsx("label", { className: "form-label fw-semibold", children: "Ticket No." }), _jsx("input", { type: "text", className: "form-control", value: ticket.ticketNumber, readOnly: true, style: { backgroundColor: ZEN.primaryLight } })] }), _jsxs("div", { className: "col-md-6", children: [_jsx("label", { className: "form-label fw-semibold", children: "Created Date" }), _jsx("input", { type: "text", className: "form-control", value: createdStr, readOnly: true, style: { backgroundColor: ZEN.primaryLight } })] }), _jsxs("div", { className: "col-md-4", children: [_jsx("label", { className: "form-label fw-semibold", children: "Status" }), _jsxs("div", { className: "input-group", children: [_jsx("input", { type: "text", className: "form-control", value: ticket.status, readOnly: true, style: { backgroundColor: ZEN.primaryLight } }), !ticket.problemAppearsResolved && ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && ticket.status !== 'CANCELLED' && (_jsx("button", { type: "button", className: "btn btn-outline-success", onClick: handleMarkResolved, disabled: resolving, children: resolving ? "Marking..." : "Resolve" }))] }), ticket.problemAppearsResolved && (_jsx("small", { className: "text-success mt-1 d-block", children: "User indicated problem is resolved." }))] }), _jsxs("div", { className: "col-md-4", children: [_jsx("label", { className: "form-label fw-semibold", children: "Category" }), _jsx("input", { type: "text", className: "form-control", value: ticket.category?.name || "Unknown", readOnly: true, style: { backgroundColor: ZEN.primaryLight } })] }), _jsxs("div", { className: "col-md-4", children: [_jsx("label", { className: "form-label fw-semibold", children: "Priority" }), _jsx("input", { type: "text", className: "form-control", value: ticket.requestedPriority, readOnly: true, style: { backgroundColor: ZEN.primaryLight } })] }), _jsxs("div", { className: "col-12", children: [_jsx("label", { className: "form-label fw-semibold", children: "Summary" }), _jsx("input", { type: "text", className: "form-control", value: ticket.summary, readOnly: true, style: { backgroundColor: ZEN.primaryLight } })] }), _jsxs("div", { className: "col-12", children: [_jsx("label", { className: "form-label fw-semibold", children: "Description" }), _jsx("textarea", { className: "form-control", rows: 4, value: ticket.description, readOnly: true, style: { backgroundColor: ZEN.primaryLight } })] })] }), _jsx("hr", { className: "my-5" }), _jsx("h3", { className: "h5 mb-4", style: { color: ZEN.primary }, children: "Public Comments" }), _jsx("div", { className: "mb-4", children: comments.length === 0 ? (_jsx("p", { className: "text-muted", children: "No comments yet." })) : (_jsx("div", { className: "d-flex flex-column gap-3", children: comments.map((c) => (_jsx("div", { className: "card bg-light border-0", children: _jsxs("div", { className: "card-body", children: [_jsxs("div", { className: "d-flex justify-content-between mb-2", children: [_jsxs("strong", { className: "text-primary", children: [c.author.name, " (", c.author.role, ")"] }), _jsx("small", { className: "text-muted", children: new Date(c.createdAt).toLocaleString() })] }), _jsx("p", { className: "mb-0", style: { whiteSpace: "pre-wrap" }, children: c.content })] }) }, c.id))) })) }), _jsxs("form", { onSubmit: handlePostComment, className: "mb-4", children: [_jsx("div", { className: "form-group mb-2", children: _jsx("textarea", { className: "form-control", rows: 3, placeholder: "Add a comment...", value: newComment, onChange: e => setNewComment(e.target.value), disabled: postingComment }) }), _jsx("button", { type: "submit", className: "btn btn-primary", disabled: postingComment || !newComment.trim(), children: postingComment ? "Posting..." : "Post Comment" })] }), _jsx("hr", { className: "my-5" }), _jsx("h3", { className: "h5 mb-4", style: { color: ZEN.primary }, children: "Attachments" }), uploadError && (_jsx("div", { className: "alert alert-danger py-2", role: "alert", children: uploadError })), uploadSuccess && (_jsx("div", { className: "alert alert-success py-2", role: "alert", children: "Attachment uploaded successfully!" })), _jsxs("form", { onSubmit: handleUpload, className: "mb-4 d-flex gap-2 align-items-center flex-wrap", children: [_jsx("input", { type: "file", className: "form-control w-auto flex-grow-1", accept: ".jpg,.jpeg,.png,.webp,.pdf", onChange: (e) => setFile(e.target.files?.[0] || null), disabled: uploading, "data-testid": "file-upload-input" }), _jsx("button", { type: "submit", className: "btn text-white", style: { backgroundColor: ZEN.primary }, disabled: !file || uploading, children: uploading ? "Uploading..." : "Upload" })] }), _jsx("div", { className: "table-responsive", children: _jsxs("table", { className: "table align-middle", children: [_jsx("thead", { className: "table-light", children: _jsxs("tr", { children: [_jsx("th", { scope: "col", children: "Filename" }), _jsx("th", { scope: "col", style: { width: 120 }, children: "Size" }), _jsx("th", { scope: "col", style: { width: 150 }, children: "Uploaded" }), _jsx("th", { scope: "col", style: { width: 180 }, className: "text-end", children: "Actions" })] }) }), _jsx("tbody", { children: !ticket.attachments || ticket.attachments.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 4, className: "text-center text-muted py-4", children: "No attachments yet." }) })) : (ticket.attachments.map((att) => (_jsxs("tr", { "data-testid": `attachment-row-${att.id}`, children: [_jsx("td", { children: _jsx("span", { className: "text-truncate d-inline-block", style: { maxWidth: 250 }, children: att.filename }) }), _jsxs("td", { className: "small text-muted", children: [(att.size / 1024).toFixed(1), " KB"] }), _jsx("td", { className: "small text-muted", children: new Date(att.createdAt).toLocaleDateString() }), _jsx("td", { className: "text-end", children: _jsxs("div", { className: "d-flex gap-2 justify-content-end", children: [_jsx("button", { type: "button", className: "btn btn-sm btn-outline-secondary", onClick: () => handleDownload(att.id, att.filename), children: "Download" }), _jsx("button", { type: "button", className: "btn btn-sm btn-outline-danger", onClick: () => handleRemove(att.id), disabled: removingId === att.id, children: removingId === att.id ? "Removing..." : "Remove" })] }) })] }, att.id)))) })] }) })] }) }));
}
