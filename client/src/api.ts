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
