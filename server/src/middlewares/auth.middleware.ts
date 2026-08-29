import { Request, Response, NextFunction } from "express";
import { getPrisma } from "../prisma.js";

// ---------------------------------------------------------------------------
// Type Augmentation — Express Locals
// ---------------------------------------------------------------------------
// Extends Express's built-in `res.locals` interface so TypeScript knows that
// `requesterId` is a `number` when set by authMiddleware. Without this,
// strict-mode TS raises an implicit-any error on every read/write of the field.
declare global {
  namespace Express {
    interface Locals {
      requesterId: number;
    }
  }
}


/**
 * Auth Middleware — Issue 2
 *
 * Validates the X-Requester-Id header and confirms the requester
 * exists and is active in the database.
 * On success, exposes `res.locals.requesterId` (number) to downstream handlers.
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const rawHeader = req.headers["x-requester-id"];

  // Header must be present and non-empty
  if (!rawHeader || (typeof rawHeader === "string" && rawHeader.trim() === "")) {
    res.status(401).json({ error: "Unauthorized: X-Requester-Id header is required" });
    return;
  }

  const requesterId = Number(rawHeader);
  if (isNaN(requesterId)) {
    res.status(401).json({ error: "Unauthorized: X-Requester-Id must be a valid number" });
    return;
  }

  // Confirm requester exists in the DB
  const prisma = getPrisma();
  const requester = await prisma.requester.findUnique({
    where: { id: requesterId },
    select: { id: true, isActive: true },
  });

  if (!requester || !requester.isActive) {
    res.status(401).json({ error: "Unauthorized: Requester not found or is inactive" });
    return;
  }

  // Expose for downstream handlers
  res.locals.requesterId = requester.id;
  next();
}
