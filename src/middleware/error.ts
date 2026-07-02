import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Global error handler middleware
export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error('Unhandled Server Error:', err);

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  // Include error stack in development environment
  const response: any = {
    message,
    status,
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(status).json(response);
};
