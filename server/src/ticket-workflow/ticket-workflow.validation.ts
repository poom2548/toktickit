import { TicketStatus } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';

export const changeStatusValidator = (req: Request, res: Response, next: NextFunction): void => {
  const errors: Record<string, string> = {};
  
  if (!req.body.status) {
    errors.status = 'status is required';
  } else if (!Object.values(TicketStatus).includes(req.body.status)) {
    errors.status = 'invalid status';
  }

  if (req.body.version === undefined) {
    errors.version = 'version is required';
  } else if (!Number.isInteger(req.body.version)) {
    errors.version = 'version must be an integer';
  }

  if (Object.keys(errors).length > 0) {
    res.status(422).json({
      error: {
        code: 'VALIDATION_FAILED',
        message: 'The provided data is invalid.',
        fields: errors
      }
    });
    return;
  }
  next();
};

export const resolvedIndicationValidator = (req: Request, res: Response, next: NextFunction): void => {
  const errors: Record<string, string> = {};
  
  if (typeof req.body.problemAppearsResolved !== 'boolean') {
    errors.problemAppearsResolved = 'problemAppearsResolved must be a boolean';
  }

  if (Object.keys(errors).length > 0) {
    res.status(422).json({
      error: {
        code: 'VALIDATION_FAILED',
        message: 'The provided data is invalid.',
        fields: errors
      }
    });
    return;
  }
  next();
};

export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  // Not used anymore as validation is done inline, keeping for import compatibility if needed, or remove it.
  next();
};
