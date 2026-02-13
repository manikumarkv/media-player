# API Standards & Response Structure Instructions

**Project:** YouTube Media Player - REST API Standards  
**Purpose:** Define consistent API response structures, HTTP status codes, and conventions  
**Scope:** All backend API endpoints must follow these standards

---

## 🎯 Core Principles

1. **Consistency** - All endpoints follow the same patterns
2. **Predictability** - Clients know what to expect
3. **RESTful** - Follow REST conventions
4. **Type-safe** - TypeScript types for all responses
5. **Self-documenting** - Clear error messages and codes

---

## 📐 Standard Response Structure

### Success Response Format

**All successful responses follow this structure:**

```typescript
{
  "success": true,
  "data": T // Generic type, depends on endpoint
}
```

**TypeScript Interface:**

```typescript
// types/api.ts
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

// Examples
type MediaResponse = ApiSuccessResponse<Media>;
type MediaListResponse = ApiSuccessResponse<Media[]>;
type PlaylistResponse = ApiSuccessResponse<Playlist>;
```

---

### Error Response Format

**All error responses follow this structure:**

```typescript
{
  "success": false,
  "error": {
    "code": string,        // Machine-readable error code
    "message": string,     // Human-readable error message
    "details"?: object,    // Optional additional context
    "timestamp": string    // ISO 8601 timestamp
  }
}
```

**TypeScript Interface:**

```typescript
// types/api.ts
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
  };
}

// Error codes enum
export enum ErrorCode {
  // Client errors (4xx)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_URL = 'INVALID_URL',
  
  // Server errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  FILE_SYSTEM_ERROR = 'FILE_SYSTEM_ERROR',
  DOWNLOAD_ERROR = 'DOWNLOAD_ERROR',
  STREAM_ERROR = 'STREAM_ERROR',
  
  // YouTube specific
  YOUTUBE_VIDEO_UNAVAILABLE = 'YOUTUBE_VIDEO_UNAVAILABLE',
  YOUTUBE_RATE_LIMIT = 'YOUTUBE_RATE_LIMIT',
  YOUTUBE_PRIVATE_VIDEO = 'YOUTUBE_PRIVATE_VIDEO',
  YOUTUBE_AGE_RESTRICTED = 'YOUTUBE_AGE_RESTRICTED',
}
```

---

### Pagination Response Format

**For list endpoints that support pagination:**

```typescript
{
  "success": true,
  "data": T[],
  "pagination": {
    "page": number,        // Current page (1-indexed)
    "limit": number,       // Items per page
    "total": number,       // Total number of items
    "totalPages": number,  // Total number of pages
    "hasNext": boolean,    // Has next page?
    "hasPrev": boolean     // Has previous page?
  }
}
```

**TypeScript Interface:**

```typescript
// types/api.ts
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: PaginationMeta;
}

// Example
type MediaListResponse = PaginatedResponse<Media>;
```

**Query Parameters:**

```
?page=1         # Page number (default: 1)
?limit=20       # Items per page (default: 20, max: 100)
?sort=createdAt # Sort field
?order=desc     # Sort order (asc/desc)
```

---

## 🔢 HTTP Status Codes

### Success Codes (2xx)

| Code | Meaning | When to Use | Example |
|------|---------|-------------|---------|
| **200 OK** | Request successful | GET, PUT, DELETE successful | GET /api/media |
| **201 Created** | Resource created | POST successful | POST /api/playlists |
| **204 No Content** | Success, no body | DELETE successful (optional) | DELETE /api/media/:id |

### Client Error Codes (4xx)

| Code | Meaning | When to Use | Error Code |
|------|---------|-------------|------------|
| **400 Bad Request** | Invalid input | Validation failed | VALIDATION_ERROR |
| **401 Unauthorized** | Not authenticated | Auth required (future) | UNAUTHORIZED |
| **403 Forbidden** | No permission | Access denied (future) | FORBIDDEN |
| **404 Not Found** | Resource missing | ID doesn't exist | NOT_FOUND |
| **409 Conflict** | Resource exists | Duplicate entry | ALREADY_EXISTS |
| **422 Unprocessable** | Invalid data | Business logic error | INVALID_URL |
| **429 Too Many Requests** | Rate limited | Too many requests | RATE_LIMIT_EXCEEDED |

### Server Error Codes (5xx)

| Code | Meaning | When to Use | Error Code |
|------|---------|-------------|------------|
| **500 Internal Error** | Server error | Unexpected error | INTERNAL_ERROR |
| **502 Bad Gateway** | External service | YouTube API down | YOUTUBE_RATE_LIMIT |
| **503 Service Unavailable** | Temporary failure | Database down | DATABASE_ERROR |
| **507 Insufficient Storage** | Disk full | Out of space | FILE_SYSTEM_ERROR |

---

## 📋 Response Examples by Endpoint Type

### GET - Retrieve Single Resource

**Request:**
```http
GET /api/media/123
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "123",
    "title": "Bohemian Rhapsody",
    "artist": "Queen",
    "album": "A Night at the Opera",
    "duration": 354,
    "type": "audio",
    "filePath": "/media/audio/bohemian-rhapsody.mp3",
    "thumbnailUrl": "/media/thumbnails/123.jpg",
    "playCount": 42,
    "liked": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "lastPlayedAt": "2024-02-10T15:45:00Z"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Media with id '123' not found",
    "timestamp": "2024-02-13T21:16:43Z"
  }
}
```

---

### GET - Retrieve List with Pagination

**Request:**
```http
GET /api/media?page=1&limit=20&sort=createdAt&order=desc
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "123",
      "title": "Bohemian Rhapsody",
      "artist": "Queen",
      "duration": 354,
      "type": "audio",
      "playCount": 42,
      "liked": true,
      "createdAt": "2024-01-15T10:30:00Z"
    },
    {
      "id": "124",
      "title": "Stairway to Heaven",
      "artist": "Led Zeppelin",
      "duration": 482,
      "type": "audio",
      "playCount": 38,
      "liked": false,
      "createdAt": "2024-01-14T09:20:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

### GET - Search/Filter

**Request:**
```http
GET /api/media?search=queen&type=audio&liked=true
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "123",
      "title": "Bohemian Rhapsody",
      "artist": "Queen",
      "duration": 354,
      "type": "audio",
      "liked": true
    }
  ]
}
```

**Empty Results (200):**
```json
{
  "success": true,
  "data": []
}
```

**Note:** Empty results are **NOT an error** - use 200 with empty array!

---

### POST - Create Resource

**Request:**
```http
POST /api/playlists
Content-Type: application/json

{
  "name": "Road Trip Mix",
  "description": "Best songs for long drives"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "pl-456",
    "name": "Road Trip Mix",
    "description": "Best songs for long drives",
    "trackCount": 0,
    "duration": 0,
    "createdAt": "2024-02-13T21:16:43Z",
    "updatedAt": "2024-02-13T21:16:43Z"
  }
}
```

**Error Response (400 - Validation):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "name": "Name is required",
      "description": "Description must be less than 500 characters"
    },
    "timestamp": "2024-02-13T21:16:43Z"
  }
}
```

**Error Response (409 - Conflict):**
```json
{
  "success": false,
  "error": {
    "code": "ALREADY_EXISTS",
    "message": "Playlist with name 'Road Trip Mix' already exists",
    "timestamp": "2024-02-13T21:16:43Z"
  }
}
```

---

### PUT/PATCH - Update Resource

**Request:**
```http
PUT /api/media/123
Content-Type: application/json

{
  "title": "Bohemian Rhapsody (Remastered)",
  "liked": true
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "123",
    "title": "Bohemian Rhapsody (Remastered)",
    "artist": "Queen",
    "liked": true,
    "updatedAt": "2024-02-13T21:16:43Z"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Media with id '123' not found",
    "timestamp": "2024-02-13T21:16:43Z"
  }
}
```

---

### DELETE - Remove Resource

**Request:**
```http
DELETE /api/media/123
```

**Success Response (200 with body):**
```json
{
  "success": true,
  "data": {
    "id": "123",
    "message": "Media deleted successfully"
  }
}
```

**OR Success Response (204 No Content):**
```
(empty body)
```

**Error Response (404):**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Media with id '123' not found",
    "timestamp": "2024-02-13T21:16:43Z"
  }
}
```

---

### POST - Async Operation (Downloads)

**Request:**
```http
POST /api/download/video
Content-Type: application/json

{
  "url": "https://youtube.com/watch?v=dQw4w9WgXcQ",
  "quality": "720p"
}
```

**Success Response (202 Accepted):**
```json
{
  "success": true,
  "data": {
    "downloadId": "dl-789",
    "status": "queued",
    "message": "Download started",
    "estimatedTime": 120
  }
}
```

**Status Check:**
```http
GET /api/download/dl-789/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "downloadId": "dl-789",
    "status": "downloading",
    "progress": 45,
    "speed": "2.5 MB/s",
    "eta": 60
  }
}
```

**Error Response (422 - Invalid URL):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_URL",
    "message": "Invalid YouTube URL",
    "details": {
      "url": "https://youtube.com/watch?v=dQw4w9WgXcQ",
      "reason": "Video is unavailable"
    },
    "timestamp": "2024-02-13T21:16:43Z"
  }
}
```

---

## 🛠️ Implementation Patterns

### Express Response Helper

```typescript
// utils/responseHelper.ts

export class ResponseHelper {
  /**
   * Send success response
   */
  static success<T>(res: Response, data: T, statusCode: number = 200): void {
    res.status(statusCode).json({
      success: true,
      data,
    });
  }

  /**
   * Send paginated success response
   */
  static successWithPagination<T>(
    res: Response,
    data: T[],
    pagination: PaginationMeta
  ): void {
    res.status(200).json({
      success: true,
      data,
      pagination,
    });
  }

  /**
   * Send error response
   */
  static error(
    res: Response,
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    details?: Record<string, any>
  ): void {
    res.status(statusCode).json({
      success: false,
      error: {
        code,
        message,
        details,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Send 404 not found
   */
  static notFound(res: Response, resource: string, id: string): void {
    this.error(
      res,
      ErrorCode.NOT_FOUND,
      `${resource} with id '${id}' not found`,
      404
    );
  }

  /**
   * Send 400 validation error
   */
  static validationError(
    res: Response,
    errors: Record<string, string>
  ): void {
    this.error(
      res,
      ErrorCode.VALIDATION_ERROR,
      'Validation failed',
      400,
      errors
    );
  }
}
```

---

### Controller Pattern

```typescript
// routes/media.routes.ts
import { Router, Request, Response } from 'express';
import { MediaService } from '../services/media.service';
import { ResponseHelper } from '../utils/responseHelper';
import { ErrorCode } from '../types/api';

const router = Router();
const mediaService = new MediaService();

/**
 * GET /api/media/:id - Get single media
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const media = await mediaService.getById(req.params.id);
    
    if (!media) {
      return ResponseHelper.notFound(res, 'Media', req.params.id);
    }
    
    ResponseHelper.success(res, media);
  } catch (error) {
    ResponseHelper.error(
      res,
      ErrorCode.INTERNAL_ERROR,
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
});

/**
 * GET /api/media - List all media with pagination
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    
    const result = await mediaService.getAll({ page, limit });
    
    ResponseHelper.successWithPagination(
      res,
      result.data,
      result.pagination
    );
  } catch (error) {
    ResponseHelper.error(
      res,
      ErrorCode.INTERNAL_ERROR,
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
});

/**
 * POST /api/media - Create new media (not used, but example)
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    // Validation
    const errors = await validateMediaInput(req.body);
    if (Object.keys(errors).length > 0) {
      return ResponseHelper.validationError(res, errors);
    }
    
    const media = await mediaService.create(req.body);
    
    ResponseHelper.success(res, media, 201);
  } catch (error) {
    ResponseHelper.error(
      res,
      ErrorCode.INTERNAL_ERROR,
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
});

/**
 * PUT /api/media/:id - Update media
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const media = await mediaService.update(req.params.id, req.body);
    
    if (!media) {
      return ResponseHelper.notFound(res, 'Media', req.params.id);
    }
    
    ResponseHelper.success(res, media);
  } catch (error) {
    ResponseHelper.error(
      res,
      ErrorCode.INTERNAL_ERROR,
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
});

/**
 * DELETE /api/media/:id - Delete media
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await mediaService.delete(req.params.id);
    
    if (!deleted) {
      return ResponseHelper.notFound(res, 'Media', req.params.id);
    }
    
    // Option 1: 204 No Content
    res.status(204).send();
    
    // Option 2: 200 with body (choose one)
    // ResponseHelper.success(res, { 
    //   id: req.params.id,
    //   message: 'Media deleted successfully'
    // });
  } catch (error) {
    ResponseHelper.error(
      res,
      ErrorCode.INTERNAL_ERROR,
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
});

export default router;
```

---

### Global Error Handler

```typescript
// middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { ResponseHelper } from '../utils/responseHelper';
import { ErrorCode } from '../types/api';

/**
 * Custom error classes
 */
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(
      ErrorCode.NOT_FOUND,
      `${resource} with id '${id}' not found`,
      404
    );
  }
}

export class ValidationError extends AppError {
  constructor(errors: Record<string, string>) {
    super(
      ErrorCode.VALIDATION_ERROR,
      'Validation failed',
      400,
      errors
    );
  }
}

export class DownloadError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(ErrorCode.DOWNLOAD_ERROR, message, 500, details);
  }
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Error:', err);

  // Handle custom AppError
  if (err instanceof AppError) {
    return ResponseHelper.error(
      res,
      err.code,
      err.message,
      err.statusCode,
      err.details
    );
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    return ResponseHelper.error(
      res,
      ErrorCode.DATABASE_ERROR,
      'Database operation failed',
      500
    );
  }

  // Handle validation errors from express-validator
  if (err.name === 'ValidationError') {
    return ResponseHelper.validationError(res, (err as any).errors);
  }

  // Generic error
  ResponseHelper.error(
    res,
    ErrorCode.INTERNAL_ERROR,
    process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    500
  );
}
```

---

## 📊 TypeScript Type Definitions

### Complete API Types

```typescript
// types/api.ts

/**
 * Success response wrapper
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

/**
 * Error response wrapper
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
  };
}

/**
 * Unified response type
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: PaginationMeta;
}

/**
 * Error codes
 */
export enum ErrorCode {
  // Client errors (4xx)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_URL = 'INVALID_URL',
  
  // Server errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  FILE_SYSTEM_ERROR = 'FILE_SYSTEM_ERROR',
  DOWNLOAD_ERROR = 'DOWNLOAD_ERROR',
  STREAM_ERROR = 'STREAM_ERROR',
  
  // YouTube specific
  YOUTUBE_VIDEO_UNAVAILABLE = 'YOUTUBE_VIDEO_UNAVAILABLE',
  YOUTUBE_RATE_LIMIT = 'YOUTUBE_RATE_LIMIT',
  YOUTUBE_PRIVATE_VIDEO = 'YOUTUBE_PRIVATE_VIDEO',
  YOUTUBE_AGE_RESTRICTED = 'YOUTUBE_AGE_RESTRICTED',
}

/**
 * Pagination query params
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

/**
 * Media filter params
 */
export interface MediaFilters extends PaginationParams {
  search?: string;
  type?: 'audio' | 'video';
  liked?: boolean;
  artist?: string;
  album?: string;
}
```

---

## 📝 Frontend API Client

### Axios Client Setup

```typescript
// frontend/src/api/client.ts
import axios, { AxiosResponse } from 'axios';
import type { ApiResponse, ApiErrorResponse } from '../types/api';

export const apiClient = axios.create({
  baseURL: process.env.VITE_API_URL || 'http://localhost:3001',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Response interceptor
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    // Extract error response
    const errorResponse: ApiErrorResponse = error.response?.data || {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error.message || 'Network error',
        timestamp: new Date().toISOString(),
      },
    };

    // Throw with structured error
    throw new ApiError(
      errorResponse.error.code,
      errorResponse.error.message,
      error.response?.status || 500,
      errorResponse.error.details
    );
  }
);

/**
 * Custom API error class
 */
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
```

### Type-safe API Methods

```typescript
// frontend/src/api/media.ts
import { apiClient } from './client';
import { endpoints } from '@media-player/shared';
import type { 
  ApiSuccessResponse, 
  PaginatedResponse,
  Media,
  MediaFilters 
} from '../types';

export const mediaApi = {
  /**
   * Get all media with pagination
   */
  async getAll(filters?: MediaFilters): Promise<PaginatedResponse<Media>> {
    const response = await apiClient.get<PaginatedResponse<Media>>(
      endpoints.media.list(),
      { params: filters }
    );
    return response.data;
  },

  /**
   * Get single media by ID
   */
  async getById(id: string): Promise<Media> {
    const response = await apiClient.get<ApiSuccessResponse<Media>>(
      endpoints.media.getById(id)
    );
    return response.data.data;
  },

  /**
   * Update media
   */
  async update(id: string, data: Partial<Media>): Promise<Media> {
    const response = await apiClient.put<ApiSuccessResponse<Media>>(
      endpoints.media.update(id),
      data
    );
    return response.data.data;
  },

  /**
   * Delete media
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(endpoints.media.delete(id));
  },
};
```

---

## ✅ Validation Best Practices

### Input Validation

```typescript
// utils/validation.ts
import { z } from 'zod';

/**
 * Media creation schema
 */
export const createMediaSchema = z.object({
  title: z.string().min(1).max(200),
  artist: z.string().max(100).optional(),
  album: z.string().max(100).optional(),
  duration: z.number().int().min(0).max(86400),
  type: z.enum(['audio', 'video']),
});

/**
 * Playlist creation schema
 */
export const createPlaylistSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

/**
 * YouTube URL schema
 */
export const youtubeUrlSchema = z.object({
  url: z.string().url().regex(/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//),
  quality: z.enum(['144p', '240p', '360p', '480p', '720p', '1080p']).optional(),
});

/**
 * Validation middleware
 */
export function validate<T>(schema: z.Schema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.reduce((acc, err) => {
          acc[err.path.join('.')] = err.message;
          return acc;
        }, {} as Record<string, string>);

        return ResponseHelper.validationError(res, errors);
      }
      next(error);
    }
  };
}

/**
 * Usage in routes
 */
router.post('/', validate(createPlaylistSchema), async (req, res) => {
  // req.body is now validated and typed
  const playlist = await playlistService.create(req.body);
  ResponseHelper.success(res, playlist, 201);
});
```

---

## 🔐 HTTP Headers

### Request Headers

```typescript
Content-Type: application/json       // For JSON payloads
Accept: application/json             // Expected response format
Range: bytes=0-1023                  // For media streaming
```

### Response Headers

```typescript
Content-Type: application/json                    // JSON response
Content-Length: 1234                              // Response size
Cache-Control: no-cache                           // Caching policy
X-Response-Time: 45ms                             // Performance metric
Accept-Ranges: bytes                              // For media streaming
Content-Range: bytes 0-1023/5000                  // Streaming range
```

---

## 🚀 Quick Reference

### Response Status Code Cheat Sheet

```typescript
// Success
200 OK          // GET, PUT successful
201 Created     // POST successful
204 No Content  // DELETE successful (no body)

// Client Errors
400 Bad Request         // Validation failed
404 Not Found          // Resource doesn't exist
409 Conflict           // Resource already exists
422 Unprocessable      // Invalid business logic
429 Too Many Requests  // Rate limited

// Server Errors
500 Internal Error     // Unexpected server error
502 Bad Gateway        // External service failed
503 Service Unavailable // Temporary failure
```

### Error Code to Status Code Mapping

```typescript
const ERROR_STATUS_MAP = {
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.ALREADY_EXISTS]: 409,
  [ErrorCode.INVALID_URL]: 422,
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.FILE_SYSTEM_ERROR]: 500,
  [ErrorCode.DOWNLOAD_ERROR]: 500,
  [ErrorCode.STREAM_ERROR]: 500,
  
  [ErrorCode.YOUTUBE_VIDEO_UNAVAILABLE]: 422,
  [ErrorCode.YOUTUBE_RATE_LIMIT]: 502,
  [ErrorCode.YOUTUBE_PRIVATE_VIDEO]: 403,
  [ErrorCode.YOUTUBE_AGE_RESTRICTED]: 403,
};
```

---

## ✅ Checklist

**Before creating a new endpoint:**

- [ ] Define TypeScript types for request/response
- [ ] Choose correct HTTP method (GET/POST/PUT/DELETE)
- [ ] Choose correct status codes (200/201/400/404/500)
- [ ] Use ResponseHelper for consistent responses
- [ ] Add input validation with Zod
- [ ] Handle all error cases
- [ ] Add error codes for all failures
- [ ] Test with Bruno (see api-testing.instructions.md)
- [ ] Document in OpenAPI/Swagger (future)
- [ ] Add to centralized endpoints (api-routes.instructions.md)

---

## 📚 Related Instructions

- **API Routes:** `.github/instructions/api-routes.instructions.md`
- **Backend:** `.github/instructions/backend.instructions.md`
- **Error Handling:** `.github/instructions/error-handling.instructions.md`
- **API Testing:** `.github/instructions/api-testing.instructions.md`
- **Security:** `.github/instructions/security.instructions.md`

---

## 🎓 Best Practices

1. **Always use ResponseHelper** - Don't manually construct responses
2. **Return 200 for empty results** - Empty array is success, not 404
3. **Use 201 for creation** - Makes intent clear
4. **Consistent error codes** - Machine-readable, not just messages
5. **Add timestamps** - All errors include ISO 8601 timestamp
6. **Validate early** - Check inputs before processing
7. **Don't leak internals** - Generic errors in production
8. **Type everything** - TypeScript types for all requests/responses
9. **Test all codes** - Test success and all error paths
10. **Document as you go** - Update this file when adding patterns

---

**When to Reference:**
- ✅ Creating new API endpoints
- ✅ Handling errors
- ✅ Building frontend API client
- ✅ Writing API tests
- ✅ Reviewing API code
- ✅ Debugging API issues

---

**End of Instructions**
