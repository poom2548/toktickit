import { useState, useEffect } from "react";
import { Category, Requester } from "./api.js";
import DevRequesterSelector from "./DevRequesterSelector.js";
import CreateTicketForm from "./CreateTicketForm.js";
import MyTicketsPage from "./MyTicketsPage.js";
import TicketDetailPage from "./TicketDetailPage.js";

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
  // ---- View toggles ----
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showMyTickets, setShowMyTickets] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);

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
    setSelectedTicketId(null);
  }

  // ---- If no requester is selected → show the selector (dev only) ----
  if (!requester) {
    if (import.meta.env.MODE !== "production") {
      return <DevRequesterSelector onSelect={setRequester} />;
    }

    return (
      <div className="container py-5 text-center" style={{ maxWidth: 480 }}>
        <p className="text-muted">You are not authenticated. Please contact your administrator.</p>
      </div>
    );
  }

  // Hide dashboard controls when a full-screen view is active
  const isDashboardView = !showMyTickets && !showCreateForm && !selectedTicketId;

  // ---- Main dashboard ----
  return (
    <div className="container py-5" style={{ maxWidth: 900 }}>
      {/* Header row */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0">
          TokTickIT <span className="text-success">IT Service Desk</span>
        </h1>
        <div className="d-flex gap-2 align-items-center flex-wrap">
          {/* New Ticket button */}
          {!showCreateForm && !selectedTicketId && (
            <button
              type="button"
              className="btn btn-sm fw-semibold text-white"
              style={{ background: "#006B3C", border: "none", borderRadius: 8 }}
              onClick={() => {
                setShowMyTickets(false);
                setSelectedTicketId(null);
                setShowCreateForm(true);
              }}
            >
              ➕ New Ticket
            </button>
          )}

          {/* My Tickets toggle */}
          {isDashboardView && (
            <button
              type="button"
              className="btn btn-sm fw-semibold text-white"
              style={{ background: "#0d6efd", border: "none", borderRadius: 8 }}
              onClick={async () => {
                setShowCreateForm(false);
                setSelectedTicketId(null);
                if (categories.length === 0) {
                  try {
                    const res = await fetch("/api/categories");
                    if (res.ok) setCategories(await res.json());
                  } catch {}
                }
                setShowMyTickets(true);
              }}
            >
              🎟️ My Tickets
            </button>
          )}

          {/* Back button */}
          {!isDashboardView && (
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              style={{ borderRadius: 8 }}
              onClick={() => {
                // If coming back from ticket detail, go back to my tickets. Otherwise dashboard.
                if (selectedTicketId) {
                  setSelectedTicketId(null);
                  setShowMyTickets(true);
                } else {
                  setShowMyTickets(false);
                  setShowCreateForm(false);
                }
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

      {/* ── Ticket Detail Page (Issue 5) ── */}
      {selectedTicketId !== null && (
        <TicketDetailPage
          ticketId={selectedTicketId}
          requester={requester}
          onBack={() => {
            setSelectedTicketId(null);
            setShowMyTickets(true);
          }}
        />
      )}

      {/* ── My Tickets page (Issue 4) ── */}
      {showMyTickets && selectedTicketId === null && (
        <MyTicketsPage
          requester={requester}
          categories={categories}
          onNewTicket={() => {
            setShowMyTickets(false);
            setShowCreateForm(true);
          }}
          onViewTicket={(id) => {
            setShowMyTickets(false);
            setSelectedTicketId(id);
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
      {isDashboardView && (
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
