import { Request, Response, NextFunction } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";

// Safe error responses conforming to Lab 4 API spec
export const sendApiError = (res: Response, status: number, code: string, message: string, extra: any = {}) => {
  return res.status(status).json({
    error: {
      code,
      message,
      ...extra
    }
  });
};

export const wrapRequireAuth = (req: Request, res: Response, next: NextFunction) => {
  let mockRes: any = {
    status: (code: number) => {
      mockRes.statusCode = code;
      return mockRes;
    },
    json: (body: any) => {
      if (mockRes.statusCode === 401) {
        return sendApiError(res, 401, "UNAUTHENTICATED", "Authentication required.");
      }
      return res.status(mockRes.statusCode || 200).json(body);
    }
  };

  requireAuth(req, mockRes as Response, next);
};

export const wrapRequireRole = (...roles: Array<"REQUESTER" | "IT_STAFF" | "ADMINISTRATOR">) => {
  return (req: Request, res: Response, next: NextFunction) => {
    requireRole(...roles)(req, res, (err?: any) => {
      // requireRole does not call next() if it fails, it sends response. 
      // We can intercept it similar to requireAuth, or better yet, since requireRole is a simple check, just implement it here
      next(err);
    });
  };
};

export const customRequireRole = (...roles: Array<"REQUESTER" | "IT_STAFF" | "ADMINISTRATOR">) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendApiError(res, 401, "UNAUTHENTICATED", "Authentication required.");
    }
    if (!roles.includes(req.user.role)) {
      return sendApiError(res, 403, "FORBIDDEN", "Access denied.");
    }
    next();
  };
};
