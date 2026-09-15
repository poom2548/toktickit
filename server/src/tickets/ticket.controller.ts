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

const VALID_STATUSES = ["New", "In Progress", "Resolved", "Closed"] as const;

/**
 * Returns a paginated, filterable list of tickets for the authenticated requester.
 *
 * Query params:
 *   search     — case-insensitive substring match on summary OR description
 *   categoryId — filter by category ID
 *   priority   — filter by requestedPriority (Low | Medium | High)
 *   status     — filter by status (New | In Progress | Resolved | Closed)
 *   page       — page number, default 1
 *   limit      — items per page, default 10, max 50
 *
 * Always returns 200 OK; empty results produce data: [] with valid pagination.
 */
export async function getTickets(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const prisma = getPrisma();
    const requesterId: string = req.user!.id;

    // ── Pagination ──────────────────────────────────────────────────────────
    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(String(req.query.limit ?? "10"), 10) || 10));
    const skip = (page - 1) * limit;

    // ── Filters ─────────────────────────────────────────────────────────────
    const search = typeof req.query.search === "string" ? req.query.search.trim() : undefined;
    const rawCategoryId = req.query.categoryId;
    const categoryId =
      rawCategoryId !== undefined && !isNaN(Number(rawCategoryId))
        ? Number(rawCategoryId)
        : undefined;
    const priority = typeof req.query.priority === "string" && VALID_PRIORITIES.includes(req.query.priority as any) ? (req.query.priority.toUpperCase() as any) : undefined;
    const status = typeof req.query.status === "string" && VALID_STATUSES.includes(req.query.status as any) ? (req.query.status.toUpperCase().replace(" ", "_") as any) : undefined;

    // Build where clause — always scoped to the authenticated requester
    const where = {
      requesterId,
      ...(categoryId !== undefined && { categoryId }),
      ...(priority !== undefined && { requestedPriority: priority }),
      ...(status !== undefined && { status }),
      ...(search !== undefined && search.length > 0 && {
        OR: [
          { summary: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    // ── Query ───────────────────────────────────────────────────────────────
    const [tickets, totalItems] = await Promise.all([
      prisma.ticket.findMany({
        where,
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
      prisma.ticket.count({ where }),
    ]);

    res.status(200).json({
      data: tickets,
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
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
    const requesterId: string = req.user!.id;

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
          status: "NEW",
          requestedPriority: requestedPriority.toUpperCase() as any,
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

// ---------------------------------------------------------------------------
// GET /api/tickets/:id
// ---------------------------------------------------------------------------

/**
 * Returns the full ticket details including its active attachments.
 * Validates ownership against the authenticated requester.
 */
export async function getTicketById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const prisma = getPrisma();
    const requesterId: string = req.user!.id;
    const ticketId = parseInt(req.params.id, 10);

    if (isNaN(ticketId)) {
      const err: AppError = Object.assign(new Error("Invalid ticket id"), { status: 400 });
      return next(err);
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        category: { select: { id: true, name: true } },
        relatedSystem: { select: { id: true, name: true } },
        attachments: {
          where: { isRemoved: false },
          select: { id: true, filename: true, mimetype: true, size: true, createdAt: true },
        },
        publicComments: {
          orderBy: { createdAt: 'asc' },
          include: { author: { select: { id: true, name: true, role: true } } },
        },
      },
    });

    if (!ticket) {
      const err: AppError = Object.assign(new Error("Ticket not found."), { status: 404 });
      return next(err);
    }
    if (ticket.requesterId !== requesterId) {
      const err: AppError = Object.assign(new Error("Access denied."), { status: 403 });
      return next(err);
    }

    res.status(200).json(ticket);
  } catch (err) {
    next(err);
  }
}


// ---------------------------------------------------------------------------
// POST /api/tickets/:id/comments
// ---------------------------------------------------------------------------
export async function postComment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const prisma = getPrisma();
    const ticketId = parseInt(req.params.id, 10);
    const authorId = req.user!.id;
    const { content } = req.body;

    if (isNaN(ticketId)) {
      const err: AppError = Object.assign(new Error("Invalid ticket id"), { status: 400 });
      return next(err);
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      const err: AppError = Object.assign(new Error("Comment content cannot be empty."), { status: 422 });
      return next(err);
    }

    const MAX_COMMENT_LENGTH = 2000;
    if (content.trim().length > MAX_COMMENT_LENGTH) {
      const err: AppError = Object.assign(new Error(`Comment must not exceed ${MAX_COMMENT_LENGTH} characters.`), { status: 422 });
      return next(err);
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      const err: AppError = Object.assign(new Error("Access denied."), { status: 403 });
      return next(err);
    }

    if (req.user!.role === 'REQUESTER' && ticket.requesterId !== authorId) {
      const err: AppError = Object.assign(new Error("Access denied."), { status: 403 });
      return next(err);
    }

    const comment = await prisma.publicComment.create({
      data: {
        ticketId,
        authorId,
        content: content.trim(),
      },
      include: {
        author: { select: { id: true, name: true, role: true } },
      },
    });

    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// GET /api/tickets/:id/comments
// ---------------------------------------------------------------------------
export async function getComments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const prisma = getPrisma();
    const ticketId = parseInt(req.params.id, 10);
    const callerId = req.user!.id;

    if (isNaN(ticketId)) {
      const err: AppError = Object.assign(new Error("Invalid ticket id"), { status: 400 });
      return next(err);
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      const err: AppError = Object.assign(new Error("Access denied."), { status: 403 });
      return next(err);
    }

    if (req.user!.role === 'REQUESTER' && ticket.requesterId !== callerId) {
      const err: AppError = Object.assign(new Error("Access denied."), { status: 403 });
      return next(err);
    }

    const comments = await prisma.publicComment.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: { id: true, name: true, role: true } },
      },
    });

    res.status(200).json({ comments });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/tickets/:id/resolved-flag
// ---------------------------------------------------------------------------
export async function setResolvedFlag(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const prisma = getPrisma();
    const ticketId = parseInt(req.params.id, 10);
    const requesterId = req.user!.id;
    const { problemAppearsResolved } = req.body;

    if (isNaN(ticketId)) {
      const err: AppError = Object.assign(new Error("Invalid ticket id"), { status: 400 });
      return next(err);
    }

    if (typeof problemAppearsResolved !== 'boolean') {
      const err: AppError = Object.assign(new Error("problemAppearsResolved must be a boolean."), { status: 400 });
      return next(err);
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket || ticket.requesterId !== requesterId) {
      const err: AppError = Object.assign(new Error("Access denied."), { status: 403 });
      return next(err);
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        problemAppearsResolved,
      },
      select: {
        id: true,
        status: true,
        problemAppearsResolved: true,
      },
    });

    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/tickets/:id/notes (Stub)
// ---------------------------------------------------------------------------
export async function postNote(req: Request, res: Response, next: NextFunction): Promise<void> {
  res.status(501).json({ error: 'Not yet implemented.' });
}

// ---------------------------------------------------------------------------
// GET /api/tickets/:id/notes (Stub)
// ---------------------------------------------------------------------------
export async function getNotes(req: Request, res: Response, next: NextFunction): Promise<void> {
  res.status(501).json({ error: 'Not yet implemented.' });
}
