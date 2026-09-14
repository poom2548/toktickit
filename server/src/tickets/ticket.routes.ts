import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { getTickets, createTicket, getTicketById, postComment, getComments, setResolvedFlag, postNote, getNotes } from "./ticket.controller.js";

export const ticketRouter = Router();

// GET /api/tickets  — list tickets for the authenticated requester (paginated)
ticketRouter.get("/", requireAuth, requireRole("REQUESTER"), getTickets);

// POST /api/tickets — create a new ticket
ticketRouter.post("/", requireAuth, requireRole("REQUESTER"), createTicket);

// GET /api/tickets/:id — get ticket details and active attachments
ticketRouter.get("/:id", requireAuth, requireRole("REQUESTER"), getTicketById);

// Comments endpoints
ticketRouter.post("/:id/comments", requireAuth, postComment);
ticketRouter.get("/:id/comments", requireAuth, getComments);

// Resolved flag endpoint
ticketRouter.patch("/:id/resolved-flag", requireAuth, requireRole("REQUESTER"), setResolvedFlag);

// Internal notes endpoints (stubs, enforce 403 for requesters)
ticketRouter.post("/:id/notes", requireAuth, requireRole("IT_STAFF", "ADMINISTRATOR"), postNote);
ticketRouter.get("/:id/notes", requireAuth, requireRole("IT_STAFF", "ADMINISTRATOR"), getNotes);

