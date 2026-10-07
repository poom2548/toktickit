import crypto from "crypto";
import { getPrisma } from "../prisma.js";
import { TicketStatus } from "@prisma/client";

// Define the ServiceError class to pass up to controller
export class ServiceError extends Error {
  status: number;
  code: string;
  extra: any;
  constructor(status: number, code: string, message: string, extra: any = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.extra = extra;
  }
}

export const generateRequestHash = (ticketId: number, body: any) => {
  const data = {
    ticketId,
    actionAt: body.actionAt,
    description: body.description?.trim(),
    result: body.result?.trim(),
    followUpRequired: body.followUpRequired,
    followUpNote: body.followUpRequired ? (body.followUpNote?.trim() || null) : null,
    attachmentNotes: body.attachmentNotes === undefined ? null : body.attachmentNotes
  };
  return crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex");
};

export const getActions = async (ticketId: number, user: NonNullable<Express.Request["user"]>) => {
  const prisma = getPrisma();
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { requesterId: true }
  });

  if (!ticket) {
    throw new ServiceError(404, "NOT_FOUND", "Ticket not found");
  }

  if (user.role === "REQUESTER" && ticket.requesterId !== user.id) {
    throw new ServiceError(403, "FORBIDDEN", "Access denied.");
  }

  // Fetch actions
  const actions = await prisma.actionTaken.findMany({
    where: { ticketId },
    select: {
      id: true,
      actionAt: true,
      description: true,
      result: true,
      performedBy: {
        select: { id: true, name: true }
      },
      followUpRequired: true,
      followUpNote: true,
      attachmentNotes: true,
      version: true,
      createdAt: true
    },
    orderBy: [
      { actionAt: "asc" },
      { createdAt: "asc" },
      { id: "asc" }
    ]
  });

  return actions;
};

export const createAction = async (ticketId: number, body: any, user: NonNullable<Express.Request["user"]>, idempotencyKey?: string) => {
  const prisma = getPrisma();
  
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { status: true }
  });

  if (!ticket) {
    throw new ServiceError(404, "NOT_FOUND", "Ticket not found");
  }

  if (ticket.status === TicketStatus.CLOSED || ticket.status === TicketStatus.CANCELLED) {
    throw new ServiceError(409, "TICKET_LOCKED", "Ticket is locked");
  }

  const endpoint = "POST /api/tickets/:id/actions-taken";
  const requestHash = generateRequestHash(ticketId, body);

  if (idempotencyKey) {
    // Delete expired keys first (lazy deletion)
    await prisma.idempotencyKey.deleteMany({
      where: {
        userId: user.id,
        endpoint,
        key: idempotencyKey,
        expiresAt: { lte: new Date() }
      }
    });

    const existingKey = await prisma.idempotencyKey.findUnique({
      where: {
        userId_endpoint_key: {
          userId: user.id,
          endpoint,
          key: idempotencyKey
        }
      }
    });

    if (existingKey) {
      if (existingKey.requestHash === requestHash) {
        return { action: existingKey.responseBody, replayed: true };
      } else {
        throw new ServiceError(422, "IDEMPOTENCY_KEY_REUSED", "Idempotency key reused with different body");
      }
    }
  }

  const description = body.description.trim();
  const result = body.result.trim();
  const followUpRequired = body.followUpRequired;
  const followUpNote = followUpRequired ? body.followUpNote.trim() : null;
  const attachmentNotes = body.attachmentNotes === undefined || body.attachmentNotes === "" ? null : body.attachmentNotes;
  const actionAt = new Date(body.actionAt);

  try {
    const action = await prisma.$transaction(async (tx) => {
      const created = await tx.actionTaken.create({
        data: {
          ticketId,
          performedById: user.id,
          actionAt,
          description,
          result,
          followUpRequired,
          followUpNote,
          attachmentNotes,
          version: 1
        },
        select: {
          id: true,
          actionAt: true,
          description: true,
          result: true,
          performedBy: {
            select: { id: true, name: true }
          },
          followUpRequired: true,
          followUpNote: true,
          attachmentNotes: true,
          version: true,
          createdAt: true
        }
      });

      if (idempotencyKey) {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);
        
        await tx.idempotencyKey.create({
          data: {
            userId: user.id,
            endpoint,
            key: idempotencyKey,
            requestHash,
            responseStatus: 201,
            responseBody: created as any,
            expiresAt
          }
        });
      }

      return created;
    });

    return { action, replayed: false };
  } catch (err: any) {
    if (err.code === "P2002" && idempotencyKey) { // Unique constraint violation (likely idempotency key)
      const existingKey = await prisma.idempotencyKey.findUnique({
        where: { userId_endpoint_key: { userId: user.id, endpoint, key: idempotencyKey } }
      });
      if (existingKey) {
        if (existingKey.requestHash === requestHash) {
          return { action: existingKey.responseBody, replayed: true };
        } else {
          throw new ServiceError(422, "IDEMPOTENCY_KEY_REUSED", "Idempotency key reused with different body");
        }
      }
    }
    throw err;
  }
};

export const updateAction = async (ticketId: number, actionId: string, body: any, user: NonNullable<Express.Request["user"]>) => {
  const prisma = getPrisma();
  
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { status: true }
  });

  if (!ticket) {
    throw new ServiceError(404, "NOT_FOUND", "Ticket not found");
  }

  if (ticket.status === TicketStatus.CLOSED || ticket.status === TicketStatus.CANCELLED) {
    throw new ServiceError(409, "TICKET_LOCKED", "Ticket is locked");
  }

  const existingAction = await prisma.actionTaken.findUnique({
    where: { id: actionId, ticketId }
  });

  if (!existingAction) {
    throw new ServiceError(404, "NOT_FOUND", "Action not found");
  }

  // Check follow up requirement for the resulting state
  const willBeFollowUpRequired = body.hasOwnProperty("followUpRequired") ? body.followUpRequired : existingAction.followUpRequired;
  let newFollowUpNote = body.hasOwnProperty("followUpNote") ? body.followUpNote : existingAction.followUpNote;
  
  if (willBeFollowUpRequired) {
    if ((!newFollowUpNote || newFollowUpNote.trim() === "") && body.hasOwnProperty("followUpRequired")) {
        throw new ServiceError(422, "VALIDATION_FAILED", "The provided data is invalid.", { fields: { followUpNote: "Required when follow-up is needed." }});
    }
  } else {
    newFollowUpNote = null;
  }

  const dataToUpdate: any = {
    version: { increment: 1 },
    updatedById: user.id
  };

  if (body.hasOwnProperty("description")) dataToUpdate.description = body.description.trim();
  if (body.hasOwnProperty("result")) dataToUpdate.result = body.result.trim();
  if (body.hasOwnProperty("followUpRequired")) dataToUpdate.followUpRequired = body.followUpRequired;
  dataToUpdate.followUpNote = newFollowUpNote ? newFollowUpNote.trim() : null;
  
  if (body.hasOwnProperty("attachmentNotes")) {
    dataToUpdate.attachmentNotes = body.attachmentNotes === "" ? null : body.attachmentNotes;
  }
  if (body.hasOwnProperty("actionAt")) dataToUpdate.actionAt = new Date(body.actionAt);

  const updateResult = await prisma.actionTaken.updateMany({
    where: {
      id: actionId,
      ticketId,
      version: body.version
    },
    data: dataToUpdate
  });

  if (updateResult.count === 0) {
    // Re-check existence
    const stillExists = await prisma.actionTaken.findUnique({ where: { id: actionId, ticketId } });
    if (!stillExists) {
      throw new ServiceError(404, "NOT_FOUND", "Action not found");
    }
    throw new ServiceError(409, "CONFLICT", "The record has been modified by another user. Please reload and try again.", { currentVersion: stillExists.version });
  }

  const updatedAction = await prisma.actionTaken.findUnique({
    where: { id: actionId },
    select: {
      id: true,
      actionAt: true,
      description: true,
      result: true,
      performedBy: {
        select: { id: true, name: true }
      },
      followUpRequired: true,
      followUpNote: true,
      attachmentNotes: true,
      version: true,
      createdAt: true
    }
  });

  return updatedAction;
};
