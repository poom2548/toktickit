import express, { Request, Response } from "express";
import cors from "cors";
import { getPrisma } from "./prisma.js";
import { requesterRouter } from "./requesters/requester.routes.js";
import { ticketRouter } from "./tickets/ticket.routes.js";
import { attachmentRouter } from "./attachments/attachment.routes.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";

export const app = express();

app.use(cors());
app.use(express.json());

// ---------------------------------------------------------------------------
// Issue 2 — API health check
// ---------------------------------------------------------------------------
app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    service: "TokTickIT API",
  });
});

// ---------------------------------------------------------------------------
// Issue 4 — Category list
// ---------------------------------------------------------------------------
app.get("/api/categories", async (_req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const categories = await prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { id: "asc" },
    });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// ---------------------------------------------------------------------------
// Issue 3 — Related Systems list (used by Create Ticket form)
// ---------------------------------------------------------------------------
app.get("/api/related-systems", async (_req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const systems = await prisma.relatedSystem.findMany({
      select: { id: true, name: true },
      orderBy: { id: "asc" },
    });
    res.status(200).json(systems);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch related systems" });
  }
});


// ---------------------------------------------------------------------------
// Issue 2 — Requester routes (public — no auth required)
// GET /api/requesters/active
// ---------------------------------------------------------------------------
app.use("/api/requesters", requesterRouter);

// ---------------------------------------------------------------------------
// Ticket routes (auth-guarded inside ticketRouter)
// GET  /api/tickets
// POST /api/tickets
// ---------------------------------------------------------------------------
app.use("/api/tickets", ticketRouter);

// ---------------------------------------------------------------------------
// Attachment routes (auth-guarded inside attachmentRouter)
// POST   /api/tickets/:ticketId/attachments
// DELETE /api/attachments/:id
// ---------------------------------------------------------------------------
app.use("/api", attachmentRouter);

// ---------------------------------------------------------------------------
// Global error handler — MUST be last
// ---------------------------------------------------------------------------
app.use(errorMiddleware);
