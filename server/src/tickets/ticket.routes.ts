import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { getTickets, createTicket, getTicketById } from "./ticket.controller.js";

export const ticketRouter = Router();

// All ticket routes require authentication
ticketRouter.use(authMiddleware);

// GET /api/tickets  — list tickets for the authenticated requester (paginated)
ticketRouter.get("/", getTickets);

// POST /api/tickets — create a new ticket
ticketRouter.post("/", createTicket);

// GET /api/tickets/:id — get ticket details and active attachments
ticketRouter.get("/:id", getTicketById);
