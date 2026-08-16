import { useState, useEffect } from "react";
import { Category } from "./api.js";

// UI states you must handle for Issue 4: idle, loading, success, error.
type UiState = "idle" | "loading" | "success" | "error";

// Type สำหรับ Issue 2
type HealthStatus = {
  status: string;
  service: string;
};

export default function App() {
  const [state, setState] = useState<UiState>("idle");
  const [categories, setCategories] = useState<Category[]>([]);

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
    setState("loading"); // Issue 4: set loading
    try {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to fetch");
      
      const data = await res.json();
      setCategories(data);
      setState("success"); // Issue 4: success state
    } catch (err) {
      setState("error");   // Issue 4: error state
    }
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

      {/* ส่วนแสดงผลข้อมูล Issue 4 */}
      <div className="mt-4">
        {state === "loading" && (
          <div className="alert alert-secondary">⏳ Loading categories...</div>
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
    </div>
  );
}
