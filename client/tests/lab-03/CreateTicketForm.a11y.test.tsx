import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateTicketForm from "../../src/CreateTicketForm";

// ---------------------------------------------------------------------------
// Mocks (same as UI tests — we only test keyboard/a11y behaviour here)
// ---------------------------------------------------------------------------
vi.mock("../../src/api", () => ({
  getRelatedSystems: vi.fn().mockResolvedValue([
    { id: 1, name: "ERP System" },
    { id: 2, name: "HR Portal" },
  ]),
  createTicket: vi.fn().mockResolvedValue({
    id: 1,
    ticketNumber: "TKT-0001",
    summary: "Test",
    status: "New",
    requestedPriority: "Low",
    categoryId: 1,
    relatedSystemId: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }),
  ApiError: class ApiError extends Error {
    status: number;
    details: Array<{ field: string; message: string }>;
    constructor(
      message: string,
      status: number,
      details: Array<{ field: string; message: string }> = []
    ) {
      super(message);
      this.status = status;
      this.details = details;
    }
  },
}));

global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => [{ id: 1, name: "Hardware" }],
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

describe("CreateTicketForm — Accessibility (a11y) Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ON_DONE.mockReset();
  });

  // ── Label association ────────────────────────────────────────────────────

  it("every input/select/textarea is reachable via getByLabelText (label association)", () => {
    render(
      <CreateTicketForm
        requester={REQUESTER}
        categories={CATEGORIES}
        onDone={ON_DONE}
      />
    );

    // These calls throw if the element is not properly associated with its label
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/related system/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/summary/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  // ── Keyboard Tab navigation ──────────────────────────────────────────────

  it("Tab key cycles through all focusable form controls", async () => {
    const user = userEvent.setup();

    render(
      <CreateTicketForm
        requester={REQUESTER}
        categories={CATEGORIES}
        onDone={ON_DONE}
      />
    );

    // Start from document body
    await user.tab();
    // First focusable non-readonly element should be Category select
    const categorySelect = screen.getByLabelText(/category/i);
    expect(document.activeElement).toBe(categorySelect);

    // Tab to Related System
    await user.tab();
    expect(document.activeElement).toBe(screen.getByLabelText(/related system/i));

    // Tab to Priority
    await user.tab();
    expect(document.activeElement).toBe(screen.getByLabelText(/priority/i));

    // Tab to Summary
    await user.tab();
    expect(document.activeElement).toBe(screen.getByLabelText(/summary/i));

    // Tab to Description
    await user.tab();
    expect(document.activeElement).toBe(screen.getByLabelText(/description/i));

    // Tab to Submit button
    await user.tab();
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: /submit ticket/i })
    );

    // Tab to Cancel button
    await user.tab();
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: /cancel/i })
    );
  });

  // ── Enter key fires submission ───────────────────────────────────────────

  it("pressing Enter while Submit button is focused triggers form submission", async () => {
    const user = userEvent.setup();
    const api = await import("../../src/api");
    const createTicketMock = vi.mocked(api.createTicket);

    render(
      <CreateTicketForm
        requester={REQUESTER}
        categories={CATEGORIES}
        onDone={ON_DONE}
      />
    );

    // Fill all required fields first so client validation passes
    await user.selectOptions(screen.getByLabelText(/category/i), "1");
    await user.selectOptions(screen.getByLabelText(/related system/i), "1");
    await user.selectOptions(screen.getByLabelText(/priority/i), "Low");
    await user.type(screen.getByLabelText(/summary/i), "Test summary");
    await user.type(screen.getByLabelText(/description/i), "Test description text.");

    // Focus the submit button and press Enter
    const submitBtn = screen.getByRole("button", { name: /submit ticket/i });
    submitBtn.focus();
    await user.keyboard("{Enter}");

    // API should have been called (Enter triggered submission)
    expect(createTicketMock).toHaveBeenCalledOnce();
  });

  // ── role="alert" on error messages ──────────────────────────────────────

  it("inline error messages use role=alert so screen readers announce them", async () => {
    const user = userEvent.setup();

    render(
      <CreateTicketForm
        requester={REQUESTER}
        categories={CATEGORIES}
        onDone={ON_DONE}
      />
    );

    // Submit empty form to trigger errors
    await user.click(screen.getByRole("button", { name: /submit ticket/i }));

    // Wait for errors to appear, then check they all carry role="alert"
    const alerts = await screen.findAllByRole("alert");
    expect(alerts.length).toBeGreaterThanOrEqual(5); // one per required field
  });

  // ── Focus ring — no outline:none ─────────────────────────────────────────

  it("inputs do NOT suppress the browser focus ring (no outline:none)", () => {
    render(
      <CreateTicketForm
        requester={REQUESTER}
        categories={CATEGORIES}
        onDone={ON_DONE}
      />
    );

    const summary = screen.getByLabelText(/summary/i) as HTMLInputElement;
    const computedStyle = window.getComputedStyle(summary);
    // outline should NOT be explicitly set to "none" or "0"
    expect(computedStyle.outline).not.toBe("none");
    expect(computedStyle.outlineWidth).not.toBe("0px");
  });

  // ── Required field indicators (red asterisk) ─────────────────────────────

  it("every required field label has a visible red asterisk that is hidden from screen readers", () => {
    render(
      <CreateTicketForm
        requester={REQUESTER}
        categories={CATEGORIES}
        onDone={ON_DONE}
      />
    );

    // Asterisks are <span aria-hidden="true"> — they should exist in the DOM
    // but not be visible to assistive technology
    const hiddenAsterisks = document
      .querySelectorAll('[aria-hidden="true"]');
    const asterisks = Array.from(hiddenAsterisks).filter(
      (el) => el.textContent?.trim() === "*"
    );
    // There are 5 required fields (category, system, priority, summary, description)
    expect(asterisks.length).toBeGreaterThanOrEqual(5);
  });
});
