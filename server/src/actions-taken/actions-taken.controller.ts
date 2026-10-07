import { Request, Response, NextFunction } from "express";
import { getActions, createAction, updateAction } from "./actions-taken.service.js";
import { sendApiError } from "./actions-taken.middleware.js";
import { validateActionTaken } from "./actions-taken.validation.js";

export const getActionsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      return sendApiError(res, 404, "NOT_FOUND", "Ticket not found");
    }

    const actions = await getActions(ticketId, req.user!);
    res.status(200).json({ actions });
  } catch (error: any) {
    if (error.code) {
      return sendApiError(res, error.status || 400, error.code, error.message);
    }
    next(error);
  }
};

export const createActionController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      return sendApiError(res, 404, "NOT_FOUND", "Ticket not found");
    }

    const { isValid, errors } = validateActionTaken(req.body, false);
    if (!isValid) {
      return sendApiError(res, 422, "VALIDATION_FAILED", "The provided data is invalid.", { fields: errors });
    }

    const idempotencyKey = req.headers["idempotency-key"] as string | undefined;
    if (idempotencyKey && idempotencyKey.length > 255) {
      return sendApiError(res, 422, "VALIDATION_FAILED", "Idempotency-Key too long", { fields: { "Idempotency-Key": "Max 255 chars" }});
    }

    const result = await createAction(ticketId, req.body, req.user!, idempotencyKey);
    
    if (result.replayed) {
      res.setHeader("Idempotent-Replayed", "true");
    }
    res.status(201).json(result.action);
  } catch (error: any) {
    if (error.code) {
      return sendApiError(res, error.status || 400, error.code, error.message, error.extra);
    }
    next(error);
  }
};

export const updateActionController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      return sendApiError(res, 404, "NOT_FOUND", "Ticket not found");
    }
    
    const actionId = req.params.actionId;

    const { isValid, errors } = validateActionTaken(req.body, true);
    if (!isValid) {
      return sendApiError(res, 422, "VALIDATION_FAILED", "The provided data is invalid.", { fields: errors });
    }

    const result = await updateAction(ticketId, actionId, req.body, req.user!);
    res.status(200).json(result);
  } catch (error: any) {
    if (error.code) {
      return sendApiError(res, error.status || 400, error.code, error.message, error.extra);
    }
    next(error);
  }
};
