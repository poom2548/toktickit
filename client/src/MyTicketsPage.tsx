import { useState, useEffect, FormEvent } from "react";
import {
  Category,
  Ticket,
  PaginationMeta,
  Requester,
  getTickets,
} from "./api.js";

// ---------------------------------------------------------------------------
// Zen Green colour tokens (consistent with other components)
// ---------------------------------------------------------------------------
const ZEN = {
  primary: "#006B3C",
  primaryLight: "#e8f5ee",
  primaryDark: "#004d2b",
  badgeBg: "#e8f5ee",
  badgeText: "#004d2b",
} as const;

// ---------------------------------------------------------------------------
// Allowed filter values
// ---------------------------------------------------------------------------
const PRIORITIES = ["Low", "Medium", "High"] as const;
const STATUSES = ["New", "In Progress", "Resolved", "Closed"] as const;

// ---------------------------------------------------------------------------
// Priority / Status badge colours
// ---------------------------------------------------------------------------
const PRIORITY_COLORS: Record<string, string> = {
  Low: "#198754",
  Medium: "#fd7e14",
  High: "#dc3545",
};

const STATUS_COLORS: Record<string, string> = {
  New: "#0d6efd",
  "In Progress": "#fd7e14",
  Resolved: "#198754",
  Closed: "#6c757d",
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Small coloured badge used for Priority and Status columns */
function Badge({ label, colorMap }: { label: string; colorMap: Record<string, string> }) {
  const bg = colorMap[label] ?? "#6c757d";
  return (
    <span
      className="badge"
      style={{
        background: bg,
        fontSize: 11,
        letterSpacing: 0.3,
        padding: "3px 8px",
        borderRadius: 6,
      }}
    >
      {label}
    </span>
  );
}

/** Format an ISO date string to a compact locale date */
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Desktop Table Row
// ---------------------------------------------------------------------------
function TicketTableRow({ ticket }: { ticket: Ticket }) {
  return (
    <tr>
      <td className="text-muted small" style={{ whiteSpace: "nowrap" }}>
        {ticket.ticketNumber}
      </td>
      <td
        style={{
          maxWidth: 220,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={ticket.summary}
      >
        {ticket.summary}
      </td>
      <td className="small">{ticket.category?.name ?? "—"}</td>
      <td>
        <Badge label={ticket.requestedPriority} colorMap={PRIORITY_COLORS} />
      </td>
      <td>
        <Badge label={ticket.status} colorMap={STATUS_COLORS} />
      </td>
      <td className="text-muted small" style={{ whiteSpace: "nowrap" }}>
        {formatDate(ticket.createdAt)}
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Mobile Card
// ---------------------------------------------------------------------------
function TicketCard({ ticket }: { ticket: Ticket }) {
  return (
    <div
      className="card mb-2 border-0 shadow-sm"
      style={{ borderRadius: 10 }}
      data-testid="ticket-card"
    >
      <div className="card-body py-3 px-3">
        {/* Ticket number + date */}
        <div className="d-flex justify-content-between align-items-start mb-1">
          <span className="fw-semibold small" style={{ color: ZEN.primary }}>
            {ticket.ticketNumber}
          </span>
          <span className="text-muted" style={{ fontSize: 11 }}>
            {formatDate(ticket.createdAt)}
          </span>
        </div>
        {/* Summary */}
        <p className="mb-2 fw-semibold" style={{ lineHeight: 1.4 }}>
          {ticket.summary}
        </p>
        {/* Category */}
        {ticket.category && (
          <p className="mb-2 text-muted small">{ticket.category.name}</p>
        )}
        {/* Badges */}
        <div className="d-flex gap-2 flex-wrap">
          <Badge label={ticket.requestedPriority} colorMap={PRIORITY_COLORS} />
          <Badge label={ticket.status} colorMap={STATUS_COLORS} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Filter bar
// ---------------------------------------------------------------------------
interface FilterBarProps {
  search: string;
  categoryId: string;
  priority: string;
  status: string;
  categories: Category[];
  onSearch: (s: string) => void;
  onCategoryId: (v: string) => void;
  onPriority: (v: string) => void;
  onStatus: (v: string) => void;
  onSubmit: () => void;
  onReset: () => void;
}

function FilterBar({
  search,
  categoryId,
  priority,
  status,
  categories,
  onSearch,
  onCategoryId,
  onPriority,
  onStatus,
  onSubmit,
  onReset,
}: FilterBarProps) {
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-4"
      role="search"
      aria-label="Filter tickets"
    >
      <div className="row g-2">
        {/* Search */}
        <div className="col-12 col-sm-6 col-lg-4">
          <input
            type="search"
            className="form-control"
            placeholder="Search summary or description…"
            aria-label="Search"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>

        {/* Category */}
        <div className="col-6 col-sm-3 col-lg-2">
          <select
            className="form-select"
            aria-label="Filter by category"
            value={categoryId}
            onChange={(e) => onCategoryId(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={String(cat.id)}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Priority */}
        <div className="col-6 col-sm-3 col-lg-2">
          <select
            className="form-select"
            aria-label="Filter by priority"
            value={priority}
            onChange={(e) => onPriority(e.target.value)}
          >
            <option value="">All Priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div className="col-6 col-sm-3 col-lg-2">
          <select
            className="form-select"
            aria-label="Filter by status"
            value={status}
            onChange={(e) => onStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="col-6 col-sm-3 col-lg-2 d-flex gap-2">
          <button
            type="submit"
            className="btn text-white flex-fill"
            style={{ background: ZEN.primary, border: "none", borderRadius: 8 }}
            aria-label="Apply filters"
          >
            Search
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary flex-fill"
            style={{ borderRadius: 8 }}
            onClick={onReset}
            aria-label="Reset filters"
          >
            Reset
          </button>
        </div>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Pagination controls
// ---------------------------------------------------------------------------
interface PaginationControlsProps {
  pagination: PaginationMeta;
  onPage: (p: number) => void;
}

function PaginationControls({ pagination, onPage }: PaginationControlsProps) {
  const { currentPage, totalPages } = pagination;
  if (totalPages <= 1) return null;

  return (
    <div
      className="d-flex align-items-center justify-content-between mt-3"
      aria-label="Pagination"
    >
      <button
        className="btn btn-outline-secondary btn-sm"
        style={{ borderRadius: 8 }}
        disabled={currentPage <= 1}
        onClick={() => onPage(currentPage - 1)}
        aria-label="Previous page"
      >
        ← Previous
      </button>

      <span className="text-muted small">
        Page {currentPage} of {totalPages}
      </span>

      <button
        className="btn btn-outline-secondary btn-sm"
        style={{ borderRadius: 8 }}
        disabled={currentPage >= totalPages}
        onClick={() => onPage(currentPage + 1)}
        aria-label="Next page"
      >
        Next →
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface Props {
  requester: Requester;
  categories: Category[];
  onNewTicket: () => void;
}

// ---------------------------------------------------------------------------
// MyTicketsPage
// ---------------------------------------------------------------------------

/**
 * MyTicketsPage — Issue 4
 *
 * Displays the current requester's tickets with:
 * - Search + filter bar (summary/description, category, priority, status)
 * - Desktop (≥768px): Bootstrap <table> with text-overflow ellipsis on summary
 * - Mobile (<768px): vertical card stack — no horizontal scroll
 * - Pagination controls
 * - "No tickets found" empty state
 */
export default function MyTicketsPage({ requester: _requester, categories, onNewTicket }: Props) {
  // ── Filter state ──────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");

  // ── Applied filter state (only changes on Search submit or Reset) ─────────
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedCategoryId, setAppliedCategoryId] = useState("");
  const [appliedPriority, setAppliedPriority] = useState("");
  const [appliedStatus, setAppliedStatus] = useState("");

  // ── Pagination ────────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);

  // ── Data state ────────────────────────────────────────────────────────────
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch whenever applied filters or page changes ────────────────────────
  useEffect(() => {
    setLoading(true);
    setError(null);

    getTickets({
      search: appliedSearch || undefined,
      categoryId: appliedCategoryId ? Number(appliedCategoryId) : undefined,
      priority: appliedPriority || undefined,
      status: appliedStatus || undefined,
      page: currentPage,
      limit: 10,
    })
      .then((res) => {
        setTickets(res.data);
        setPagination(res.pagination);
      })
      .catch(() => {
        setError("Unable to load tickets. Please check your connection and try again.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [appliedSearch, appliedCategoryId, appliedPriority, appliedStatus, currentPage]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleSearch() {
    setCurrentPage(1);
    setAppliedSearch(search);
    setAppliedCategoryId(categoryId);
    setAppliedPriority(priority);
    setAppliedStatus(status);
  }

  function handleReset() {
    setSearch("");
    setCategoryId("");
    setPriority("");
    setStatus("");
    setCurrentPage(1);
    setAppliedSearch("");
    setAppliedCategoryId("");
    setAppliedPriority("");
    setAppliedStatus("");
  }

  const hasActiveFilters =
    appliedSearch || appliedCategoryId || appliedPriority || appliedStatus;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* ── Page header ── */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h2 className="h4 mb-0" style={{ color: ZEN.primaryDark }}>
          🎟️ My Tickets
        </h2>
        <button
          type="button"
          className="btn btn-sm fw-semibold text-white"
          style={{ background: ZEN.primary, border: "none", borderRadius: 8 }}
          onClick={onNewTicket}
          aria-label="Create a new ticket"
        >
          ➕ New Ticket
        </button>
      </div>

      {/* ── Filter bar ── */}
      <FilterBar
        search={search}
        categoryId={categoryId}
        priority={priority}
        status={status}
        categories={categories}
        onSearch={setSearch}
        onCategoryId={setCategoryId}
        onPriority={setPriority}
        onStatus={setStatus}
        onSubmit={handleSearch}
        onReset={handleReset}
      />

      {/* ── Error banner ── */}
      {error && (
        <div className="alert alert-danger" role="alert">
          ❌ {error}
        </div>
      )}

      {/* ── Loading spinner ── */}
      {loading && (
        <div className="text-center py-5" aria-label="Loading tickets">
          <div
            className="spinner-border"
            style={{ color: ZEN.primary }}
            role="status"
            aria-hidden="true"
          />
          <p className="mt-3 text-muted small">Loading tickets…</p>
        </div>
      )}

      {/* ── Content ── */}
      {!loading && !error && (
        <>
          {/* ── Empty state ── */}
          {tickets.length === 0 && (
            <div className="text-center py-5" data-testid="empty-state">
              <div style={{ fontSize: 48 }}>🔍</div>
              <h3 className="h5 mt-3 text-muted">No tickets found</h3>
              <p className="text-muted small">
                {hasActiveFilters
                  ? "No tickets match your current filters. Try adjusting your search."
                  : "You haven't submitted any tickets yet."}
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm mt-2"
                  style={{ borderRadius: 8 }}
                  onClick={handleReset}
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {/* ── Desktop table (hidden on mobile: < md = 768px) ── */}
          {tickets.length > 0 && (
            <div className="d-none d-md-block" data-testid="table-view">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th scope="col" style={{ width: 110 }}>
                        Ticket #
                      </th>
                      <th scope="col">Summary</th>
                      <th scope="col" style={{ width: 130 }}>
                        Category
                      </th>
                      <th scope="col" style={{ width: 90 }}>
                        Priority
                      </th>
                      <th scope="col" style={{ width: 110 }}>
                        Status
                      </th>
                      <th scope="col" style={{ width: 110 }}>
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((ticket) => (
                      <TicketTableRow key={ticket.id} ticket={ticket} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Mobile cards (hidden on desktop: ≥ md = 768px) ── */}
          {tickets.length > 0 && (
            <div className="d-md-none" data-testid="card-view">
              {tickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))}
            </div>
          )}

          {/* ── Pagination ── */}
          {pagination && (
            <PaginationControls pagination={pagination} onPage={setCurrentPage} />
          )}
        </>
      )}
    </div>
  );
}
