# Error Handling Instructions

**Project:** YouTube Media Player - Error Handling & Logging  
**Purpose:** Define error classification, handling patterns, logging strategy  
**Scope:** Backend errors, frontend error boundaries, API responses, logging

---

## 🎯 Error Handling Philosophy

1. **Fail Gracefully** - Never crash the app
2. **Clear Messages** - Users understand what went wrong
3. **Log Everything** - Developers can debug production issues
4. **Recover When Possible** - Retry, fallback, degrade gracefully
5. **Type-Safe Errors** - Use custom error classes

---

## 🔧 Required Dependencies

### Backend

\`\`\`json
{
  "dependencies": {
    "winston": "^3.11.0",
    "winston-daily-rotate-file": "^4.7.0"
  }
}
\`\`\`

### Frontend

\`\`\`json
{
  "dependencies": {
    "react-error-boundary": "^4.0.0",
    "react-hot-toast": "^2.4.1"
  }
}
\`\`\`

---

## 📦 Custom Error Classes (Backend)

### Base Error Class

\`\`\`typescript
// backend/src/errors/AppError.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public isOperational: boolean = true,
    public details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }
}
\`\`\`

### Specific Error Classes

\`\`\`typescript
// backend/src/errors/index.ts
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', true, details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      \`\${resource}\${id ? \` with id '\${id}'\` : ''} not found\`,
      404,
      'NOT_FOUND',
      true
    );
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED', true);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT', true);
  }
}

export class DownloadError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 500, 'DOWNLOAD_ERROR', true, details);
  }
}
\`\`\`

---

## 🛡️ Global Error Middleware (Backend)

\`\`\`typescript
// backend/src/middleware/error.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { logger } from '../utils/logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log error
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Handle known errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(err.toJSON());
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Database operation failed',
      },
    });
  }

  // Handle unknown errors
  if (process.env.NODE_ENV === 'production') {
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  }

  // Development: expose full error
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: err.message,
      stack: err.stack,
    },
  });
}

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
\`\`\`

---

## 📝 Logging Setup (Winston)

\`\`\`typescript
// backend/src/utils/logger.ts
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const transports: winston.transport[] = [
  // Console logging
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        return \`\${timestamp} [\${level}]: \${message} \${
          Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
        }\`;
      })
    ),
  }),
];

// Production: rotate logs daily
if (process.env.NODE_ENV === 'production') {
  transports.push(
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '14d',
      format: logFormat,
    }),
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '7d',
      format: logFormat,
    })
  );
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports,
});
\`\`\`

---

## ⚛️ React Error Boundaries

\`\`\`typescript
// frontend/src/components/ErrorBoundary/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';
import { logger } from '@/utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    logger.error('React Error Boundary caught error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="error-fallback">
            <h2>Something went wrong</h2>
            <button onClick={() => this.setState({ hasError: false })}>
              Try again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

// Usage in App.tsx
<ErrorBoundary fallback={<ErrorFallback />}>
  <Player />
</ErrorBoundary>
\`\`\`

---

## 🌐 API Error Handling (Frontend)

\`\`\`typescript
// frontend/src/api/client.ts
import axios from 'axios';
import toast from 'react-hot-toast';
import { endpoints } from '@/shared/constants/endpoints';

export const apiClient = axios.create({
  baseURL: endpoints.base,
  timeout: 30000,
});

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          toast.error(data.error?.message || 'Invalid request');
          break;
        case 404:
          toast.error(data.error?.message || 'Not found');
          break;
        case 500:
          toast.error('Server error. Please try again later.');
          break;
        default:
          toast.error('An error occurred');
      }
    } else if (error.request) {
      toast.error('Network error. Check your connection.');
    }

    return Promise.reject(error);
  }
);
\`\`\`

---

## 🔄 Retry Logic with Exponential Backoff

\`\`\`typescript
// shared/utils/retry.ts
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

// Usage
const media = await retryWithBackoff(() => 
  apiClient.get(endpoints.media.getById(id))
);
\`\`\`

---

## 🔌 Socket Error Handling

\`\`\`typescript
// backend/src/services/download.service.ts
import { SOCKET_EVENTS } from '@/shared/constants/socket-events';
import { logger } from '../utils/logger';

export async function downloadMedia(url: string, socket: Socket) {
  try {
    // Download logic
    socket.emit(SOCKET_EVENTS.DOWNLOAD_PROGRESS, { progress: 50 });
  } catch (error) {
    logger.error('Download failed', { url, error: (error as Error).message });
    
    socket.emit(SOCKET_EVENTS.DOWNLOAD_ERROR, {
      url,
      error: (error as Error).message,
    });
    
    throw new DownloadError('Failed to download media', { url });
  }
}
\`\`\`

---

## ✅ API Response Format

### Success Response

\`\`\`typescript
{
  "success": true,
  "data": { /* result */ }
}
\`\`\`

### Error Response

\`\`\`typescript
{
  "success": false,
  "error": {
    "code": "MEDIA_NOT_FOUND",
    "message": "Media with id '123' not found",
    "details": {} // optional
  }
}
\`\`\`

---

## 📚 Related Instructions

- **Backend:** \`.github/instructions/backend.instructions.md\`
- **Frontend:** \`.github/instructions/frontend.instructions.md\`
- **Security:** \`.github/instructions/security.instructions.md\`

---

**When to Reference:**
- ✅ Adding new API endpoints
- ✅ Handling user input
- ✅ Implementing download functionality
- ✅ Debugging production issues
- ✅ Setting up logging
