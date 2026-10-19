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
  // Handle malformed JSON request body from express.json()
  if (
    err instanceof SyntaxError &&
    ("status" in err || "statusCode" in err) &&
    ((err as any).status === 400 || (err as any).statusCode === 400) &&
    "body" in err
  ) {
    res.status(422).json({
      error: {
        code: "VALIDATION_FAILED",
        message: "Malformed request body.",
      },
    });
    return;
  }

  const status = err.status ?? err.statusCode ?? 500;

  if (status >= 500) {
    // Log server-side errors but don't expose internals to the client
    console.error("[ErrorMiddleware]", err);
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred.",
      },
    });
    return;
  }

  const body: { error: string; details?: AppError["details"] } = {
    error: err.message ?? "Internal Server Error",
  };

  if (err.details && err.details.length > 0) {
    body.details = err.details;
  }

  res.status(status).json(body);
}
