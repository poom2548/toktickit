import { useState, useEffect } from "react";
import { Category, Requester } from "./api.js";
import DevRequesterSelector from "./DevRequesterSelector.js";
import CreateTicketForm from "./CreateTicketForm.js";
import MyTicketsPage from "./MyTicketsPage.js";


// UI states for the main dashboard
type UiState = "idle" | "loading" | "success" | "error";

// localStorage key where the active requester is stored
const STORAGE_KEY = "toktickit_requester";

type HealthStatus = {
  status: string;
  service: string;
};

// ---------------------------------------------------------------------------
// Main App
// ---------------------------------------------------------------------------

export default function App() {
  // ---- Requester context (Issue 2) ----
  const [requester, setRequester] = useState<Requester | null>(() => {
    // Read from localStorage on first render
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Requester) : null;
    } catch {
      return null;
    }
  });

  // ---- Dashboard state ----
  const [state, setState] = useState<UiState>("idle");
  const [categories, setCategories] = useState<Category[]>([]);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  // ---- Create Ticket form toggle (Issue 3) ----
  const [showCreateForm, setShowCreateForm] = useState(false);
  // ---- My Tickets page toggle (Issue 4) ----
  const [showMyTickets, setShowMyTickets] = useState(false);


  useEffect(() => {
    if (!requester) return; // Don't poll health until a requester is selected

    const fetchHealth = async () => {
      try {
        const res = await fetch("/api/health");
        if (!res.ok) throw new Error("Network error");
        const data = await res.json();
        setHealthStatus(data);
      } catch {
        setHealthError(
          "⚠️ Unable to connect to backend service. Please check if the server is running."
        );
      }
    };
    fetchHealth();
  }, [requester]);

  async function handleCheck() {
    setState("loading");
    try {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCategories(data);
      setState("success");
    } catch {
      setState("error");
    }
  }

  function handleSwitchUser() {
    localStorage.removeItem(STORAGE_KEY);
    setRequester(null);
    setState("idle");
    setHealthStatus(null);
    setHealthError(null);
    setCategories([]);
    setShowCreateForm(false);
    setShowMyTickets(false);
  }

  // ---- If no requester is selected → show the selector (dev only) ----
  if (!requester) {
    // DevRequesterSelector must not be accessible in production.
    // `import.meta.env.MODE` is "development" in `vite dev` and "production"
    // in `vite build`, so this guard is evaluated at runtime after Vite
    // replaces the env variable at build time.
    if (import.meta.env.MODE !== "production") {
      return <DevRequesterSelector onSelect={setRequester} />;
    }

    // Production fallback — show a neutral unauthenticated state.
    return (
      <div className="container py-5 text-center" style={{ maxWidth: 480 }}>
        <p className="text-muted">You are not authenticated. Please contact your administrator.</p>
      </div>
    );
  }

  // ---- Main dashboard ----
  return (
    <div className="container py-5" style={{ maxWidth: 900 }}>
      {/* Header row */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0">
          TokTickIT <span className="text-success">IT Service Desk</span>
        </h1>
        <div className="d-flex gap-2 align-items-center flex-wrap">
          {/* New Ticket button — hidden when create form is already open */}
          {!showCreateForm && (
            <button
              type="button"
              className="btn btn-sm fw-semibold text-white"
              style={{ background: "#006B3C", border: "none", borderRadius: 8 }}
              onClick={() => {
                setShowMyTickets(false);
                setShowCreateForm(true);
              }}
            >
              ➕ New Ticket
            </button>
          )}

          {/* My Tickets toggle — hidden while already on that page or create form */}
          {!showMyTickets && !showCreateForm && (
            <button
              type="button"
              className="btn btn-sm fw-semibold text-white"
              style={{ background: "#0d6efd", border: "none", borderRadius: 8 }}
              onClick={async () => {
                setShowCreateForm(false);
                // Pre-fetch categories if not yet loaded so filter dropdown is ready
                if (categories.length === 0) {
                  try {
                    const res = await fetch("/api/categories");
                    if (res.ok) setCategories(await res.json());
                  } catch {
                    // ignore — MyTicketsPage will still work without categories in filter
                  }
                }
                setShowMyTickets(true);
              }}
            >
              🎟️ My Tickets
            </button>
          )}

          {/* Back button — shown while in My Tickets or Create Ticket views */}
          {(showMyTickets || showCreateForm) && (
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              style={{ borderRadius: 8 }}
              onClick={() => {
                setShowMyTickets(false);
                setShowCreateForm(false);
              }}
            >
              ← Back
            </button>
          )}

          {/* Switch user */}
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={handleSwitchUser}
            title="Change the active dev requester"
          >
            👤 {requester.name} &nbsp;<span className="opacity-50">✕</span>
          </button>
        </div>
      </div>

      {/* ── My Tickets page (Issue 4) ── */}
      {showMyTickets && (
        <MyTicketsPage
          requester={requester}
          categories={categories}
          onNewTicket={() => {
            setShowMyTickets(false);
            setShowCreateForm(true);
          }}
        />
      )}

      {/* ── Create Ticket form (Issue 3) ── */}
      {showCreateForm && (
        <CreateTicketForm
          requester={requester}
          categories={categories}
          onDone={() => setShowCreateForm(false)}
        />
      )}

      {/* ── Dashboard (default view) ── */}
      {!showMyTickets && !showCreateForm && (
        <>
          {/* Health banner */}
          <div className="mb-4">
            {healthError ? (
              <div className="alert alert-danger" role="alert">
                {healthError}
              </div>
            ) : healthStatus ? (
              <div className="alert alert-success" role="alert">
                ✅ {healthStatus.service} is running (Status: {healthStatus.status})
              </div>
            ) : (
              <div className="alert alert-secondary" role="alert">
                ⏳ Checking backend status…
              </div>
            )}
          </div>

          <button
            className="btn btn-success"
            onClick={handleCheck}
            disabled={state === "loading"}
          >
            {state === "loading" ? "Loading…" : "Check System"}
          </button>

          {/* Category results */}
          <div className="mt-4">
            {state === "loading" && (
              <div className="alert alert-secondary">⏳ Loading categories…</div>
            )}
            {state === "error" && (
              <div className="alert alert-danger" role="alert">
                ❌ Offline: Unable to load categories.
              </div>
            )}
            {state === "success" && (
              <div>
                <h5 className="text-success mt-3">✅ System is Online</h5>
                <p>Available Categories:</p>
                <ul className="list-group">
                  {categories.map((cat) => (
                    <li key={cat.id} className="list-group-item">
                      {cat.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
