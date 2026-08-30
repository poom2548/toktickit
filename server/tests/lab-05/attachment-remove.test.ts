import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

// ---------------------------------------------------------------------------
// Mock Prisma
// ---------------------------------------------------------------------------
const {
  mockTicketFindUnique,
  mockRequesterFindUnique,
  mockAttachmentFindUnique,
  mockAttachmentUpdate,
} = vi.hoisted(() => ({
  mockTicketFindUnique: vi.fn(),
  mockRequesterFindUnique: vi.fn(),
  mockAttachmentFindUnique: vi.fn(),
  mockAttachmentUpdate: vi.fn(),
}));

vi.mock("../../src/prisma.js", () => ({
  getPrisma: vi.fn().mockReturnValue({
    requester: { findUnique: mockRequesterFindUnique },
    ticket: { findUnique: mockTicketFindUnique },
    attachment: { 
      findUnique: mockAttachmentFindUnique,
      update: mockAttachmentUpdate
    },
  }),
}));

const VALID_REQUESTER = { id: 1, isActive: true };

beforeEach(() => {
  vi.clearAllMocks();
  mockRequesterFindUnique.mockResolvedValue(VALID_REQUESTER);
});

describe("DELETE /api/attachments/:id", () => {
  it("R1 — 200 Owner soft-removes active attachment", async () => {
    mockAttachmentFindUnique.mockResolvedValue({ id: 1, ticketId: 1, isRemoved: false });
    mockTicketFindUnique.mockResolvedValue({ id: 1, requesterId: 1 });
    mockAttachmentUpdate.mockResolvedValue({ id: 1, isRemoved: true });

    const res = await request(app)
      .delete("/api/attachments/1")
      .set("X-Requester-Id", "1");
      
    expect(res.status).toBe(200);
    expect(res.body.attachment.isRemoved).toBe(true);
    expect(mockAttachmentUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isRemoved: true })
      })
    );
  });

  it("R2 — 403 Cross-requester remove attempt", async () => {
    mockAttachmentFindUnique.mockResolvedValue({ id: 1, ticketId: 1, isRemoved: false });
    mockTicketFindUnique.mockResolvedValue({ id: 1, requesterId: 2 }); // belongs to requester 2

    const res = await request(app)
      .delete("/api/attachments/1")
      .set("X-Requester-Id", "1");
      
    expect(res.status).toBe(403);
    expect(mockAttachmentUpdate).not.toHaveBeenCalled();
  });

  it("R3 — 409 Remove already-removed attachment", async () => {
    mockAttachmentFindUnique.mockResolvedValue({ id: 1, ticketId: 1, isRemoved: true });

    const res = await request(app)
      .delete("/api/attachments/1")
      .set("X-Requester-Id", "1");
      
    expect(res.status).toBe(409);
    expect(mockAttachmentUpdate).not.toHaveBeenCalled();
  });

  it("R4 — 404 Attachment not found", async () => {
    mockAttachmentFindUnique.mockResolvedValue(null);

    const res = await request(app)
      .delete("/api/attachments/999")
      .set("X-Requester-Id", "1");
      
    expect(res.status).toBe(404);
  });
});
