import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import path from "path";
import fs from "fs";

// ---------------------------------------------------------------------------
// Mock Prisma
// ---------------------------------------------------------------------------
const {
  mockTicketFindUnique,
  mockRequesterFindUnique,
  mockAttachmentFindUnique,
} = vi.hoisted(() => ({
  mockTicketFindUnique: vi.fn(),
  mockRequesterFindUnique: vi.fn(),
  mockAttachmentFindUnique: vi.fn(),
}));

vi.mock("../../src/prisma.js", () => ({
  getPrisma: vi.fn().mockReturnValue({
    requester: { findUnique: mockRequesterFindUnique },
    ticket: { findUnique: mockTicketFindUnique },
    attachment: { findUnique: mockAttachmentFindUnique },
  }),
}));

const VALID_REQUESTER = { id: 1, isActive: true };

beforeEach(() => {
  vi.clearAllMocks();
  mockRequesterFindUnique.mockResolvedValue(VALID_REQUESTER);
});

describe("GET /api/attachments/:id/download", () => {
  it("D2 — 403 when downloading soft-removed attachment", async () => {
    mockAttachmentFindUnique.mockResolvedValue({ id: 1, ticketId: 1, isRemoved: true });
    
    const res = await request(app)
      .get("/api/attachments/1/download")
      .set("X-Requester-Id", "1");
      
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/has been removed/);
  });

  it("D3 — 404 when attachment not found", async () => {
    mockAttachmentFindUnique.mockResolvedValue(null);
    
    const res = await request(app)
      .get("/api/attachments/999/download")
      .set("X-Requester-Id", "1");
      
    expect(res.status).toBe(404);
  });

  it("D4 — 403 when cross-requester download", async () => {
    mockAttachmentFindUnique.mockResolvedValue({ id: 1, ticketId: 1, isRemoved: false });
    // Ticket belongs to requester 2
    mockTicketFindUnique.mockResolvedValue({ id: 1, requesterId: 2 });
    
    const res = await request(app)
      .get("/api/attachments/1/download")
      .set("X-Requester-Id", "1");
      
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/do not own this ticket/);
  });
});
