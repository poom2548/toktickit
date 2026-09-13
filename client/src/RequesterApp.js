import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import CreateTicketForm from "./CreateTicketForm.js";
import MyTicketsPage from "./MyTicketsPage.js";
import TicketDetailPage from "./TicketDetailPage.js";
// ---------------------------------------------------------------------------
// Requester App
// ---------------------------------------------------------------------------
export default function RequesterApp() {
    // ---- Dashboard state ----
    const [state, setState] = useState("idle");
    const [categories, setCategories] = useState([]);
    const [healthStatus, setHealthStatus] = useState(null);
    const [healthError, setHealthError] = useState(null);
    // ---- View toggles ----
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showMyTickets, setShowMyTickets] = useState(false);
    const [selectedTicketId, setSelectedTicketId] = useState(null);
    useEffect(() => {
        const fetchHealth = async () => {
            try {
                const res = await fetch("/api/health");
                if (!res.ok)
                    throw new Error("Network error");
                const data = await res.json();
                setHealthStatus(data);
            }
            catch {
                setHealthError("⚠️ Unable to connect to backend service. Please check if the server is running.");
            }
        };
        fetchHealth();
    }, []);
    async function handleCheck() {
        setState("loading");
        try {
            const res = await fetch("/api/categories");
            if (!res.ok)
                throw new Error("Failed to fetch");
            const data = await res.json();
            setCategories(data);
            setState("success");
        }
        catch {
            setState("error");
        }
    }
    // Hide dashboard controls when a full-screen view is active
    const isDashboardView = !showMyTickets && !showCreateForm && !selectedTicketId;
    // ---- Main dashboard ----
    return (_jsxs("div", { className: "container py-5", style: { maxWidth: 900 }, children: [_jsxs("div", { className: "d-flex align-items-center justify-content-between mb-4", children: [_jsxs("h1", { className: "h3 mb-0", children: ["TokTickIT ", _jsx("span", { className: "text-success", children: "IT Service Desk" })] }), _jsxs("div", { className: "d-flex gap-2 align-items-center flex-wrap", children: [!showCreateForm && !selectedTicketId && (_jsx("button", { type: "button", className: "btn btn-sm fw-semibold text-white", style: { background: "#006B3C", border: "none", borderRadius: 8 }, onClick: () => {
                                    setShowMyTickets(false);
                                    setSelectedTicketId(null);
                                    setShowCreateForm(true);
                                }, children: "\u2795 New Ticket" })), isDashboardView && (_jsx("button", { type: "button", className: "btn btn-sm fw-semibold text-white", style: { background: "#0d6efd", border: "none", borderRadius: 8 }, onClick: async () => {
                                    setShowCreateForm(false);
                                    setSelectedTicketId(null);
                                    if (categories.length === 0) {
                                        try {
                                            const res = await fetch("/api/categories");
                                            if (res.ok)
                                                setCategories(await res.json());
                                        }
                                        catch { }
                                    }
                                    setShowMyTickets(true);
                                }, children: "\uD83C\uDF9F\uFE0F My Tickets" })), !isDashboardView && (_jsx("button", { type: "button", className: "btn btn-outline-secondary btn-sm", style: { borderRadius: 8 }, onClick: () => {
                                    // If coming back from ticket detail, go back to my tickets. Otherwise dashboard.
                                    if (selectedTicketId) {
                                        setSelectedTicketId(null);
                                        setShowMyTickets(true);
                                    }
                                    else {
                                        setShowMyTickets(false);
                                        setShowCreateForm(false);
                                    }
                                }, children: "\u2190 Back" }))] })] }), selectedTicketId !== null && (_jsx(TicketDetailPage, { ticketId: selectedTicketId, onBack: () => {
                    setSelectedTicketId(null);
                    setShowMyTickets(true);
                } })), showMyTickets && selectedTicketId === null && (_jsx(MyTicketsPage, { categories: categories, onNewTicket: () => {
                    setShowMyTickets(false);
                    setShowCreateForm(true);
                }, onViewTicket: (id) => {
                    setShowMyTickets(false);
                    setSelectedTicketId(id);
                } })), showCreateForm && (_jsx(CreateTicketForm, { categories: categories, onDone: () => setShowCreateForm(false) })), isDashboardView && (_jsxs(_Fragment, { children: [_jsx("div", { className: "mb-4", children: healthError ? (_jsx("div", { className: "alert alert-danger", role: "alert", children: healthError })) : healthStatus ? (_jsxs("div", { className: "alert alert-success", role: "alert", children: ["\u2705 ", healthStatus.service, " is running (Status: ", healthStatus.status, ")"] })) : (_jsx("div", { className: "alert alert-secondary", role: "alert", children: "\u23F3 Checking backend status\u2026" })) }), _jsx("button", { className: "btn btn-success", onClick: handleCheck, disabled: state === "loading", children: state === "loading" ? "Loading…" : "Check System" }), _jsxs("div", { className: "mt-4", children: [state === "loading" && (_jsx("div", { className: "alert alert-secondary", children: "\u23F3 Loading categories\u2026" })), state === "error" && (_jsx("div", { className: "alert alert-danger", role: "alert", children: "\u274C Offline: Unable to load categories." })), state === "success" && (_jsxs("div", { children: [_jsx("h5", { className: "text-success mt-3", children: "\u2705 System is Online" }), _jsx("p", { children: "Available Categories:" }), _jsx("ul", { className: "list-group", children: categories.map((cat) => (_jsx("li", { className: "list-group-item", children: cat.name }, cat.id))) })] }))] })] }))] }));
}
