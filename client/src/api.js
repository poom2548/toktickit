import { apiFetch } from "./utils/api";
const API_BASE = "/api";
// ---------------------------------------------------------------------------
// Auth header helper
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// System check (Issue 2 + Issue 4)
// ---------------------------------------------------------------------------
export async function checkSystem() {
    const healthRes = await apiFetch(`${API_BASE}/health`);
    if (!healthRes.ok)
        throw new Error("Health check failed");
    const categoriesRes = await apiFetch(`${API_BASE}/categories`);
    if (!categoriesRes.ok)
        throw new Error("Failed to fetch categories");
    const categories = await categoriesRes.json();
    return { online: true, categories };
}
/**
 * Typed API error — thrown by createTicket on HTTP 400.
 * Carries the field-level `details` array from the server's error response
 * so the form component can map errors directly to specific fields.
 */
export class ApiError extends Error {
    status;
    details;
    constructor(message, status, details = []) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.details = details;
    }
}
/** Fetch all related systems for the Create Ticket form dropdown. */
export async function getRelatedSystems() {
    const res = await apiFetch(`${API_BASE}/related-systems`);
    if (!res.ok)
        throw new Error("Failed to fetch related systems");
    return res.json();
}
/**
 * Submit a new ticket.
 * - On success (201) returns the created Ticket.
 * - On validation failure (400) throws ApiError with field-level details.
 */
export async function createTicket(payload) {
    const res = await apiFetch(`${API_BASE}/tickets`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const body = (await res.json());
        throw new ApiError(body.error ?? "Request failed", res.status, body.details ?? []);
    }
    return res.json();
}
/**
 * Fetch the current requester's tickets with optional search, filter, and pagination.
 *
 * Only defined, non-empty params are appended to the query string so the
 * server receives clean input (no stray `&search=` keys).
 */
export async function getTickets(params = {}) {
    const qs = new URLSearchParams();
    if (params.search && params.search.trim().length > 0) {
        qs.set("search", params.search.trim());
    }
    if (params.categoryId !== undefined) {
        qs.set("categoryId", String(params.categoryId));
    }
    if (params.priority) {
        qs.set("priority", params.priority);
    }
    if (params.status) {
        qs.set("status", params.status);
    }
    if (params.page !== undefined) {
        qs.set("page", String(params.page));
    }
    if (params.limit !== undefined) {
        qs.set("limit", String(params.limit));
    }
    const query = qs.toString();
    const url = query ? `${API_BASE}/tickets?${query}` : `${API_BASE}/tickets`;
    const res = await apiFetch(url, {});
    if (!res.ok) {
        const body = (await res.json());
        throw new ApiError(body.error ?? "Failed to fetch tickets", res.status);
    }
    return res.json();
}
export async function getTicketById(ticketId) {
    const res = await apiFetch(`${API_BASE}/tickets/${ticketId}`, {});
    if (!res.ok) {
        const body = (await res.json());
        throw new ApiError(body.error ?? "Failed to fetch ticket", res.status);
    }
    return res.json();
}
export async function uploadAttachment(ticketId, file) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await apiFetch(`${API_BASE}/tickets/${ticketId}/attachments`, {
        method: "POST",
        body: formData, // fetch will automatically set the correct Content-Type with boundary
    });
    if (!res.ok) {
        const body = (await res.json());
        throw new ApiError(body.error ?? "Failed to upload attachment", res.status);
    }
    return res.json();
}
export async function removeAttachment(attachmentId) {
    const res = await apiFetch(`${API_BASE}/attachments/${attachmentId}`, {
        method: "DELETE",
    });
    if (!res.ok) {
        const body = (await res.json());
        throw new ApiError(body.error ?? "Failed to remove attachment", res.status);
    }
}
/**
 * Helper to fetch the attachment file as a blob using the auth header,
 * then trigger a download in the browser.
 */
export async function downloadAttachment(attachmentId, filename) {
    const res = await apiFetch(`${API_BASE}/attachments/${attachmentId}/download`, {});
    if (!res.ok) {
        const body = (await res.json());
        throw new ApiError(body.error ?? "Failed to download attachment", res.status);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
export async function getComments(ticketId) {
    const res = await apiFetch(`/api/tickets/${ticketId}/comments`);
    if (!res.ok)
        throw new Error("Failed to fetch comments");
    const data = await res.json();
    return data.comments;
}
export async function postComment(ticketId, content) {
    const res = await apiFetch(`/api/tickets/${ticketId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content })
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to post comment");
    }
    return res.json();
}
export async function markResolved(ticketId) {
    const res = await apiFetch(`/api/tickets/${ticketId}/resolved-flag`, {
        method: "PATCH",
        body: JSON.stringify({ problemAppearsResolved: true })
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to mark resolved");
    }
    return res.json();
}
