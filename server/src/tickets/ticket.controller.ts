import { Request, Response, NextFunction } from "express";
import { getPrisma } from "../prisma.js";
import { AppError } from "../middlewares/error.middleware.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface ValidationError {
  field: string;
  message: string;
}

const VALID_PRIORITIES = ["Low", "Medium", "High"] as const;
type Priority = (typeof VALID_PRIORITIES)[number];

function validateTicketBody(body: Record<string, unknown>): ValidationError[] {
  const errors: ValidationError[] = [];

  const { summary, description, categoryId, relatedSystemId, requestedPriority } = body;

  if (!summary || typeof summary !== "string" || summary.trim() === "") {
    errors.push({ field: "summary", message: "Summary is required." });
  } else if (summary.length > 100) {
    errors.push({ field: "summary", message: "Summary must not exceed 100 characters." });
  }

  if (!description || typeof description !== "string" || description.trim() === "") {
    errors.push({ field: "description", message: "Description is required." });
  } else if (description.length > 1000) {
    errors.push({ field: "description", message: "Description must not exceed 1000 characters." });
  }

  if (!categoryId || isNaN(Number(categoryId))) {
    errors.push({ field: "categoryId", message: "A valid categoryId is required." });
  }

  if (!relatedSystemId || isNaN(Number(relatedSystemId))) {
    errors.push({ field: "relatedSystemId", message: "A valid relatedSystemId is required." });
  }

  if (
    !requestedPriority ||
    typeof requestedPriority !== "string" ||
    !(VALID_PRIORITIES as readonly string[]).includes(requestedPriority)
  ) {
    errors.push({
      field: "requestedPriority",
      message: "Priority must be one of: Low, Medium, or High.",
    });
  }

  return errors;
}


// ---------------------------------------------------------------------------
// GET /api/tickets
// ---------------------------------------------------------------------------

/**
 * Returns a paginated list of tickets owned by the authenticated requester.
 * Query params: page (default 1), limit (default 10)
 */
export async function getTickets(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const prisma = getPrisma();
    const requesterId: number = res.locals.requesterId;

    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(String(req.query.limit ?? "10"), 10) || 10));
    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where: { requesterId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          category: { select: { id: true, name: true } },
          relatedSystem: { select: { id: true, name: true } },
          attachments: {
            where: { isRemoved: false },
            select: { id: true, filename: true, mimetype: true, size: true, createdAt: true },
          },
        },
      }),
      prisma.ticket.count({ where: { requesterId } }),
    ]);

    res.status(200).json({
      data: tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/tickets
// ---------------------------------------------------------------------------

/**
 * Creates a new ticket for the authenticated requester.
 * - Validates body fields (summary ≤100, description ≤1000, required FKs)
 * - Auto-generates ticketNumber as TKT-xxxx inside a transaction
 * - Sets status to "New"
 */
export async function createTicket(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const prisma = getPrisma();
    const requesterId: number = res.locals.requesterId;

    // --- Validation ---
    const errors = validateTicketBody(req.body as Record<string, unknown>);
    if (errors.length > 0) {
      const err: AppError = Object.assign(new Error("Validation failed"), {
        status: 400,
        details: errors,
      });
      next(err);
      return;
    }

    const { summary, description, categoryId, relatedSystemId, requestedPriority } = req.body as {
      summary: string;
      description: string;
      categoryId: number;
      relatedSystemId: number;
      requestedPriority: Priority;
    };

    // --- Verify FKs exist ---
    const [category, relatedSystem] = await Promise.all([
      prisma.category.findUnique({ where: { id: Number(categoryId) } }),
      prisma.relatedSystem.findUnique({ where: { id: Number(relatedSystemId) } }),
    ]);

    if (!category) {
      const err: AppError = Object.assign(new Error("Validation failed"), {
        status: 400,
        details: [{ field: "categoryId", message: "Category not found." }],
      });
      next(err);
      return;
    }

    if (!relatedSystem) {
      const err: AppError = Object.assign(new Error("Validation failed"), {
        status: 400,
        details: [{ field: "relatedSystemId", message: "Related system not found." }],
      });
      next(err);
      return;
    }

    // --- Create ticket inside a transaction using a PostgreSQL SEQUENCE ---
    // Using nextval('ticket_number_seq') guarantees a unique, monotonically
    // increasing number even under high concurrency — no TOCTOU race possible.
    const ticket = await prisma.$transaction(async (tx) => {
      const result = await tx.$queryRaw<[{ nextval: bigint }]>`
        SELECT nextval('ticket_number_seq')
      `;
      const ticketNumber = `TKT-${String(Number(result[0].nextval)).padStart(4, "0")}`;

      return tx.ticket.create({
        data: {
          ticketNumber,
          summary: summary.trim(),
          description: description.trim(),
          status: "New",
          requestedPriority,
          requesterId,
          categoryId: Number(categoryId),
          relatedSystemId: Number(relatedSystemId),
        },
        include: {
          category: { select: { id: true, name: true } },
          relatedSystem: { select: { id: true, name: true } },
        },
      });
    });

    res.status(201).json(ticket);
  } catch (err) {
    next(err);
  }
}

