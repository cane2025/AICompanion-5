import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: any;
}

export class ValidationError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} hittades inte`);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string = 'Obehörig') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class RateLimitError extends Error {
  constructor(message: string = 'För många förfrågningar') {
    super(message);
    this.name = 'RateLimitError';
  }
}

// Global error handler middleware
export function errorHandler(
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log error for debugging
  console.error(`❌ Error in ${req.method} ${req.path}:`, error);

  // Default error response
  let status = error.status || 500;
  let message = error.message || 'Ett internt serverfel uppstod';
  let code = error.code;
  let details = error.details;

  // Handle specific error types
  if (error.name === 'ValidationError') {
    status = 400;
    code = 'VALIDATION_ERROR';
  } else if (error.name === 'NotFoundError') {
    status = 404;
    code = 'NOT_FOUND';
  } else if (error.name === 'ConflictError') {
    status = 409;
    code = 'CONFLICT';
  } else if (error.name === 'UnauthorizedError') {
    status = 401;
    code = 'UNAUTHORIZED';
  } else if (error.name === 'RateLimitError') {
    status = 429;
    code = 'RATE_LIMIT_EXCEEDED';
  } else if (error.name === 'ZodError') {
    status = 400;
    code = 'VALIDATION_ERROR';
    message = 'Ogiltiga data';
    details = error.details || (error as any).issues;
  }

  // Don't expose internal errors in production
  if (status === 500 && process.env.NODE_ENV === 'production') {
    message = 'Ett internt serverfel uppstod';
    details = undefined;
  }

  // Send error response
  const errorResponse: any = {
    message,
    code,
    status,
    timestamp: new Date().toISOString(),
    path: req.path,
  };

  if (details) {
    errorResponse.details = details;
  }

  // Add request ID if available
  if (req.headers['x-request-id']) {
    errorResponse.requestId = req.headers['x-request-id'];
  }

  res.status(status).json(errorResponse);
}

// Async error wrapper to catch async errors in route handlers
export function asyncHandler<T extends Request, U extends Response>(
  fn: (req: T, res: U, next: NextFunction) => Promise<any>
) {
  return (req: T, res: U, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// 404 handler for unmatched routes
export function notFoundHandler(req: Request, res: Response) {
  const message = `Rutt ${req.method} ${req.path} hittades inte`;
  res.status(404).json({
    message,
    code: 'ROUTE_NOT_FOUND',
    status: 404,
    timestamp: new Date().toISOString(),
    path: req.path,
  });
}

// Request logging middleware
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  req.headers['x-request-id'] = requestId;
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const level = status >= 400 ? '❌' : status >= 300 ? '⚠️' : '✅';
    
    console.log(`${level} ${req.method} ${req.path} ${status} ${duration}ms [${requestId}]`);
  });
  
  next();
}