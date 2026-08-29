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
