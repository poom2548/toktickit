import os

path = r'server/src/tickets/ticket.controller.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace res.locals.requesterId
content = content.replace('String(res.locals.requesterId)', 'req.user!.id')

# Fix getTicketById 404/403
old_block = '''    if (!ticket) {
      const err: AppError = Object.assign(new Error("Ticket not found"), { status: 404 });
      return next(err);
    }

    // --- Ownership check ---
    if (ticket.requesterId !== String(requesterId)) {
      const err: AppError = Object.assign(
        new Error("Forbidden: you do not own this ticket"),
        { status: 403 }
      );
      return next(err);
    }'''

new_block = '''    if (!ticket || ticket.requesterId !== requesterId) {
      const err: AppError = Object.assign(
        new Error("Access denied."),
        { status: 403 }
      );
      return next(err);
    }'''

content = content.replace(old_block, new_block)

# Add new endpoints
new_methods = '''
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
      const err: AppError = Object.assign(new Error(Comment must not exceed  characters.), { status: 422 });
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
'''
if 'postComment' not in content:
    content += new_methods

# Also, update include in getTicketById to include publicComments
old_include = '''      include: {
        category: { select: { id: true, name: true } },
        relatedSystem: { select: { id: true, name: true } },
        attachments: {
          where: { isRemoved: false },
          select: { id: true, filename: true, mimetype: true, size: true, createdAt: true },
        },
      },'''
new_include = '''      include: {
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
      },'''
content = content.replace(old_include, new_include)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done ticket.controller.ts')
