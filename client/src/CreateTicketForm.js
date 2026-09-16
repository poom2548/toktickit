import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { apiFetch } from "./utils/api";
import { useState, useEffect, useRef } from "react";
import { ApiError, getRelatedSystems, createTicket, uploadAttachment, } from "./api.js";
// ---------------------------------------------------------------------------
// Zen Green colour tokens (from Lab 2)
// ---------------------------------------------------------------------------
const ZEN = {
    primary: "#006B3C", // Primary Green (submit button)
    primaryLight: "#e8f5ee", // Soft gray-green (read-only inputs)
    errorText: "#8b0000", // Dark red (inline error messages)
    errorBorder: "#dc3545", // Red asterisk / error border
};
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const EMPTY_VALUES = {
    categoryId: "",
    relatedSystemId: "",
    requestedPriority: "",
    summary: "",
    description: "",
};
/** Required-field label with a red asterisk. */
function RequiredLabel({ htmlFor, children }) {
    return (_jsxs("label", { htmlFor: htmlFor, className: "form-label fw-semibold", children: [children, _jsx("span", { "aria-hidden": "true", style: { color: ZEN.errorBorder, marginLeft: 2 }, children: "*" })] }));
}
/** Inline error message rendered below an invalid field. */
function FieldError({ message }) {
    if (!message)
        return null;
    return (_jsx("p", { role: "alert", className: "mb-0 mt-1 small", style: { color: ZEN.errorText }, children: message }));
}
// ---------------------------------------------------------------------------
// Attachment constants & helpers
// ---------------------------------------------------------------------------
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const ALLOWED_EXTENSIONS = ".jpg,.jpeg,.png,.webp,.pdf";
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_ATTACHMENTS = 5;
function formatBytes(bytes) {
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
/**
 * Returns a validation error message for a given file, or null when the file
 * is acceptable. Called before adding a file to the staged list.
 */
function validateFile(file, currentCount) {
    if (currentCount >= MAX_ATTACHMENTS) {
        return `You may attach at most ${MAX_ATTACHMENTS} files per ticket.`;
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return `"${file.name}" is not allowed. Only JPG, PNG, WEBP, and PDF files are accepted.`;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
        return `"${file.name}" exceeds the 5 MB size limit (${formatBytes(file.size)}).`;
    }
    return null;
}
/** File icon based on MIME type */
function fileIcon(mime) {
    if (mime === "application/pdf")
        return "📄";
    return "🖼️";
}
function AttachmentSection({ stagedFiles, attachmentError, onAdd, onRemove, disabled, }) {
    const inputRef = useRef(null);
    function handleFileChange(e) {
        if (e.target.files && e.target.files.length > 0) {
            onAdd(e.target.files);
            // Reset input so the same file can be re-selected after removal
            e.target.value = "";
        }
    }
    return (_jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "form-label fw-semibold", children: "Attachments" }), _jsxs("div", { style: {
                    border: `2px dashed ${attachmentError ? "#dc3545" : "#adb5bd"}`,
                    borderRadius: 8,
                    padding: "16px",
                    textAlign: "center",
                    background: "#fafafa",
                    cursor: disabled ? "not-allowed" : "pointer",
                    opacity: disabled ? 0.6 : 1,
                    transition: "border-color 0.2s",
                }, onClick: () => !disabled && inputRef.current?.click(), role: "button", tabIndex: disabled ? -1 : 0, "aria-label": "Select files to attach", onKeyDown: (e) => {
                    if ((e.key === "Enter" || e.key === " ") && !disabled) {
                        inputRef.current?.click();
                    }
                }, children: [_jsx("span", { style: { fontSize: 28 }, children: "\uD83D\uDCCE" }), _jsx("p", { className: "mb-1 mt-1 small fw-semibold", style: { color: "#495057" }, children: "Click to browse files" }), _jsxs("p", { className: "mb-0 small text-muted", children: ["JPG, PNG, WEBP, PDF \u2014 max 5 MB each, up to ", MAX_ATTACHMENTS, " files"] }), _jsx("input", { ref: inputRef, type: "file", multiple: true, accept: ALLOWED_EXTENSIONS, style: { display: "none" }, onChange: handleFileChange, disabled: disabled || stagedFiles.length >= MAX_ATTACHMENTS, "aria-hidden": "true", tabIndex: -1 })] }), attachmentError && (_jsx("p", { role: "alert", className: "mb-0 mt-1 small", style: { color: "#8b0000" }, children: attachmentError })), stagedFiles.length > 0 && (_jsx("ul", { className: "list-group mt-2", style: { borderRadius: 8 }, children: stagedFiles.map((file, idx) => (_jsxs("li", { className: "list-group-item d-flex align-items-center gap-2 py-2 px-3", style: { fontSize: 14 }, children: [_jsx("span", { children: fileIcon(file.type) }), _jsx("span", { className: "flex-grow-1 text-truncate", style: { maxWidth: "65%" }, title: file.name, children: file.name }), _jsx("span", { className: "text-muted small ms-auto me-2", style: { whiteSpace: "nowrap" }, children: formatBytes(file.size) }), _jsx("button", { type: "button", className: "btn btn-sm btn-outline-danger", style: { borderRadius: 6, padding: "2px 8px", lineHeight: 1.4 }, onClick: () => onRemove(idx), disabled: disabled, "aria-label": `Remove ${file.name}`, children: "\u2715 Remove" })] }, `${file.name}-${idx}`))) })), _jsx("div", { className: "text-end mt-1", children: _jsxs("small", { className: "text-muted", children: [stagedFiles.length, " / ", MAX_ATTACHMENTS, " files staged"] }) })] }));
}
// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
/**
 * CreateTicketForm — Issue 3
 *
 * Zen Green themed form that submits to POST /api/tickets.
 * Features:
 * - Red asterisks on every required field label
 * - Read-only requester field styled with soft gray-green background
 * - Submit button disabled + spinner while awaiting the API response
 * - Dark red inline error messages below invalid fields (client + server)
 */
export default function CreateTicketForm({ categories: categoriesProp, onDone }) {
    const [systems, setSystems] = useState([]);
    const [systemsError, setSystemsError] = useState(null);
    // Self-fetch categories if parent hasn't loaded them yet (e.g. "Check System" never clicked)
    const [localCategories, setLocalCategories] = useState(categoriesProp);
    const [values, setValues] = useState(EMPTY_VALUES);
    const [errors, setErrors] = useState({});
    const [formState, setFormState] = useState("idle");
    const [createdTicket, setCreatedTicket] = useState(null);
    // Attachment staging state
    const [stagedFiles, setStagedFiles] = useState([]);
    const [attachmentError, setAttachmentError] = useState(null);
    // Use categories from prop when available, fall back to self-fetched list
    const categories = categoriesProp.length > 0 ? categoriesProp : localCategories;
    // Fetch related systems (always) and categories (only when prop is empty)
    useEffect(() => {
        getRelatedSystems()
            .then(setSystems)
            .catch(() => setSystemsError("Unable to load related systems. Is the backend running?"));
        if (categoriesProp.length === 0) {
            apiFetch("/api/categories")
                .then((r) => r.json())
                .then((data) => setLocalCategories(data))
                .catch(() => { });
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    // ---------------------------------------------------------------------------
    // Client-side validation
    // ---------------------------------------------------------------------------
    function validate(vals) {
        const errs = {};
        if (!vals.categoryId) {
            errs.categoryId = "Category is required.";
        }
        if (!vals.relatedSystemId) {
            errs.relatedSystemId = "Related system is required.";
        }
        if (!vals.requestedPriority) {
            errs.requestedPriority = "Priority is required.";
        }
        if (!vals.summary.trim()) {
            errs.summary = "Summary is required.";
        }
        else if (vals.summary.length > 100) {
            errs.summary = "Summary must not exceed 100 characters.";
        }
        if (!vals.description.trim()) {
            errs.description = "Description is required.";
        }
        else if (vals.description.length > 1000) {
            errs.description = "Description must not exceed 1000 characters.";
        }
        return errs;
    }
    // ---------------------------------------------------------------------------
    // Attachment handlers
    // ---------------------------------------------------------------------------
    function handleAddFiles(fileList) {
        setAttachmentError(null);
        const toAdd = [];
        let firstError = null;
        for (const file of Array.from(fileList)) {
            const err = validateFile(file, stagedFiles.length + toAdd.length);
            if (err) {
                firstError = err;
                break; // Report the first violation and stop processing
            }
            toAdd.push(file);
        }
        if (firstError)
            setAttachmentError(firstError);
        if (toAdd.length > 0)
            setStagedFiles((prev) => [...prev, ...toAdd]);
    }
    function handleRemoveFile(index) {
        setStagedFiles((prev) => prev.filter((_, i) => i !== index));
        setAttachmentError(null);
    }
    // ---------------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------------
    function handleChange(e) {
        const { name, value } = e.target;
        setValues((prev) => ({ ...prev, [name]: value }));
        // Clear field error as the user edits
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    }
    // ---------------------------------------------------------------------------
    // Submit
    // ---------------------------------------------------------------------------
    async function handleSubmit(e) {
        e.preventDefault();
        // 1. Client-side validation
        const clientErrors = validate(values);
        if (Object.keys(clientErrors).length > 0) {
            setErrors(clientErrors);
            return; // Do NOT call the API
        }
        // 2. Create ticket
        setFormState("submitting");
        setErrors({});
        try {
            const ticket = await createTicket({
                categoryId: Number(values.categoryId),
                relatedSystemId: Number(values.relatedSystemId),
                requestedPriority: values.requestedPriority,
                summary: values.summary.trim(),
                description: values.description.trim(),
            });
            // 3. Upload staged attachments sequentially
            for (const file of stagedFiles) {
                try {
                    await uploadAttachment(ticket.id, file);
                }
                catch {
                    // Non-fatal: log and continue uploading remaining files.
                    // The ticket has already been created successfully.
                    console.warn(`Failed to upload attachment "${file.name}"`);
                }
            }
            setCreatedTicket(ticket);
            setFormState("success");
            setValues(EMPTY_VALUES);
            setStagedFiles([]);
            setAttachmentError(null);
        }
        catch (err) {
            setFormState("idle");
            if (err instanceof ApiError && err.status === 400) {
                // Map server field errors back to form
                const serverErrors = {};
                for (const detail of err.details) {
                    serverErrors[detail.field] = detail.message;
                }
                setErrors(serverErrors);
            }
            else {
                setErrors({ _form: "An unexpected error occurred. Please try again." });
            }
        }
    }
    const isSubmitting = formState === "submitting";
    // ---------------------------------------------------------------------------
    // Success banner
    // ---------------------------------------------------------------------------
    if (formState === "success" && createdTicket) {
        return (_jsx("div", { className: "card border-0 shadow-sm", style: { borderRadius: 12 }, children: _jsxs("div", { className: "card-body p-4 text-center", children: [_jsx("div", { style: { fontSize: 48 }, children: "\uD83C\uDF9F\uFE0F" }), _jsx("h2", { className: "h4 mt-2 fw-bold", style: { color: ZEN.primary }, children: "Ticket Created!" }), _jsx("p", { className: "text-muted mb-1", children: "Your ticket number is:" }), _jsx("p", { className: "fw-bold fs-3", style: { color: ZEN.primary, letterSpacing: 2 }, children: createdTicket.ticketNumber }), _jsx("p", { className: "text-muted small mb-3", children: createdTicket.summary }), _jsx("button", { type: "button", className: "btn text-white fw-semibold me-2", style: { background: ZEN.primary, borderRadius: 8 }, onClick: () => {
                            setFormState("idle");
                            setCreatedTicket(null);
                        }, children: "Create Another Ticket" }), _jsx("button", { type: "button", className: "btn btn-outline-secondary", style: { borderRadius: 8 }, onClick: onDone, children: "Back to Dashboard" })] }) }));
    }
    // ---------------------------------------------------------------------------
    // Form
    // ---------------------------------------------------------------------------
    return (_jsxs("div", { className: "card border-0 shadow-sm", style: { borderRadius: 12 }, children: [_jsx("div", { className: "card-header border-0 text-white px-4 py-3", style: {
                    background: `linear-gradient(135deg, ${ZEN.primary} 0%, #004d2b 100%)`,
                    borderRadius: "12px 12px 0 0",
                }, children: _jsx("h2", { className: "h5 mb-0 fw-bold", children: "\uD83C\uDF9F\uFE0F Create New Ticket" }) }), _jsxs("div", { className: "card-body px-4 py-4", children: [systemsError && (_jsx("div", { className: "alert alert-danger", role: "alert", children: systemsError })), errors._form && (_jsx("div", { className: "alert alert-danger", role: "alert", children: errors._form })), _jsxs("form", { onSubmit: handleSubmit, noValidate: true, children: [_jsxs("div", { className: "mb-3", children: [_jsx(RequiredLabel, { htmlFor: "categoryId", children: "Category" }), _jsxs("select", { id: "categoryId", name: "categoryId", className: "form-select", value: values.categoryId, onChange: handleChange, required: true, "aria-describedby": errors.categoryId ? "categoryId-error" : undefined, style: errors.categoryId ? { borderColor: ZEN.errorBorder } : undefined, children: [_jsx("option", { value: "", children: "\u2014 Select a category \u2014" }), categories.map((cat) => (_jsx("option", { value: cat.id, children: cat.name }, cat.id)))] }), _jsx(FieldError, { message: errors.categoryId })] }), _jsxs("div", { className: "mb-3", children: [_jsx(RequiredLabel, { htmlFor: "relatedSystemId", children: "Related System" }), _jsxs("select", { id: "relatedSystemId", name: "relatedSystemId", className: "form-select", value: values.relatedSystemId, onChange: handleChange, required: true, "aria-describedby": errors.relatedSystemId ? "relatedSystemId-error" : undefined, style: errors.relatedSystemId ? { borderColor: ZEN.errorBorder } : undefined, children: [_jsx("option", { value: "", children: "\u2014 Select a system \u2014" }), systems.map((sys) => (_jsx("option", { value: sys.id, children: sys.name }, sys.id)))] }), _jsx(FieldError, { message: errors.relatedSystemId })] }), _jsxs("div", { className: "mb-3", children: [_jsx(RequiredLabel, { htmlFor: "requestedPriority", children: "Priority" }), _jsxs("select", { id: "requestedPriority", name: "requestedPriority", className: "form-select", value: values.requestedPriority, onChange: handleChange, required: true, "aria-describedby": errors.requestedPriority ? "requestedPriority-error" : undefined, style: errors.requestedPriority ? { borderColor: ZEN.errorBorder } : undefined, children: [_jsx("option", { value: "", children: "\u2014 Select a priority \u2014" }), _jsx("option", { value: "Low", children: "Low" }), _jsx("option", { value: "Medium", children: "Medium" }), _jsx("option", { value: "High", children: "High" })] }), _jsx(FieldError, { message: errors.requestedPriority })] }), _jsxs("div", { className: "mb-3", children: [_jsx(RequiredLabel, { htmlFor: "summary", children: "Summary" }), _jsx("input", { id: "summary", name: "summary", type: "text", className: "form-control", value: values.summary, onChange: handleChange, maxLength: 100, required: true, placeholder: "Brief description of the issue (max 100 characters)", "aria-describedby": errors.summary ? "summary-error" : undefined, style: errors.summary ? { borderColor: ZEN.errorBorder } : undefined }), _jsxs("div", { className: "d-flex justify-content-between", children: [_jsx(FieldError, { message: errors.summary }), _jsxs("small", { className: "text-muted ms-auto", children: [values.summary.length, "/100"] })] })] }), _jsxs("div", { className: "mb-4", children: [_jsx(RequiredLabel, { htmlFor: "description", children: "Description" }), _jsx("textarea", { id: "description", name: "description", className: "form-control", value: values.description, onChange: handleChange, maxLength: 1000, required: true, rows: 5, placeholder: "Full details of the issue (max 1000 characters)", "aria-describedby": errors.description ? "description-error" : undefined, style: errors.description ? { borderColor: ZEN.errorBorder } : undefined }), _jsxs("div", { className: "d-flex justify-content-between", children: [_jsx(FieldError, { message: errors.description }), _jsxs("small", { className: "text-muted ms-auto", children: [values.description.length, "/1000"] })] })] }), _jsx(AttachmentSection, { stagedFiles: stagedFiles, attachmentError: attachmentError, onAdd: handleAddFiles, onRemove: handleRemoveFile, disabled: isSubmitting }), _jsxs("div", { className: "d-flex gap-2", children: [_jsx("button", { type: "submit", className: "btn text-white fw-semibold px-4", disabled: isSubmitting, style: {
                                            background: isSubmitting ? "#4a9e73" : ZEN.primary,
                                            border: "none",
                                            borderRadius: 8,
                                            minWidth: 140,
                                            transition: "background 0.2s",
                                        }, children: isSubmitting ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "spinner-border spinner-border-sm me-2", role: "status", "aria-hidden": "true" }), "Submitting\u2026"] })) : ("Submit Ticket") }), _jsx("button", { type: "button", className: "btn btn-outline-secondary", style: { borderRadius: 8 }, disabled: isSubmitting, onClick: onDone, children: "Cancel" })] })] })] })] }));
}
