import { useState, useEffect } from "react";
import { checkSystem, Category } from "./api.js";

// UI states you must handle for Issue 4: idle, loading, success, error.
type UiState = "idle" | "loading" | "success" | "error";

// เพิ่ม Type สำหรับ Issue 2
type HealthStatus = {
  status: string;
  service: string;
};

export default function App() {
  const [state, setState] = useState<UiState>("idle");
  const [categories, setCategories] = useState<Category[]>([]);
  void categories;

  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch("/api/health");
        if (!res.ok) throw new Error("Network error");
        const data = await res.json();
        setHealthStatus(data);
      } catch (err) {
        setHealthError("⚠️ Unable to connect to backend service. Please check if the server is running.");
      }
    };
    fetchHealth();
  }, []);

  async function handleCheck() {
    // TODO(Issue 4): set loading, call checkSystem(), then either
    //   - success: store categories and show Online + the list, or
    //   - error: show Offline + a useful message.
    setState("loading");
  }

  return (
    <div className="container py-5" style={{ maxWidth: 640 }}>
      <h1 className="h3 mb-4">
        TokTickIT <span className="text-success">IT Service Desk</span>
      </h1>

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
            ⏳ Checking backend status...
          </div>
        )}
      </div>

      <button className="btn btn-success" onClick={handleCheck} disabled={state === "loading"}>
        {state === "loading" ? "Loading…" : "Check System"}
      </button>

      {/* TODO(Issue 4): render loading / success (Online + categories) / error (Offline) states. */}
    </div>
  );
}
