import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export class AppError extends Error {
  statusCode: number;
  code: string;
  
  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let code = 'INTERNAL_ERROR';
  
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
    code = 'VALIDATION_ERROR';
  }
  
  logger.error({
    error: err.message,
    stack: err.stack,
    statusCode,
    url: req.url,
    method: req.method
  });
  
  res.status(statusCode).json({
    error: message,
    code,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};