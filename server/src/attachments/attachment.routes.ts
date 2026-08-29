import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { upload, uploadAttachment, removeAttachment } from "./attachment.controller.js";

export const attachmentRouter = Router();

// All attachment routes require authentication
attachmentRouter.use(authMiddleware);

// POST /api/tickets/:ticketId/attachments
// multer's .single() runs before the controller to parse the multipart body
attachmentRouter.post(
  "/tickets/:ticketId/attachments",
  upload.single("file"),
  uploadAttachment
);

// DELETE /api/attachments/:id
attachmentRouter.delete("/attachments/:id", removeAttachment);
