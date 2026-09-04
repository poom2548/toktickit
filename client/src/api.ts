const API_BASE = "/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Category {
  id: number;
  name: string;
}

export interface SystemStatus {
  online: boolean;
  categories: Category[];
}

/** A requester returned by GET /api/requesters/active */
export interface Requester {
  id: number;
  name: string;
  email: string;
}

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
 *   headers: { ...getRequesterHeaders(), "Content-Type": "application/json" },
 * });
 */
export function getRequesterHeaders(): { "X-Requester-Id": string } | Record<string, never> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as { id?: unknown };
    const id = Number(parsed?.id);
    if (!id || isNaN(id)) return {};
    return { "X-Requester-Id": String(id) };
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// System check (Issue 2 + Issue 4)
// ---------------------------------------------------------------------------
export async function checkSystem(): Promise<SystemStatus> {
  const healthRes = await fetch(`${API_BASE}/health`);
  if (!healthRes.ok) throw new Error("Health check failed");

  const categoriesRes = await fetch(`${API_BASE}/categories`);
  if (!categoriesRes.ok) throw new Error("Failed to fetch categories");

  const categories: Category[] = await categoriesRes.json();
  return { online: true, categories };
}

// ---------------------------------------------------------------------------
// Requester API (Issue 2)
// ---------------------------------------------------------------------------

/** Fetch all active requesters for the Dev Requester Selector. */
export async function getActiveRequesters(): Promise<Requester[]> {
  const res = await fetch(`${API_BASE}/requesters/active`);
  if (!res.ok) throw new Error("Failed to fetch active requesters");
  return res.json() as Promise<Requester[]>;
}

// ---------------------------------------------------------------------------
// Ticket API (Issue 3)
// ---------------------------------------------------------------------------

export type Priority = "Low" | "Medium" | "High";

export interface RelatedSystem {
  id: number;
  name: string;
}

export interface CreateTicketPayload {
  categoryId: number;
  relatedSystemId: number;
  requestedPriority: Priority;
  summary: string;
  description: string;
}

export interface Ticket {
  id: number;
  ticketNumber: string;
  summary: string;
  description: string;
  status: string;
  requestedPriority: Priority;
  categoryId: number;
  relatedSystemId: number;
  createdAt: string;
  updatedAt: string;
  category?: { id: number; name: string };
  relatedSystem?: { id: number; name: string };
  attachments?: Attachment[];
}

/**
 * Typed API error — thrown by createTicket on HTTP 400.
 * Carries the field-level `details` array from the server's error response
 * so the form component can map errors directly to specific fields.
 */
export class ApiError extends Error {
  status: number;
  details: Array<{ field: string; message: string }>;

  constructor(
    message: string,
    status: number,
    details: Array<{ field: string; message: string }> = []
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

/** Fetch all related systems for the Create Ticket form dropdown. */
export async function getRelatedSystems(): Promise<RelatedSystem[]> {
  const res = await fetch(`${API_BASE}/related-systems`);
  if (!res.ok) throw new Error("Failed to fetch related systems");
  return res.json() as Promise<RelatedSystem[]>;
}

/**
 * Submit a new ticket.
 * - On success (201) returns the created Ticket.
 * - On validation failure (400) throws ApiError with field-level details.
 */
export async function createTicket(payload: CreateTicketPayload): Promise<Ticket> {
  const res = await fetch(`${API_BASE}/tickets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getRequesterHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = (await res.json()) as {
      error?: string;
      details?: Array<{ field: string; message: string }>;
    };
    throw new ApiError(body.error ?? "Request failed", res.status, body.details ?? []);
  }

  return res.json() as Promise<Ticket>;
}

// ---------------------------------------------------------------------------
// Ticket List API (Issue 4)
// ---------------------------------------------------------------------------

/** Pagination metadata returned by GET /api/tickets */
export interface PaginationMeta {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

/** Full response envelope for GET /api/tickets */
export interface TicketListResponse {
  data: Ticket[];
  pagination: PaginationMeta;
}

/** Optional query parameters for GET /api/tickets */
export interface GetTicketsParams {
  search?: string;
  categoryId?: number;
  priority?: string;
  status?: string;
  page?: number;
  limit?: number;
}

/**
 * Fetch the current requester's tickets with optional search, filter, and pagination.
 *
 * Only defined, non-empty params are appended to the query string so the
 * server receives clean input (no stray `&search=` keys).
 */
export async function getTickets(params: GetTicketsParams = {}): Promise<TicketListResponse> {
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
    const body = (await res.json()) as { error?: string };
    throw new ApiError(body.error ?? "Failed to fetch tickets", res.status);
  }

  return res.json() as Promise<TicketListResponse>;
}

// ---------------------------------------------------------------------------
// Ticket Detail & Attachments API (Issue 5)
// ---------------------------------------------------------------------------

export interface Attachment {
  id: number;
  ticketId: number;
  filename: string;
  mimetype: string;
  size: number;
  createdAt: string;
}

export async function getTicketById(ticketId: number): Promise<Ticket> {
  const res = await fetch(`${API_BASE}/tickets/${ticketId}`, {
    headers: { ...getRequesterHeaders() },
  });

  if (!res.ok) {
    const body = (await res.json()) as { error?: string };
    throw new ApiError(body.error ?? "Failed to fetch ticket", res.status);
  }
  return res.json() as Promise<Ticket>;
}

export async function uploadAttachment(ticketId: number, file: File): Promise<Attachment> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/tickets/${ticketId}/attachments`, {
    method: "POST",
    headers: {
      ...getRequesterHeaders(),
    },
    body: formData, // fetch will automatically set the correct Content-Type with boundary
  });

  if (!res.ok) {
    const body = (await res.json()) as { error?: string };
    throw new ApiError(body.error ?? "Failed to upload attachment", res.status);
  }
  return res.json() as Promise<Attachment>;
}

export async function removeAttachment(attachmentId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/attachments/${attachmentId}`, {
    method: "DELETE",
    headers: { ...getRequesterHeaders() },
  });

  if (!res.ok) {
    const body = (await res.json()) as { error?: string };
    throw new ApiError(body.error ?? "Failed to remove attachment", res.status);
  }
}

/**
 * Helper to fetch the attachment file as a blob using the auth header,
 * then trigger a download in the browser.
 */
export async function downloadAttachment(attachmentId: number, filename: string): Promise<void> {
  const res = await fetch(`${API_BASE}/attachments/${attachmentId}/download`, {
    headers: { ...getRequesterHeaders() },
  });

  if (!res.ok) {
    const body = (await res.json()) as { error?: string };
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
