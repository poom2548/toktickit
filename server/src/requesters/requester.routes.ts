import { Router } from "express";
import { getActiveRequesters } from "./requester.controller.js";

export const requesterRouter = Router();

// GET /api/requesters/active — public, no auth required
requesterRouter.get("/active", getActiveRequesters);
