import type { ErrorRequestHandler } from 'express';
import pino from 'pino';

const logger = pino();

/**
 * Global Express error handling middleware.
 * Logs the error and returns a 500 Internal Server Error JSON response.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  logger.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
};

export default errorHandler;
