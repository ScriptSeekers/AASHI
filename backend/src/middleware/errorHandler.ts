import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Handle Zod Validation Error
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation Error',
      message: err.errors[0]?.message || 'Invalid input data',
      details: err.errors
    });
    return;
  }

  // Handle Custom Application Error
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.name,
      message: err.message
    });
    return;
  }

  // Handle Prisma Known Errors
  if (err?.code === 'P2002') {
    res.status(409).json({
      error: 'ConflictError',
      message: 'A record with this unique field already exists.'
    });
    return;
  }

  // Handle generic error
  console.error('[UNHANDLED_ERROR]', err);
  res.status(500).json({
    error: 'InternalServerError',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred. Please try again later.'
      : err.message || 'Internal server error'
  });
}
