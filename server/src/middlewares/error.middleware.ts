import { Request, Response, NextFunction } from "express";

// Extend the Error interface to carry HTTP status and optional field-level details
export interface AppError extends Error {
  status?: number;
  statusCode?: number;
  details?: Array<{ field: string; message: string }>;
}

/**
 * Global Error Handler (must have exactly 4 parameters for Express to treat
 * it as an error-handling middleware).
 *
 * Mount this LAST in app.ts, after all routes.
 * Response shape: { error: string, details?: Array<{ field, message }> }
 */
export function errorMiddleware(
  err: AppError,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const status = err.status ?? err.statusCode ?? 500;
  const body: { error: string; details?: AppError["details"] } = {
    error: err.message ?? "Internal Server Error",
  };

  if (err.details && err.details.length > 0) {
    body.details = err.details;
  }

  if (status >= 500) {
    // Log server-side errors but don't expose internals to the client
    console.error("[ErrorMiddleware]", err);
  }

  res.status(status).json(body);
}
