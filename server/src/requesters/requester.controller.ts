import { Request, Response, NextFunction } from "express";
import { getPrisma } from "../prisma.js";

/**
 * GET /api/requesters/active
 *
 * Returns all requesters where isActive = true.
 * Used by the frontend Dev Requester Selector to populate the list.
 * This endpoint is intentionally PUBLIC (no auth middleware required).
 */
export async function getActiveRequesters(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const prisma = getPrisma();
    const requesters = await prisma.requester.findMany({
      where: { isActive: true },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    });
    res.status(200).json(requesters);
  } catch (err) {
    next(err);
  }
}
