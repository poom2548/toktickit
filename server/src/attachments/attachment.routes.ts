import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  upload,
  uploadAttachment,
  removeAttachment,
  downloadAttachment,
} from "./attachment.controller.js";

export const attachmentRouter = Router();

// All attachment routes require authentication (router-level guard)
attachmentRouter.use(authMiddleware);

// POST /api/tickets/:ticketId/attachments
// multer's .single() runs before the controller to parse the multipart body
attachmentRouter.post(
  "/tickets/:ticketId/attachments",
  upload.single("file"),
  uploadAttachment
);

// GET /api/attachments/:id/download
// authMiddleware listed explicitly here (in addition to the router-level guard above)
// to make the AC-01 security requirement unmistakably visible at the route level.
attachmentRouter.get("/attachments/:id/download", authMiddleware, downloadAttachment);

// DELETE /api/attachments/:id
attachmentRouter.delete("/attachments/:id", removeAttachment);

