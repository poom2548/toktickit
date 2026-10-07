import { Router } from "express";
import { wrapRequireAuth, customRequireRole } from "./actions-taken.middleware.js";
import { getActionsController, createActionController, updateActionController } from "./actions-taken.controller.js";

export const actionsTakenRouter = Router({ mergeParams: true });

actionsTakenRouter.get("/", wrapRequireAuth, getActionsController);
actionsTakenRouter.post("/", wrapRequireAuth, customRequireRole("IT_STAFF", "ADMINISTRATOR"), createActionController);
actionsTakenRouter.patch("/:actionId", wrapRequireAuth, customRequireRole("IT_STAFF", "ADMINISTRATOR"), updateActionController);


