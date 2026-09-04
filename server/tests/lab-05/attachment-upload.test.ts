import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import path from "path";

// ---------------------------------------------------------------------------
// Mock Prisma and fs
// ---------------------------------------------------------------------------
const {
  mockTicketFindUnique,
  mockRequesterFindUnique,
  mockAttachmentCount,
  mockAttachmentCreate,
  mockFsUnlink,
} = vi.hoisted(() => ({
  mockTicketFindUnique: vi.fn(),
  mockRequesterFindUnique: vi.fn(),
  mockAttachmentCount: vi.fn(),
  mockAttachmentCreate: vi.fn(),
  mockFsUnlink: vi.fn(),
}));

vi.mock("../../src/prisma.js", () => ({
  getPrisma: vi.fn().mockReturnValue({
    requester: { findUnique: mockRequesterFindUnique },
    ticket: { findUnique: mockTicketFindUnique },
    attachment: {
      count: mockAttachmentCount,
      create: mockAttachmentCreate,
    },
  }),
}));

vi.mock("fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("fs")>();
  return {
    ...actual,
    unlink: mockFsUnlink,
  };
});

vi.mock("file-type", () => ({
  fileTypeFromFile: vi.fn().mockImplementation((filePath: string) => {
    if (filePath.endsWith(".pdf")) return Promise.resolve({ mime: "application/pdf" });
    if (filePath.endsWith(".jpg")) return Promise.resolve({ mime: "image/jpeg" });
    if (filePath.endsWith(".gif")) return Promise.resolve({ mime: "image/gif" });
    return Promise.resolve(null);
  })
}));

const VALID_REQUESTER = { id: 1, isActive: true };

beforeEach(() => {
  vi.clearAllMocks();
  mockRequesterFindUnique.mockResolvedValue(VALID_REQUESTER);
  // Default to valid ticket ownership
  mockTicketFindUnique.mockResolvedValue({ id: 1, requesterId: 1 });
  mockAttachmentCount.mockResolvedValue(0);
});

describe("POST /api/tickets/:ticketId/attachments", () => {
  const DUMMY_FILE = Buffer.from("dummy content");

  it("U1 — 201 valid upload by owner", async () => {
    mockAttachmentCreate.mockResolvedValue({ id: 10, filename: "test.pdf" });

    const res = await request(app)
      .post("/api/tickets/1/attachments")
      .set("X-Requester-Id", "1")
      .attach("file", DUMMY_FILE, "fake.pdf");

    expect(res.status).toBe(201);
    expect(res.body.filename).toBe("test.pdf");
    expect(mockAttachmentCreate).toHaveBeenCalled();
  });

  it("U2 — 403 cross-requester upload", async () => {
    // Ticket belongs to requester 2
    mockTicketFindUnique.mockResolvedValue({ id: 1, requesterId: 2 });

    const res = await request(app)
      .post("/api/tickets/1/attachments")
      .set("X-Requester-Id", "1")
      .attach("file", DUMMY_FILE, "fake.pdf");

    expect(res.status).toBe(403);
    expect(mockAttachmentCreate).not.toHaveBeenCalled();
  });

  it("U4 — 400 disallowed MIME type (GIF)", async () => {
    const res = await request(app)
      .post("/api/tickets/1/attachments")
      .set("X-Requester-Id", "1")
      .attach("file", DUMMY_FILE, "fake.gif");

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Only JPEG, PNG, WebP and PDF files are allowed/);
  });

  it("U5 — 400 when 5 attachments already active", async () => {
    mockAttachmentCount.mockResolvedValue(5);

    const res = await request(app)
      .post("/api/tickets/1/attachments")
      .set("X-Requester-Id", "1")
      .attach("file", DUMMY_FILE, "fake.pdf");

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/not have more than 5 active/);
  });

  it("U6 — 400 no file in request", async () => {
    const res = await request(app)
      .post("/api/tickets/1/attachments")
      .set("X-Requester-Id", "1");

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/No file uploaded/);
  });
});
