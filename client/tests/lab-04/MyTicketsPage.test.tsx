import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MyTicketsPage from "../../src/MyTicketsPage";

// ---------------------------------------------------------------------------
// Mock the api module
// ---------------------------------------------------------------------------
vi.mock("../../src/api", () => ({
  getTickets: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Shared test data helpers
// ---------------------------------------------------------------------------

const REQUESTER = { id: 1, name: "Alice Johnson", email: "alice@example.com" };
const CATEGORIES = [
  { id: 1, name: "Hardware" },
  { id: 2, name: "Software" },
];

function makeTicket(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: overrides.id ?? 1,
    ticketNumber: overrides.ticketNumber ?? "TKT-0001",
    summary: overrides.summary ?? "My laptop screen is cracked",
    description: overrides.description ?? "The screen cracked after a drop.",
    status: overrides.status ?? "New",
    requestedPriority: overrides.requestedPriority ?? "Medium",
    requesterId: 1,
    categoryId: 1,
    relatedSystemId: 2,
    createdAt: new Date("2026-01-15T10:00:00Z").toISOString(),
    updatedAt: new Date("2026-01-15T10:00:00Z").toISOString(),
    category: { id: 1, name: "Hardware" },
    relatedSystem: { id: 2, name: "ERP System" },
    attachments: [],
    ...overrides,
  };
}

function makePagination(overrides: Partial<Record<string, number>> = {}) {
  return {
    currentPage: overrides.currentPage ?? 1,
    itemsPerPage: overrides.itemsPerPage ?? 10,
    totalItems: overrides.totalItems ?? 1,
    totalPages: overrides.totalPages ?? 1,
    ...overrides,
  };
}

/** Convenience: resolve getTickets with given tickets */
async function mockGetTickets(
  tickets: ReturnType<typeof makeTicket>[],
  paginationOverrides: Partial<Record<string, number>> = {}
) {
  const { getTickets } = await import("../../src/api");
  vi.mocked(getTickets).mockResolvedValue({
    data: tickets,
    pagination: makePagination({
      totalItems: tickets.length,
      totalPages: Math.ceil(tickets.length / 10) || 1,
      ...paginationOverrides,
    }),
  });
  return vi.mocked(getTickets);
}

// ---------------------------------------------------------------------------
// Reset mocks before each test
// ---------------------------------------------------------------------------
beforeEach(async () => {
  vi.clearAllMocks();
  // Default: one ticket, no filters
  await mockGetTickets([makeTicket()]);
});

// ===========================================================================
// E2E-01 — Desktop: search, filter, pagination
// ===========================================================================

describe("E2E-01 — Desktop view: search, filter, and pagination", () => {
  it("renders the ticket table on desktop and shows ticket data", async () => {
    render(
      <MyTicketsPage
        requester={REQUESTER}
        categories={CATEGORIES}
        onNewTicket={vi.fn()}
      />
    );

    // Wait for the initial data to load
    await waitFor(() => {
      expect(screen.queryByText(/loading tickets/i)).not.toBeInTheDocument();
    });

    // The table-view wrapper must be in the DOM with correct Bootstrap classes
    const tableView = screen.getByTestId("table-view");
    expect(tableView).toBeInTheDocument();
    expect(tableView).toHaveClass("d-none", "d-md-block");

    // The ticket data should be visible inside the table (scoped to avoid
    // ambiguity with the card view which also contains the same ticket text)
    expect(within(tableView).getByText("TKT-0001")).toBeInTheDocument();
    expect(within(tableView).getByText("My laptop screen is cracked")).toBeInTheDocument();
  });

  it("E2E-01a — typing a search term and submitting calls getTickets with the search param", async () => {
    const user = userEvent.setup();
    const { getTickets } = await import("../../src/api");
    const mockFn = vi.mocked(getTickets);

    render(
      <MyTicketsPage
        requester={REQUESTER}
        categories={CATEGORIES}
        onNewTicket={vi.fn()}
      />
    );

    await waitFor(() =>
      expect(screen.queryByText(/loading tickets/i)).not.toBeInTheDocument()
    );

    // Type a search query
    const searchInput = screen.getByRole("searchbox", { hidden: true });
    await user.clear(searchInput);
    await user.type(searchInput, "cracked screen");

    // Click the Search button
    const searchBtn = screen.getByRole("button", { name: /apply filters/i });
    await user.click(searchBtn);

    // getTickets must have been called again with the search param
    await waitFor(() => {
      expect(mockFn).toHaveBeenCalledWith(
        expect.objectContaining({ search: "cracked screen" })
      );
    });
  });

  it("E2E-01b — selecting a priority filter calls getTickets with the priority param", async () => {
    const user = userEvent.setup();
    const { getTickets } = await import("../../src/api");
    const mockFn = vi.mocked(getTickets);

    render(
      <MyTicketsPage
        requester={REQUESTER}
        categories={CATEGORIES}
        onNewTicket={vi.fn()}
      />
    );

    await waitFor(() =>
      expect(screen.queryByText(/loading tickets/i)).not.toBeInTheDocument()
    );

    // Select "High" priority
    const prioritySelect = screen.getByRole("combobox", { name: /filter by priority/i });
    await user.selectOptions(prioritySelect, "High");

    // Submit
    await user.click(screen.getByRole("button", { name: /apply filters/i }));

    await waitFor(() => {
      expect(mockFn).toHaveBeenCalledWith(
        expect.objectContaining({ priority: "High" })
      );
    });
  });

  it("E2E-01c — selecting a status filter calls getTickets with the status param", async () => {
    const user = userEvent.setup();
    const { getTickets } = await import("../../src/api");
    const mockFn = vi.mocked(getTickets);

    render(
      <MyTicketsPage
        requester={REQUESTER}
        categories={CATEGORIES}
        onNewTicket={vi.fn()}
      />
    );

    await waitFor(() =>
      expect(screen.queryByText(/loading tickets/i)).not.toBeInTheDocument()
    );

    const statusSelect = screen.getByRole("combobox", { name: /filter by status/i });
    await user.selectOptions(statusSelect, "Resolved");
    await user.click(screen.getByRole("button", { name: /apply filters/i }));

    await waitFor(() => {
      expect(mockFn).toHaveBeenCalledWith(
        expect.objectContaining({ status: "Resolved" })
      );
    });
  });

  it("E2E-01d — selecting a category filter calls getTickets with the categoryId param", async () => {
    const user = userEvent.setup();
    const { getTickets } = await import("../../src/api");
    const mockFn = vi.mocked(getTickets);

    render(
      <MyTicketsPage
        requester={REQUESTER}
        categories={CATEGORIES}
        onNewTicket={vi.fn()}
      />
    );

    await waitFor(() =>
      expect(screen.queryByText(/loading tickets/i)).not.toBeInTheDocument()
    );

    const categorySelect = screen.getByRole("combobox", { name: /filter by category/i });
    await user.selectOptions(categorySelect, "1"); // Hardware
    await user.click(screen.getByRole("button", { name: /apply filters/i }));

    await waitFor(() => {
      expect(mockFn).toHaveBeenCalledWith(
        expect.objectContaining({ categoryId: 1 })
      );
    });
  });

  it("E2E-01e — clicking Next page calls getTickets with page 2", async () => {
    const user = userEvent.setup();
    const { getTickets } = await import("../../src/api");
    const mockFn = vi.mocked(getTickets);

    // Set up 15 total items across 2 pages so the pagination controls render
    mockFn.mockResolvedValue({
      data: Array.from({ length: 10 }, (_, i) =>
        makeTicket({ id: i + 1, ticketNumber: `TKT-${String(i + 1).padStart(4, "0")}` })
      ),
      pagination: makePagination({ totalItems: 15, totalPages: 2, currentPage: 1 }),
    });

    render(
      <MyTicketsPage
        requester={REQUESTER}
        categories={CATEGORIES}
        onNewTicket={vi.fn()}
      />
    );

    // Wait for first page to load and pagination to appear
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument()
    );

    const nextBtn = screen.getByRole("button", { name: /next/i });
    expect(nextBtn).not.toBeDisabled();
    await user.click(nextBtn);

    await waitFor(() => {
      expect(mockFn).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 })
      );
    });
  });

  it("E2E-01f — Reset button clears all filters and reloads with empty params", async () => {
    const user = userEvent.setup();
    const { getTickets } = await import("../../src/api");
    const mockFn = vi.mocked(getTickets);

    render(
      <MyTicketsPage
        requester={REQUESTER}
        categories={CATEGORIES}
        onNewTicket={vi.fn()}
      />
    );

    await waitFor(() =>
      expect(screen.queryByText(/loading tickets/i)).not.toBeInTheDocument()
    );

    // Apply a filter first
    await user.selectOptions(
      screen.getByRole("combobox", { name: /filter by priority/i }),
      "Low"
    );
    await user.click(screen.getByRole("button", { name: /apply filters/i }));

    await waitFor(() => {
      expect(mockFn).toHaveBeenCalledWith(
        expect.objectContaining({ priority: "Low" })
      );
    });

    // Now reset
    await user.click(screen.getByRole("button", { name: /reset filters/i }));

    await waitFor(() => {
      // After reset the call must NOT include priority
      const lastCall = mockFn.mock.calls[mockFn.mock.calls.length - 1][0];
      expect(lastCall.priority).toBeUndefined();
    });
  });
});

// ===========================================================================
// E2E-02 — Responsive layout: Table vs Card
// ===========================================================================

describe("E2E-02 — Responsive layout: Table (desktop) vs Card (mobile)", () => {
  it("table-view wrapper has d-none d-md-block classes (hidden on mobile via Bootstrap)", async () => {
    render(
      <MyTicketsPage
        requester={REQUESTER}
        categories={CATEGORIES}
        onNewTicket={vi.fn()}
      />
    );

    await waitFor(() =>
      expect(screen.queryByText(/loading tickets/i)).not.toBeInTheDocument()
    );

    const tableView = screen.getByTestId("table-view");
    // Bootstrap hides this container on screens < md (768px)
    expect(tableView).toHaveClass("d-none");
    expect(tableView).toHaveClass("d-md-block");
  });

  it("card-view wrapper has d-md-none class (hidden on desktop via Bootstrap)", async () => {
    render(
      <MyTicketsPage
        requester={REQUESTER}
        categories={CATEGORIES}
        onNewTicket={vi.fn()}
      />
    );

    await waitFor(() =>
      expect(screen.queryByText(/loading tickets/i)).not.toBeInTheDocument()
    );

    const cardView = screen.getByTestId("card-view");
    // Bootstrap hides this container on screens ≥ md (768px)
    expect(cardView).toHaveClass("d-md-none");
  });

  it("E2E-02 — both table-view and card-view render the same ticket data", async () => {
    const tickets = [
      makeTicket({ id: 1, ticketNumber: "TKT-0001", summary: "Screen cracked" }),
      makeTicket({ id: 2, ticketNumber: "TKT-0002", summary: "Keyboard not working" }),
    ];

    const { getTickets } = await import("../../src/api");
    vi.mocked(getTickets).mockResolvedValue({
      data: tickets,
      pagination: makePagination({ totalItems: 2 }),
    });

    render(
      <MyTicketsPage
        requester={REQUESTER}
        categories={CATEGORIES}
        onNewTicket={vi.fn()}
      />
    );

    await waitFor(() =>
      expect(screen.queryByText(/loading tickets/i)).not.toBeInTheDocument()
    );

    // ── Desktop (table) — verify both tickets are in table rows
    const tableView = screen.getByTestId("table-view");
    expect(within(tableView).getByText("TKT-0001")).toBeInTheDocument();
    expect(within(tableView).getByText("TKT-0002")).toBeInTheDocument();
    expect(within(tableView).getByText("Screen cracked")).toBeInTheDocument();
    expect(within(tableView).getByText("Keyboard not working")).toBeInTheDocument();

    // ── Mobile (cards) — verify both tickets are in card elements
    const cardView = screen.getByTestId("card-view");
    expect(within(cardView).getByText("TKT-0001")).toBeInTheDocument();
    expect(within(cardView).getByText("TKT-0002")).toBeInTheDocument();
    expect(within(cardView).getAllByTestId("ticket-card")).toHaveLength(2);
  });

  it("E2E-02 — table contains all required column headers", async () => {
    render(
      <MyTicketsPage
        requester={REQUESTER}
        categories={CATEGORIES}
        onNewTicket={vi.fn()}
      />
    );

    await waitFor(() =>
      expect(screen.queryByText(/loading tickets/i)).not.toBeInTheDocument()
    );

    const tableView = screen.getByTestId("table-view");
    expect(within(tableView).getByText(/ticket #/i)).toBeInTheDocument();
    expect(within(tableView).getByText(/summary/i)).toBeInTheDocument();
    expect(within(tableView).getByText(/category/i)).toBeInTheDocument();
    expect(within(tableView).getByText(/priority/i)).toBeInTheDocument();
    expect(within(tableView).getByText(/status/i)).toBeInTheDocument();
    expect(within(tableView).getByText(/date/i)).toBeInTheDocument();
  });

  it("E2E-02 — summary table cell has text-overflow ellipsis styles applied", async () => {
    render(
      <MyTicketsPage
        requester={REQUESTER}
        categories={CATEGORIES}
        onNewTicket={vi.fn()}
      />
    );

    await waitFor(() =>
      expect(screen.queryByText(/loading tickets/i)).not.toBeInTheDocument()
    );

    // Find the summary cell inside the table
    const tableView = screen.getByTestId("table-view");
    const summaryCells = within(tableView).getAllByTitle("My laptop screen is cracked");
    expect(summaryCells.length).toBeGreaterThan(0);

    const summaryCell = summaryCells[0];
    expect(summaryCell).toHaveStyle({ overflow: "hidden" });
    expect(summaryCell).toHaveStyle({ textOverflow: "ellipsis" });
    expect(summaryCell).toHaveStyle({ whiteSpace: "nowrap" });
  });
});

// ===========================================================================
// Empty state
// ===========================================================================

describe("Empty state — no tickets found", () => {
  it("shows 'No tickets found' message when data is empty", async () => {
    const { getTickets } = await import("../../src/api");
    vi.mocked(getTickets).mockResolvedValue({
      data: [],
      pagination: makePagination({ totalItems: 0, totalPages: 0 }),
    });

    render(
      <MyTicketsPage
        requester={REQUESTER}
        categories={CATEGORIES}
        onNewTicket={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    });

    expect(screen.getByText(/no tickets found/i)).toBeInTheDocument();

    // Table and card views must NOT render when there are no tickets
    expect(screen.queryByTestId("table-view")).not.toBeInTheDocument();
    expect(screen.queryByTestId("card-view")).not.toBeInTheDocument();
  });

  it("shows a 'Clear Filters' button in empty state when filters are active", async () => {
    const user = userEvent.setup();
    const { getTickets } = await import("../../src/api");
    const mockFn = vi.mocked(getTickets);

    // First load returns a ticket, second (after filter) returns empty
    mockFn
      .mockResolvedValueOnce({
        data: [makeTicket()],
        pagination: makePagination({ totalItems: 1 }),
      })
      .mockResolvedValue({
        data: [],
        pagination: makePagination({ totalItems: 0, totalPages: 0 }),
      });

    render(
      <MyTicketsPage
        requester={REQUESTER}
        categories={CATEGORIES}
        onNewTicket={vi.fn()}
      />
    );

    await waitFor(() =>
      expect(screen.queryByText(/loading tickets/i)).not.toBeInTheDocument()
    );

    // Apply a filter that yields no results
    await user.selectOptions(
      screen.getByRole("combobox", { name: /filter by status/i }),
      "Closed"
    );
    await user.click(screen.getByRole("button", { name: /apply filters/i }));

    await waitFor(() => {
      expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    });

    // Clear Filters button should appear since filters are active
    expect(screen.getByRole("button", { name: /clear filters/i })).toBeInTheDocument();
  });

  it("shows generic empty message (no 'Clear Filters' button) when no filters are active", async () => {
    const { getTickets } = await import("../../src/api");
    vi.mocked(getTickets).mockResolvedValue({
      data: [],
      pagination: makePagination({ totalItems: 0, totalPages: 0 }),
    });

    render(
      <MyTicketsPage
        requester={REQUESTER}
        categories={CATEGORIES}
        onNewTicket={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/haven't submitted any tickets/i)).toBeInTheDocument();
    });

    expect(screen.queryByRole("button", { name: /clear filters/i })).not.toBeInTheDocument();
  });
});
