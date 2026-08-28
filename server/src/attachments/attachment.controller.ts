import multer from "multer";
import { Request, Response, NextFunction } from "express";
import { fileTypeFromBuffer } from "file-type";
import { getPrisma } from "../prisma.js";
import { AppError } from "../middlewares/error.middleware.js";

// ---------------------------------------------------------------------------
// Multer configuration — memory storage, 5 MB limit
// ---------------------------------------------------------------------------

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// MIME types accepted for attachments
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Verifies that the ticket belongs to the authenticated requester.
 * Throws an AppError (403) if ownership check fails.
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
 * Uploads a file and stores its metadata.
 * - multer parses the multipart body (applied in the route)
 * - file-type validates the actual binary MIME (not the Content-Type header)
 * - Ownership of the ticket is checked before storing anything
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

    // --- Magic-byte MIME verification ---
    const detected = await fileTypeFromBuffer(req.file.buffer);
    if (!detected || !ALLOWED_MIME_TYPES.has(detected.mime)) {
      const err: AppError = Object.assign(
        new Error(
          `Invalid file type${detected ? ` (${detected.mime})` : ""}. ` +
          "Only images (JPEG, PNG, GIF, WebP) and PDF are allowed."
        ),
        { status: 400 }
      );
      return next(err);
    }

    // --- Persist metadata ---
    const attachment = await prisma.attachment.create({
      data: {
        ticketId,
        filename: req.file.originalname,
        mimetype: detected.mime,
        size: req.file.size,
      },
    });

    res.status(201).json(attachment);
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
