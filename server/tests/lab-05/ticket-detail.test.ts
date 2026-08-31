import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

// ---------------------------------------------------------------------------
// Prisma Mock
// ---------------------------------------------------------------------------
const {
  mockTicketFindUnique,
  mockRequesterFindUnique,
} = vi.hoisted(() => ({
  mockTicketFindUnique: vi.fn(),
  mockRequesterFindUnique: vi.fn(),
}));

vi.mock("../../src/prisma.js", () => ({
  getPrisma: vi.fn().mockReturnValue({
    requester: { findUnique: mockRequesterFindUnique },
    ticket: { findUnique: mockTicketFindUnique },
  }),
}));

const VALID_REQUESTER = { id: 1, isActive: true };

function makeTicket(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 1,
    ticketNumber: "TKT-0001",
    summary: "Need help",
    description: "Please fix",
    status: "New",
    requestedPriority: "Low",
    requesterId: 1,
    categoryId: 1,
    relatedSystemId: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    attachments: [
      { id: 1, filename: "test.png", mimetype: "image/png", size: 1024, createdAt: new Date().toISOString() }
    ],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequesterFindUnique.mockResolvedValue(VALID_REQUESTER);
});

describe("GET /api/tickets/:id", () => {
  it("T1 — 401 when missing X-Requester-Id header", async () => {
    const res = await request(app).get("/api/tickets/1");
    expect(res.status).toBe(401);
  });

  it("T2 — 200 with full ticket object and attachments for valid owner", async () => {
    mockTicketFindUnique.mockResolvedValue(makeTicket({ requesterId: 1 }));
    const res = await request(app).get("/api/tickets/1").set("X-Requester-Id", "1");
    expect(res.status).toBe(200);
    expect(res.body.ticketNumber).toBe("TKT-0001");
    expect(res.body.attachments).toHaveLength(1);
    
    // Verify it requested only active attachments
    const callArgs = mockTicketFindUnique.mock.calls[0][0];
    expect(callArgs.include.attachments.where.isRemoved).toBe(false);
  });

  it("T3 — 404 when ticket not found", async () => {
    mockTicketFindUnique.mockResolvedValue(null);
    const res = await request(app).get("/api/tickets/999").set("X-Requester-Id", "1");
    expect(res.status).toBe(404);
  });

  it("T4 — 403 when accessing another requester's ticket", async () => {
    // Ticket belongs to requester 2, but we request as 1
    mockTicketFindUnique.mockResolvedValue(makeTicket({ requesterId: 2 }));
    const res = await request(app).get("/api/tickets/1").set("X-Requester-Id", "1");
    expect(res.status).toBe(403);
  });
});
