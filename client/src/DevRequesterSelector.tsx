import { useState, useEffect } from "react";
import { Requester, getActiveRequesters } from "./api.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SelectorState = "loading" | "success" | "error";

interface Props {
  /** Called with the selected requester when the user confirms their choice. */
  onSelect: (requester: Requester) => void;
}

// ---------------------------------------------------------------------------
// Zen Green colour tokens (Bootstrap success palette)
// ---------------------------------------------------------------------------
const ZEN = {
  primary: "#198754",       // Bootstrap success-600
  primaryLight: "#d1e7dd",  // Bootstrap success-100
  primaryDark: "#0f5132",   // Bootstrap success-900
  hover: "#157347",         // Bootstrap success-700
} as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * DevRequesterSelector — Issue 2
 *
 * A development-only page that lets the tester pick one of the active
 * requesters from the database to act as. The chosen requester's ID is stored
 * in localStorage under the key "toktickit_requester".
 */
export default function DevRequesterSelector({ onSelect }: Props) {
  const [selectorState, setSelectorState] = useState<SelectorState>("loading");
  const [requesters, setRequesters] = useState<Requester[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    getActiveRequesters()
      .then((data) => {
        setRequesters(data);
        setSelectorState("success");
      })
      .catch(() => {
        setErrorMsg("Unable to load requesters. Is the backend running?");
        setSelectorState("error");
      });
  }, []);

  function handleConfirm() {
    const chosen = requesters.find((r) => r.id === selectedId);
    if (!chosen) return;
    // Persist to localStorage so the rest of the app can read X-Requester-Id
    localStorage.setItem("toktickit_requester", JSON.stringify(chosen));
    onSelect(chosen);
  }

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{ background: ZEN.primaryLight }}
    >
      <div
        className="card shadow-sm border-0"
        style={{ width: "100%", maxWidth: 480, borderRadius: 16 }}
      >
        {/* ---- Header ---- */}
        <div
          className="card-header border-0 text-white text-center py-4"
          style={{
            background: `linear-gradient(135deg, ${ZEN.primary} 0%, ${ZEN.primaryDark} 100%)`,
            borderRadius: "16px 16px 0 0",
          }}
        >
          <div style={{ fontSize: 40 }}>🎟️</div>
          <h1 className="h4 mb-1 fw-bold mt-2">TokTickIT</h1>
          <p className="mb-0 opacity-75 small">Development — Select Requester Context</p>
        </div>

        {/* ---- Body ---- */}
        <div className="card-body px-4 py-4">

          {selectorState === "loading" && (
            <div className="text-center py-4">
              <div
                className="spinner-border"
                style={{ color: ZEN.primary }}
                role="status"
                aria-label="Loading requesters"
              />
              <p className="mt-3 text-muted small">Loading active requesters…</p>
            </div>
          )}

          {selectorState === "error" && (
            <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {selectorState === "success" && (
            <>
              <p className="text-muted small mb-3">
                Choose who you are acting as in this development session:
              </p>

              {/* Requester list */}
              <div className="d-flex flex-column gap-2 mb-4">
                {requesters.map((req) => {
                  const isChosen = selectedId === req.id;
                  return (
                    <button
                      key={req.id}
                      type="button"
                      className="btn text-start d-flex align-items-center gap-3"
                      onClick={() => setSelectedId(req.id)}
                      style={{
                        border: `2px solid ${isChosen ? ZEN.primary : "#dee2e6"}`,
                        borderRadius: 12,
                        padding: "12px 16px",
                        background: isChosen ? ZEN.primaryLight : "#fff",
                        transition: "border-color 0.15s, background 0.15s",
                      }}
                      aria-pressed={isChosen}
                    >
                      {/* Avatar bubble */}
                      <span
                        className="d-inline-flex align-items-center justify-content-center fw-bold text-white"
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          background: isChosen ? ZEN.primary : "#6c757d",
                          fontSize: 15,
                          flexShrink: 0,
                          transition: "background 0.15s",
                        }}
                        aria-hidden="true"
                      >
                        {req.name.charAt(0).toUpperCase()}
                      </span>

                      {/* Name + email */}
                      <span className="d-flex flex-column">
                        <span
                          className="fw-semibold"
                          style={{ color: isChosen ? ZEN.primaryDark : "#212529" }}
                        >
                          {req.name}
                        </span>
                        <span className="text-muted" style={{ fontSize: 12 }}>
                          {req.email}
                        </span>
                      </span>

                      {/* Checkmark */}
                      {isChosen && (
                        <span
                          className="ms-auto fw-bold"
                          style={{ color: ZEN.primary, fontSize: 20 }}
                          aria-hidden="true"
                        >
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Confirm button */}
              <button
                type="button"
                className="btn w-100 fw-semibold text-white"
                style={{
                  background: selectedId ? ZEN.primary : "#adb5bd",
                  border: "none",
                  borderRadius: 10,
                  padding: "12px 0",
                  fontSize: 16,
                  cursor: selectedId ? "pointer" : "not-allowed",
                  transition: "background 0.2s",
                }}
                disabled={selectedId === null}
                onClick={handleConfirm}
                onMouseEnter={(e) => {
                  if (selectedId) (e.currentTarget as HTMLButtonElement).style.background = ZEN.hover;
                }}
                onMouseLeave={(e) => {
                  if (selectedId) (e.currentTarget as HTMLButtonElement).style.background = ZEN.primary;
                }}
              >
                {selectedId ? "Continue as selected user →" : "Select a requester to continue"}
              </button>
            </>
          )}
        </div>

        {/* ---- Footer ---- */}
        <div className="card-footer text-center border-0 bg-transparent pb-4">
          <span
            className="badge"
            style={{ background: ZEN.primaryLight, color: ZEN.primaryDark, fontSize: 11 }}
          >
            🔧 Dev Mode — Not for production use
          </span>
        </div>
      </div>
    </div>
  );
}
