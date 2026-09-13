const API_BASE = "/api";
// ---------------------------------------------------------------------------
// Auth header helper
// ---------------------------------------------------------------------------
/** localStorage key where the active requester context is stored. */
const STORAGE_KEY = "toktickit_requester";
/**
 * Reads the active requester from localStorage and returns the
 * `X-Requester-Id` HTTP header object ready to be spread into `fetch()`.
 *
 * Returns an empty object when no requester is stored so that public-route
 * callers are unaffected.
 *
 * @example
 * const res = await fetch(`${API_BASE}/tickets`, {
 *   headers: {  "Content-Type": "application/json" },
 * });
 */
export function getRequesterHeaders() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw)
            return {};
        const parsed = JSON.parse(raw);
        const id = Number(parsed?.id);
        if (!id || isNaN(id))
            return {};
        return { "X-Requester-Id": String(id) };
    }
    catch {
        return {};
    }
}
// ---------------------------------------------------------------------------
// System check (Issue 2 + Issue 4)
// ---------------------------------------------------------------------------
export async function checkSystem() {
    const healthRes = await fetch(`${API_BASE}/health`);
    if (!healthRes.ok)
        throw new Error("Health check failed");
    const categoriesRes = await fetch(`${API_BASE}/categories`);
    if (!categoriesRes.ok)
        throw new Error("Failed to fetch categories");
    const categories = await categoriesRes.json();
    return { online: true, categories };
}
// ---------------------------------------------------------------------------
// Requester API (Issue 2)
// ---------------------------------------------------------------------------
/** Fetch all active requesters for the Dev Requester Selector. */
export async function getActiveRequesters() {
    const res = await fetch(`${API_BASE}/requesters/active`);
    if (!res.ok)
        throw new Error("Failed to fetch active requesters");
    return res.json();
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
    const res = await fetch(`${API_BASE}/related-systems`);
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
    const res = await fetch(`${API_BASE}/tickets`, {
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
    const res = await fetch(url, {
        headers: { ...getRequesterHeaders() },
    });
    if (!res.ok) {
        const body = (await res.json());
        throw new ApiError(body.error ?? "Failed to fetch tickets", res.status);
    }
    return res.json();
}
export async function getTicketById(ticketId) {
    const res = await fetch(`${API_BASE}/tickets/${ticketId}`, {
        headers: { ...getRequesterHeaders() },
    });
    if (!res.ok) {
        const body = (await res.json());
        throw new ApiError(body.error ?? "Failed to fetch ticket", res.status);
    }
    return res.json();
}
export async function uploadAttachment(ticketId, file) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/tickets/${ticketId}/attachments`, {
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
    const res = await fetch(`${API_BASE}/attachments/${attachmentId}`, {
        method: "DELETE",
        headers: { ...getRequesterHeaders() },
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
    const res = await fetch(`${API_BASE}/attachments/${attachmentId}/download`, {
        headers: { ...getRequesterHeaders() },
    });
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
