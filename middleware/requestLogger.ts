import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.validation';

interface LogEntry {
  timestamp: string;
  method: string;
  path: string;
  query: any;
  status?: number;
  duration?: string;
  userAgent?: string;
  userId?: string;
  ip?: string;
  error?: string;
}

/**
 * Request logging middleware
 * Logs all incoming requests and their responses
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const requestId = generateRequestId();

  // Attach request ID to request for tracking
  (req as any).requestId = requestId;

  // Log request
  const logEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    query: req.query,
    userAgent: req.get('user-agent'),
    ip: req.ip || req.socket.remoteAddress,
  };

  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    const responseLog: LogEntry = {
      ...logEntry,
      status: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?._id?.toString(),
    };

    // Color code by status
    const statusColor = getStatusColor(res.statusCode);
    const logLevel = res.statusCode >= 400 ? 'error' : 'info';

    if (env.NODE_ENV === 'development') {
      // Pretty print in development
      console.log(
        `[${statusColor}${res.statusCode}\x1b[0m] ${req.method} ${req.path} - ${duration}ms ${req.user ? `(User: ${req.user._id})` : ''}`
      );
    } else {
      // JSON format for production (easier to parse)
      console[logLevel](JSON.stringify(responseLog));
    }
  });

  // Log errors
  res.on('error', (error: Error) => {
    const errorLog: LogEntry = {
      ...logEntry,
      error: error.message,
      status: res.statusCode || 500,
    };
    
    console.error(JSON.stringify(errorLog));
  });

  next();
};

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get ANSI color code for HTTP status
 */
function getStatusColor(status: number): string {
  if (status >= 500) return '\x1b[31m'; // Red
  if (status >= 400) return '\x1b[33m'; // Yellow
  if (status >= 300) return '\x1b[36m'; // Cyan
  if (status >= 200) return '\x1b[32m'; // Green
  return '\x1b[0m'; // Reset
}

/**
 * Middleware to log slow requests
 */
export const slowRequestLogger = (thresholdMs: number = 1000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      if (duration > thresholdMs) {
        console.warn(
          `[SLOW REQUEST] ${req.method} ${req.path} took ${duration}ms (threshold: ${thresholdMs}ms)`,
          {
            userId: req.user?._id,
            query: req.query,
            timestamp: new Date().toISOString(),
          }
        );
      }
    });

    next();
  };
};

/**
 * Middleware to log API errors
 */
export const errorLogger = (err: any, req: Request, res: Response, next: NextFunction): void => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    error: {
      message: err.message,
      stack: env.NODE_ENV === 'development' ? err.stack : undefined,
      name: err.name,
    },
    userId: req.user?._id,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
  };

  console.error('[API ERROR]', JSON.stringify(errorLog, null, 2));
  
  next(err);
};

export default requestLogger;
