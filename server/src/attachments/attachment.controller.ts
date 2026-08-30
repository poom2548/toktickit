import path from "path";
import fs from "fs";
import multer from "multer";
import { Request, Response, NextFunction } from "express";
import { fileTypeFromFile } from "file-type";
import { getPrisma } from "../prisma.js";
import { AppError } from "../middlewares/error.middleware.js";

// ---------------------------------------------------------------------------
// Upload directory — created at startup if absent
// ---------------------------------------------------------------------------

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// ---------------------------------------------------------------------------
// Multer — disk storage, 5 MB limit
// ---------------------------------------------------------------------------

export const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
      cb(null, unique);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// MIME types accepted for attachments (JPG, PNG, WebP, PDF — no GIF)
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Verifies that the ticket belongs to the authenticated requester.
 * Throws an AppError (404 if ticket missing, 403 if ownership mismatch).
 */
async function assertTicketOwnership(
  ticketId: number,
  requesterId: number
): Promise<void> {
  const prisma = getPrisma();
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { requesterId: true },
  });

  if (!ticket) {
    const err: AppError = Object.assign(new Error("Ticket not found"), { status: 404 });
    throw err;
  }

  if (ticket.requesterId !== requesterId) {
    const err: AppError = Object.assign(
      new Error("Forbidden: you do not own this ticket"),
      { status: 403 }
    );
    throw err;
  }
}

// ---------------------------------------------------------------------------
// POST /api/tickets/:ticketId/attachments
// ---------------------------------------------------------------------------

/**
 * Uploads a file and stores its metadata + disk path.
 * - multer parses the multipart body (applied in the route)
 * - file-type validates the actual binary MIME from disk
 * - Ownership of the ticket is checked before storing anything
 * - Rejects if the ticket already has 5 active attachments
 */
export async function uploadAttachment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const prisma = getPrisma();
    const requesterId: number = res.locals.requesterId;
    const ticketId = parseInt(req.params.ticketId, 10);

    if (isNaN(ticketId)) {
      const err: AppError = Object.assign(new Error("Invalid ticketId"), { status: 400 });
      return next(err);
    }

    // --- Ownership check ---
    await assertTicketOwnership(ticketId, requesterId);

    // --- File presence check ---
    if (!req.file) {
      const err: AppError = Object.assign(
        new Error("No file uploaded. Provide a file in the 'file' field."),
        { status: 400 }
      );
      return next(err);
    }

    // --- Magic-byte MIME verification (read from disk) ---
    const detected = await fileTypeFromFile(req.file.path);
    if (!detected || !ALLOWED_MIME_TYPES.has(detected.mime)) {
      // Clean up the rejected file
      fs.unlink(req.file.path, () => {});
      const err: AppError = Object.assign(
        new Error(
          `Invalid file type${detected ? ` (${detected.mime})` : ""}. ` +
            "Only JPEG, PNG, WebP and PDF files are allowed."
        ),
        { status: 400 }
      );
      return next(err);
    }

    // --- Active attachment cap check ---
    const activeCount = await prisma.attachment.count({
      where: { ticketId, isRemoved: false },
    });
    if (activeCount >= 5) {
      fs.unlink(req.file.path, () => {});
      const err: AppError = Object.assign(
        new Error("A ticket may not have more than 5 active attachments."),
        { status: 400 }
      );
      return next(err);
    }

    // --- Persist metadata + storage path ---
    const attachment = await prisma.attachment.create({
      data: {
        ticketId,
        filename: req.file.originalname,
        mimetype: detected.mime,
        size: req.file.size,
        storagePath: req.file.path,
      },
    });

    res.status(201).json(attachment);
  } catch (err) {
    // Clean up orphaned file if controller threw before persisting
    if (req.file?.path) fs.unlink(req.file.path, () => {});
    next(err);
  }
}

// ---------------------------------------------------------------------------
// GET /api/attachments/:id/download
// ---------------------------------------------------------------------------

/**
 * Streams a file to the client.
 * - Returns 404 if the attachment record does not exist.
 * - Returns 403 if the file has been soft-removed (isRemoved = true).
 * - Returns 403 if the requester does not own the parent ticket.
 */
export async function downloadAttachment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const prisma = getPrisma();
    const requesterId: number = res.locals.requesterId;
    const attachmentId = parseInt(req.params.id, 10);

    if (isNaN(attachmentId)) {
      const err: AppError = Object.assign(new Error("Invalid attachment id"), { status: 400 });
      return next(err);
    }

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment) {
      const err: AppError = Object.assign(new Error("Attachment not found"), { status: 404 });
      return next(err);
    }

    // Block access to soft-removed files
    if (attachment.isRemoved) {
      const err: AppError = Object.assign(
        new Error("Forbidden: this attachment has been removed"),
        { status: 403 }
      );
      return next(err);
    }

    // Ownership check via parent ticket
    await assertTicketOwnership(attachment.ticketId, requesterId);

    // Stream the file
    res.download(attachment.storagePath, attachment.filename, (err) => {
      if (err) {
        // File missing on disk or other streaming error
        next(
          Object.assign(new Error("File could not be served"), { status: 500 })
        );
      }
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/attachments/:id
// ---------------------------------------------------------------------------

/**
 * Soft-deletes an attachment by setting isRemoved, deletedAt, and deletedBy.
 * Ownership of the parent ticket is verified before performing the update.
 */
export async function removeAttachment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const prisma = getPrisma();
    const requesterId: number = res.locals.requesterId;
    const attachmentId = parseInt(req.params.id, 10);

    if (isNaN(attachmentId)) {
      const err: AppError = Object.assign(new Error("Invalid attachment id"), { status: 400 });
      return next(err);
    }

    // --- Fetch attachment to get its ticketId ---
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      select: { id: true, ticketId: true, isRemoved: true },
    });

    if (!attachment) {
      const err: AppError = Object.assign(new Error("Attachment not found"), { status: 404 });
      return next(err);
    }

    if (attachment.isRemoved) {
      const err: AppError = Object.assign(
        new Error("Attachment has already been removed"),
        { status: 409 }
      );
      return next(err);
    }

    // --- Ownership check via parent ticket ---
    await assertTicketOwnership(attachment.ticketId, requesterId);

    // --- Soft delete ---
    const updated = await prisma.attachment.update({
      where: { id: attachmentId },
      data: {
        isRemoved: true,
        deletedAt: new Date(),
        deletedBy: String(requesterId),
      },
    });

    res.status(200).json({ message: "Attachment removed", attachment: updated });
  } catch (err) {
    next(err);
  }
}
