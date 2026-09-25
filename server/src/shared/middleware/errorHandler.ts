import type { ErrorRequestHandler } from 'express';
import pino from 'pino';
import { AppError } from '../errors/AppError.js';

const logger = pino();

/**
 * Global Express error handling middleware conforming to RFC-7807 format.
 * Returns { error: { code, message, details? } }
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(err);
    }
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  // Fallback for unhandled unexpected exceptions
  logger.error(err);
  res.status(500).json({
    error: {
      code: 'INTERNAL',
      message: 'Internal Server Error',
    },
  });
};

export default errorHandler;
