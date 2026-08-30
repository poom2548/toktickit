import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

// ---------------------------------------------------------------------------
// Prisma Mock — vi.hoisted() ensures variables are available when vi.mock()
// factory is hoisted to the top of the file by Vitest.
// ---------------------------------------------------------------------------
const {
  mockTicketFindMany,
  mockTicketCount,
  mockRequesterFindUnique,
} = vi.hoisted(() => ({
  mockTicketFindMany: vi.fn(),
  mockTicketCount: vi.fn(),
  mockRequesterFindUnique: vi.fn(),
}));

vi.mock("../../src/prisma.js", () => ({
  getPrisma: vi.fn().mockReturnValue({
    requester: { findUnique: mockRequesterFindUnique },
    ticket: {
      findMany: mockTicketFindMany,
      count: mockTicketCount,
    },
  }),
}));

// ---------------------------------------------------------------------------
// Shared test data
// ---------------------------------------------------------------------------

const VALID_REQUESTER = { id: 1, isActive: true };

const CATEGORY = { id: 1, name: "Hardware" };
const SYSTEM = { id: 2, name: "ERP System" };

/** Factory for a minimal ticket object returned by findMany */
function makeTicket(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 1,
    ticketNumber: "TKT-0001",
    summary: "My laptop screen is cracked",
    description: "The screen cracked after a drop.",
    status: "New",
    requestedPriority: "Medium",
    requesterId: 1,
    categoryId: 1,
    relatedSystemId: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: CATEGORY,
    relatedSystem: SYSTEM,
    attachments: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Reset mocks to happy-path defaults before each test
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks();

  // Auth middleware: valid requester by default
  mockRequesterFindUnique.mockResolvedValue(VALID_REQUESTER);

  // Default: one ticket found
  mockTicketFindMany.mockResolvedValue([makeTicket()]);
  mockTicketCount.mockResolvedValue(1);
});

// ---------------------------------------------------------------------------
// GET /api/tickets
// ---------------------------------------------------------------------------

describe("GET /api/tickets — list & filter", () => {
  // ── Auth guard ─────────────────────────────────────────────────────────────

  it("401 — missing X-Requester-Id header", async () => {
    const res = await request(app).get("/api/tickets");
    expect(res.status).toBe(401);
  });

  it("401 — requester not found or inactive", async () => {
    mockRequesterFindUnique.mockResolvedValue(null);
    const res = await request(app)
      .get("/api/tickets")
      .set("X-Requester-Id", "99");
    expect(res.status).toBe(401);
  });

  // ── Happy path ──────────────────────────────────────────────────────────────

  it("200 — returns paginated list for the authenticated requester", async () => {
    const res = await request(app)
      .get("/api/tickets")
      .set("X-Requester-Id", "1");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(1);
  });

  // ── Pagination metadata shape ───────────────────────────────────────────────

  it("200 — pagination metadata uses currentPage, itemsPerPage, totalItems, totalPages", async () => {
    mockTicketCount.mockResolvedValue(25);
    mockTicketFindMany.mockResolvedValue(Array(10).fill(makeTicket()));

    const res = await request(app)
      .get("/api/tickets?page=2&limit=10")
      .set("X-Requester-Id", "1");

    expect(res.status).toBe(200);

    const { pagination } = res.body as {
      pagination: {
        currentPage: number;
        itemsPerPage: number;
        totalItems: number;
        totalPages: number;
      };
    };

    expect(pagination.currentPage).toBe(2);
    expect(pagination.itemsPerPage).toBe(10);
    expect(pagination.totalItems).toBe(25);
    expect(pagination.totalPages).toBe(3);

    // Old field names must NOT appear
    expect((pagination as Record<string, unknown>).page).toBeUndefined();
    expect((pagination as Record<string, unknown>).limit).toBeUndefined();
    expect((pagination as Record<string, unknown>).total).toBeUndefined();
  });

  it("200 — limit is capped at 50", async () => {
    mockTicketCount.mockResolvedValue(0);
    mockTicketFindMany.mockResolvedValue([]);

    const res = await request(app)
      .get("/api/tickets?limit=999")
      .set("X-Requester-Id", "1");

    expect(res.status).toBe(200);
    expect(res.body.pagination.itemsPerPage).toBe(50);
  });

  // ── API-06 — Empty state ────────────────────────────────────────────────────

  it("API-06 — 200 with empty array and valid pagination when search matches nothing", async () => {
    // Simulate no tickets found for the given search term
    mockTicketFindMany.mockResolvedValue([]);
    mockTicketCount.mockResolvedValue(0);

    const res = await request(app)
      .get("/api/tickets?search=xyzzy_no_match_possible")
      .set("X-Requester-Id", "1");

    // Must be 200 — NOT 404 or any error status
    expect(res.status).toBe(200);

    // data must be an empty array
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(0);

    // Pagination must still be valid and well-formed
    const { pagination } = res.body as {
      pagination: {
        currentPage: number;
        itemsPerPage: number;
        totalItems: number;
        totalPages: number;
      };
    };
    expect(pagination.currentPage).toBe(1);
    expect(pagination.itemsPerPage).toBeGreaterThan(0);
    expect(pagination.totalItems).toBe(0);
    expect(pagination.totalPages).toBe(0);
  });

  it("API-06 — 200 with empty array when categoryId filter matches nothing", async () => {
    mockTicketFindMany.mockResolvedValue([]);
    mockTicketCount.mockResolvedValue(0);

    const res = await request(app)
      .get("/api/tickets?categoryId=9999")
      .set("X-Requester-Id", "1");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.pagination.totalItems).toBe(0);
  });

  // ── Filter — status ─────────────────────────────────────────────────────────

  it("200 — filters by status query param", async () => {
    const resolvedTicket = makeTicket({ status: "Resolved" });
    mockTicketFindMany.mockResolvedValue([resolvedTicket]);
    mockTicketCount.mockResolvedValue(1);

    const res = await request(app)
      .get("/api/tickets?status=Resolved")
      .set("X-Requester-Id", "1");

    expect(res.status).toBe(200);
    expect(res.body.data[0].status).toBe("Resolved");

    // Verify findMany was called with the correct where clause
    const whereArg = mockTicketFindMany.mock.calls[0][0].where as Record<string, unknown>;
    expect(whereArg.status).toBe("Resolved");
  });

  it("200 — ignores unknown status values (no filter applied)", async () => {
    const res = await request(app)
      .get("/api/tickets?status=InvalidStatus")
      .set("X-Requester-Id", "1");

    expect(res.status).toBe(200);

    // status should NOT appear in the where clause for invalid values
    const whereArg = mockTicketFindMany.mock.calls[0][0].where as Record<string, unknown>;
    expect(whereArg.status).toBeUndefined();
  });

  // ── Filter — priority ───────────────────────────────────────────────────────

  it("200 — filters by priority query param", async () => {
    const highTicket = makeTicket({ requestedPriority: "High" });
    mockTicketFindMany.mockResolvedValue([highTicket]);
    mockTicketCount.mockResolvedValue(1);

    const res = await request(app)
      .get("/api/tickets?priority=High")
      .set("X-Requester-Id", "1");

    expect(res.status).toBe(200);
    expect(res.body.data[0].requestedPriority).toBe("High");

    const whereArg = mockTicketFindMany.mock.calls[0][0].where as Record<string, unknown>;
    expect(whereArg.requestedPriority).toBe("High");
  });

  it("200 — ignores invalid priority values", async () => {
    const res = await request(app)
      .get("/api/tickets?priority=Urgent")
      .set("X-Requester-Id", "1");

    expect(res.status).toBe(200);
    const whereArg = mockTicketFindMany.mock.calls[0][0].where as Record<string, unknown>;
    expect(whereArg.requestedPriority).toBeUndefined();
  });

  // ── Filter — categoryId ─────────────────────────────────────────────────────

  it("200 — filters by categoryId query param", async () => {
    const res = await request(app)
      .get("/api/tickets?categoryId=1")
      .set("X-Requester-Id", "1");

    expect(res.status).toBe(200);
    const whereArg = mockTicketFindMany.mock.calls[0][0].where as Record<string, unknown>;
    expect(whereArg.categoryId).toBe(1);
  });

  // ── Filter — search ─────────────────────────────────────────────────────────

  it("200 — passes OR search clause for summary and description", async () => {
    const res = await request(app)
      .get("/api/tickets?search=cracked")
      .set("X-Requester-Id", "1");

    expect(res.status).toBe(200);

    const whereArg = mockTicketFindMany.mock.calls[0][0].where as {
      OR?: Array<{ summary?: unknown; description?: unknown }>;
    };

    expect(Array.isArray(whereArg.OR)).toBe(true);
    expect(whereArg.OR).toHaveLength(2);
    expect(whereArg.OR![0]).toHaveProperty("summary");
    expect(whereArg.OR![1]).toHaveProperty("description");
  });

  // ── Response — data shape ───────────────────────────────────────────────────

  it("200 — each ticket includes nested category and relatedSystem", async () => {
    const res = await request(app)
      .get("/api/tickets")
      .set("X-Requester-Id", "1");

    expect(res.status).toBe(200);
    const ticket = res.body.data[0] as {
      category?: { id: number; name: string };
      relatedSystem?: { id: number; name: string };
    };
    expect(ticket.category).toBeDefined();
    expect(ticket.relatedSystem).toBeDefined();
  });
});
