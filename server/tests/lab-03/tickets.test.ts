import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

// ---------------------------------------------------------------------------
// Prisma Mock — use vi.hoisted() so variables are available when vi.mock()
// factory is hoisted to the top of the file by Vitest.
// ---------------------------------------------------------------------------
const {
  mockTicketCreate,
  mockTransaction,
  mockCategoryFindUnique,
  mockRelatedSystemFindUnique,
  mockRequesterFindUnique,
} = vi.hoisted(() => ({
  mockTicketCreate: vi.fn(),
  mockTransaction: vi.fn(),
  mockCategoryFindUnique: vi.fn(),
  mockRelatedSystemFindUnique: vi.fn(),
  mockRequesterFindUnique: vi.fn(),
}));

vi.mock("../../src/prisma.js", () => ({
  getPrisma: vi.fn().mockReturnValue({
    requester: { findUnique: mockRequesterFindUnique },
    category: { findUnique: mockCategoryFindUnique },
    relatedSystem: { findUnique: mockRelatedSystemFindUnique },
    ticket: { create: mockTicketCreate },
    $transaction: mockTransaction,
  }),
}));

// ---------------------------------------------------------------------------
// Shared test data
// ---------------------------------------------------------------------------

const VALID_REQUESTER = { id: 1, isActive: true };
const VALID_CATEGORY = { id: 1, name: "Hardware" };
const VALID_SYSTEM = { id: 2, name: "ERP System" };

const VALID_PAYLOAD = {
  categoryId: 1,
  relatedSystemId: 2,
  requestedPriority: "Medium",
  summary: "My laptop screen is cracked",
  description: "The screen cracked after dropping the laptop on my desk.",
};

const CREATED_TICKET = {
  id: 1,
  ticketNumber: "TKT-0001",
  summary: VALID_PAYLOAD.summary,
  description: VALID_PAYLOAD.description,
  status: "New",
  requestedPriority: "Medium",
  requesterId: 1,
  categoryId: 1,
  relatedSystemId: 2,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  category: VALID_CATEGORY,
  relatedSystem: VALID_SYSTEM,
};

// ---------------------------------------------------------------------------
// Reset mocks to "happy path" defaults before each test
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks();

  // Auth middleware: valid requester by default
  mockRequesterFindUnique.mockResolvedValue(VALID_REQUESTER);

  // FK lookups: found by default
  mockCategoryFindUnique.mockResolvedValue(VALID_CATEGORY);
  mockRelatedSystemFindUnique.mockResolvedValue(VALID_SYSTEM);

  // Transaction: run the callback synchronously with a mock tx object
  mockTransaction.mockImplementation(
    async (cb: (tx: object) => Promise<unknown>) =>
      cb({
        $queryRaw: vi.fn().mockResolvedValue([{ nextval: BigInt(1) }]),
        ticket: { create: mockTicketCreate.mockResolvedValue(CREATED_TICKET) },
      })
  );
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /api/tickets", () => {
  // ── Auth guard ────────────────────────────────────────────────────────────

  it("401 — missing X-Requester-Id header", async () => {
    const res = await request(app).post("/api/tickets").send(VALID_PAYLOAD);
    expect(res.status).toBe(401);
  });

  it("401 — requester not found or inactive", async () => {
    mockRequesterFindUnique.mockResolvedValue(null);
    const res = await request(app)
      .post("/api/tickets")
      .set("X-Requester-Id", "99")
      .send(VALID_PAYLOAD);
    expect(res.status).toBe(401);
  });

  // ── Happy path ────────────────────────────────────────────────────────────

  it("201 — creates ticket and returns ticketNumber TKT-0001", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .set("X-Requester-Id", "1")
      .send(VALID_PAYLOAD);

    expect(res.status).toBe(201);
    expect(res.body.ticketNumber).toMatch(/^TKT-\d{4}$/);
    expect(res.body.status).toBe("New");
    expect(res.body.requestedPriority).toBe("Medium");
  });

  // ── Missing required fields ───────────────────────────────────────────────

  it("400 — missing summary", async () => {
    const { summary: _omit, ...rest } = VALID_PAYLOAD;
    const res = await request(app)
      .post("/api/tickets")
      .set("X-Requester-Id", "1")
      .send(rest);

    expect(res.status).toBe(400);
    const fields = res.body.details.map((d: { field: string }) => d.field);
    expect(fields).toContain("summary");
  });

  it("400 — missing description", async () => {
    const { description: _omit, ...rest } = VALID_PAYLOAD;
    const res = await request(app)
      .post("/api/tickets")
      .set("X-Requester-Id", "1")
      .send(rest);

    expect(res.status).toBe(400);
    const fields = res.body.details.map((d: { field: string }) => d.field);
    expect(fields).toContain("description");
  });

  it("400 — missing categoryId", async () => {
    const { categoryId: _omit, ...rest } = VALID_PAYLOAD;
    const res = await request(app)
      .post("/api/tickets")
      .set("X-Requester-Id", "1")
      .send(rest);

    expect(res.status).toBe(400);
    const fields = res.body.details.map((d: { field: string }) => d.field);
    expect(fields).toContain("categoryId");
  });

  it("400 — missing relatedSystemId", async () => {
    const { relatedSystemId: _omit, ...rest } = VALID_PAYLOAD;
    const res = await request(app)
      .post("/api/tickets")
      .set("X-Requester-Id", "1")
      .send(rest);

    expect(res.status).toBe(400);
    const fields = res.body.details.map((d: { field: string }) => d.field);
    expect(fields).toContain("relatedSystemId");
  });

  // ── requestedPriority validation ─────────────────────────────────────────

  it("400 — missing requestedPriority", async () => {
    const { requestedPriority: _omit, ...rest } = VALID_PAYLOAD;
    const res = await request(app)
      .post("/api/tickets")
      .set("X-Requester-Id", "1")
      .send(rest);

    expect(res.status).toBe(400);
    const fields = res.body.details.map((d: { field: string }) => d.field);
    expect(fields).toContain("requestedPriority");
  });

  it("400 — invalid requestedPriority value (Urgent is not allowed)", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .set("X-Requester-Id", "1")
      .send({ ...VALID_PAYLOAD, requestedPriority: "Urgent" });

    expect(res.status).toBe(400);
    const fields = res.body.details.map((d: { field: string }) => d.field);
    expect(fields).toContain("requestedPriority");
  });

  it("201 — accepts each of the three valid priorities", async () => {
    for (const priority of ["Low", "Medium", "High"] as const) {
      const res = await request(app)
        .post("/api/tickets")
        .set("X-Requester-Id", "1")
        .send({ ...VALID_PAYLOAD, requestedPriority: priority });
      expect(res.status).toBe(201);
    }
  });

  // ── Character limit validation ────────────────────────────────────────────

  it("400 — summary exceeds 100 characters", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .set("X-Requester-Id", "1")
      .send({ ...VALID_PAYLOAD, summary: "A".repeat(101) });

    expect(res.status).toBe(400);
    const match = res.body.details.find(
      (d: { field: string; message: string }) => d.field === "summary"
    );
    expect(match).toBeDefined();
    expect(match.message).toMatch(/100/);
  });

  it("400 — description exceeds 1000 characters", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .set("X-Requester-Id", "1")
      .send({ ...VALID_PAYLOAD, description: "B".repeat(1001) });

    expect(res.status).toBe(400);
    const match = res.body.details.find(
      (d: { field: string; message: string }) => d.field === "description"
    );
    expect(match).toBeDefined();
    expect(match.message).toMatch(/1000/);
  });

  // ── FK not-found ─────────────────────────────────────────────────────────

  it("400 — categoryId references non-existent category", async () => {
    mockCategoryFindUnique.mockResolvedValue(null);
    const res = await request(app)
      .post("/api/tickets")
      .set("X-Requester-Id", "1")
      .send({ ...VALID_PAYLOAD, categoryId: 9999 });

    expect(res.status).toBe(400);
    const fields = res.body.details.map((d: { field: string }) => d.field);
    expect(fields).toContain("categoryId");
  });

  it("400 — relatedSystemId references non-existent system", async () => {
    mockRelatedSystemFindUnique.mockResolvedValue(null);
    const res = await request(app)
      .post("/api/tickets")
      .set("X-Requester-Id", "1")
      .send({ ...VALID_PAYLOAD, relatedSystemId: 9999 });

    expect(res.status).toBe(400);
    const fields = res.body.details.map((d: { field: string }) => d.field);
    expect(fields).toContain("relatedSystemId");
  });

  // ── Response shape ────────────────────────────────────────────────────────

  it("response body includes category and relatedSystem nested objects", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .set("X-Requester-Id", "1")
      .send(VALID_PAYLOAD);

    expect(res.status).toBe(201);
    expect(res.body.category).toBeDefined();
    expect(res.body.relatedSystem).toBeDefined();
  });
});
