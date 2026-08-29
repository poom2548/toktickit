import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateTicketForm from "../../src/CreateTicketForm";

// ---------------------------------------------------------------------------
// Mock the api module
// ---------------------------------------------------------------------------
vi.mock("../../src/api", () => ({
  getRelatedSystems: vi.fn().mockResolvedValue([
    { id: 1, name: "ERP System" },
    { id: 2, name: "HR Portal" },
  ]),
  createTicket: vi.fn(),
  ApiError: class ApiError extends Error {
    status: number;
    details: Array<{ field: string; message: string }>;
    constructor(
      message: string,
      status: number,
      details: Array<{ field: string; message: string }> = []
    ) {
      super(message);
      this.name = "ApiError";
      this.status = status;
      this.details = details;
    }
  },
}));

// Mock the /api/categories fetch (used when categoriesProp is empty)
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => [
    { id: 1, name: "Hardware" },
    { id: 2, name: "Software" },
  ],
} as Response);

// ---------------------------------------------------------------------------
// Shared props
// ---------------------------------------------------------------------------
const REQUESTER = { id: 1, name: "Alice Johnson", email: "alice@example.com" };
const CATEGORIES = [
  { id: 1, name: "Hardware" },
  { id: 2, name: "Software" },
];
const ON_DONE = vi.fn();

// Helper to get the api mock functions cleanly
async function getApiMocks() {
  const api = await import("../../src/api");
  return {
    createTicket: vi.mocked(api.createTicket),
    ApiError: api.ApiError,
  };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("CreateTicketForm — UI Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ON_DONE.mockReset();
  });

  // ── Empty form submission ────────────────────────────────────────────────

  it("shows inline errors for ALL required fields when form is submitted empty — and does NOT call the API", async () => {
    const { createTicket } = await getApiMocks();
    const user = userEvent.setup();

    render(
      <CreateTicketForm
        requester={REQUESTER}
        categories={CATEGORIES}
        onDone={ON_DONE}
      />
    );

    // Click the submit button without filling anything in
    const submitBtn = screen.getByRole("button", { name: /submit ticket/i });
    await user.click(submitBtn);

    // All required field errors must appear
    expect(await screen.findByText(/category is required/i)).toBeInTheDocument();
    expect(screen.getByText(/related system is required/i)).toBeInTheDocument();
    expect(screen.getByText(/priority is required/i)).toBeInTheDocument();
    expect(screen.getByText(/summary is required/i)).toBeInTheDocument();
    expect(screen.getByText(/description is required/i)).toBeInTheDocument();

    // The API must never have been called
    expect(createTicket).not.toHaveBeenCalled();
  });

  // ── Summary character limit ──────────────────────────────────────────────

  it("shows summary error when summary exceeds 100 characters — and does NOT call the API", async () => {
    const { createTicket } = await getApiMocks();
    const user = userEvent.setup();

    render(
      <CreateTicketForm
        requester={REQUESTER}
        categories={CATEGORIES}
        onDone={ON_DONE}
      />
    );

    // Fill other required fields correctly
    await user.selectOptions(screen.getByLabelText(/category/i), "1");
    await user.selectOptions(screen.getByLabelText(/related system/i), "1");
    await user.selectOptions(screen.getByLabelText(/priority/i), "Low");

    // Use fireEvent.change to bypass the HTML maxLength attribute and set a value
    // longer than 100 chars — this simulates a paste or programmatic override.
    // The client-side validation (not the HTML attribute) should catch this.
    const { fireEvent } = await import("@testing-library/react");
    const summaryInput = screen.getByLabelText(/summary/i);
    fireEvent.change(summaryInput, { target: { value: "A".repeat(101) } });

    await user.type(screen.getByLabelText(/description/i), "Valid description.");

    await user.click(screen.getByRole("button", { name: /submit ticket/i }));

    expect(await screen.findByText(/must not exceed 100/i)).toBeInTheDocument();
    expect(createTicket).not.toHaveBeenCalled();
  });


  // ── Loading state ────────────────────────────────────────────────────────

  it("disables Submit button and shows spinner while API call is pending", async () => {
    const { createTicket } = await getApiMocks();
    const user = userEvent.setup();

    // Simulate a never-resolving API call so we can inspect the loading state
    let resolveCreate!: (val: unknown) => void;
    createTicket.mockReturnValue(new Promise((res) => (resolveCreate = res)));

    render(
      <CreateTicketForm
        requester={REQUESTER}
        categories={CATEGORIES}
        onDone={ON_DONE}
      />
    );

    // Fill all required fields
    await user.selectOptions(screen.getByLabelText(/category/i), "1");
    await user.selectOptions(screen.getByLabelText(/related system/i), "1");
    await user.selectOptions(screen.getByLabelText(/priority/i), "Medium");
    await user.type(screen.getByLabelText(/summary/i), "Screen cracked");
    await user.type(screen.getByLabelText(/description/i), "Details about the screen crack.");

    const submitBtn = screen.getByRole("button", { name: /submit ticket/i });
    await user.click(submitBtn);

    // Button should now be disabled and show loading text
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /submitting/i })).toBeDisabled();
    });

    // Spinner element should be present
    expect(document.querySelector(".spinner-border")).toBeInTheDocument();

    // Resolve the pending promise to clean up
    resolveCreate({ id: 1, ticketNumber: "TKT-0001", summary: "Screen cracked", status: "New" });
  });

  // ── API 400 response maps errors to fields ───────────────────────────────

  it("renders server-returned field errors below the correct inputs on 400 response", async () => {
    const { createTicket, ApiError } = await getApiMocks();
    const user = userEvent.setup();

    createTicket.mockRejectedValue(
      new ApiError("Validation failed", 400, [
        { field: "summary", message: "Summary already exists on a ticket." },
        { field: "relatedSystemId", message: "Related system not found." },
      ])
    );

    render(
      <CreateTicketForm
        requester={REQUESTER}
        categories={CATEGORIES}
        onDone={ON_DONE}
      />
    );

    // Fill all fields to pass client validation
    await user.selectOptions(screen.getByLabelText(/category/i), "1");
    await user.selectOptions(screen.getByLabelText(/related system/i), "1");
    await user.selectOptions(screen.getByLabelText(/priority/i), "High");
    await user.type(screen.getByLabelText(/summary/i), "Valid summary text");
    await user.type(screen.getByLabelText(/description/i), "Valid description text.");

    await user.click(screen.getByRole("button", { name: /submit ticket/i }));

    // Server errors must appear below the right fields
    expect(await screen.findByText(/summary already exists/i)).toBeInTheDocument();
    expect(screen.getByText(/related system not found/i)).toBeInTheDocument();
  });

  // ── Successful submission ────────────────────────────────────────────────

  it("shows success banner with ticketNumber and resets form after 201 response", async () => {
    const { createTicket } = await getApiMocks();
    const user = userEvent.setup();

    createTicket.mockResolvedValue({
      id: 1,
      ticketNumber: "TKT-0042",
      summary: "Screen cracked",
      description: "Details.",
      status: "New",
      requestedPriority: "Medium",
      categoryId: 1,
      relatedSystemId: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    render(
      <CreateTicketForm
        requester={REQUESTER}
        categories={CATEGORIES}
        onDone={ON_DONE}
      />
    );

    await user.selectOptions(screen.getByLabelText(/category/i), "1");
    await user.selectOptions(screen.getByLabelText(/related system/i), "1");
    await user.selectOptions(screen.getByLabelText(/priority/i), "Medium");
    await user.type(screen.getByLabelText(/summary/i), "Screen cracked");
    await user.type(screen.getByLabelText(/description/i), "Details about the crack.");

    await user.click(screen.getByRole("button", { name: /submit ticket/i }));

    // Success banner must show the ticket number
    expect(await screen.findByText(/TKT-0042/)).toBeInTheDocument();
    expect(screen.getByText(/ticket created/i)).toBeInTheDocument();
  });

  // ── Cancel button ────────────────────────────────────────────────────────

  it("calls onDone when Cancel is clicked", async () => {
    const user = userEvent.setup();

    render(
      <CreateTicketForm
        requester={REQUESTER}
        categories={CATEGORIES}
        onDone={ON_DONE}
      />
    );

    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(ON_DONE).toHaveBeenCalledOnce();
  });
});
