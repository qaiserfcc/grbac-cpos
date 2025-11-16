import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

interface ApiError extends Error {
  statusCode?: number;
}

export function errorHandler(
  err: ApiError,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) {
  if (err instanceof ZodError) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: 'Validation failed',
      errors: err.errors.map(({ path, message }) => ({
        field: path.join('.') || 'root',
        message,
      })),
    });
  }

  const status = err.statusCode ?? StatusCodes.INTERNAL_SERVER_ERROR;
  const message = err.message ?? 'Internal server error';
  if (status >= StatusCodes.INTERNAL_SERVER_ERROR) {
    logger.error('Unhandled error', err);
  } else {
    logger.warn(message, { status });
  }
  res.status(status).json({ message });
}
