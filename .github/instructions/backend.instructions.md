# Backend Development Instructions

## Overview
This skill provides expertise for building the Node.js/Express backend API for the offline media player application.

## Technology Focus
- Node.js 18+ with TypeScript
- Express.js framework
- Prisma ORM for PostgreSQL
- Socket.io for real-time communication
- ytdl-core or yt-dlp for YouTube downloads
- FFmpeg for media processing
- **Centralized URL Management** (see `api-routes.instructions.md`)

## Core Responsibilities
1. REST API for media library management
2. Media file streaming with range request support
3. YouTube download orchestration
4. Play history and statistics tracking
5. Playlist management
6. Real-time download progress via WebSocket
7. **Use centralized route constants - NEVER hardcode routes**
8. **Create Bruno API tests for all endpoints**

---

## Project Structure

```
backend/
├── src/
│   ├── server.ts              # Express app entry point
│   ├── config/
│   │   └── database.ts        # Prisma client setup
│   ├── routes/
│   │   ├── media.routes.ts    # Media CRUD endpoints
│   │   ├── player.routes.ts   # Playback tracking
│   │   ├── playlist.routes.ts # Playlist management
│   │   ├── download.routes.ts # YouTube download
│   │   └── settings.routes.ts # User settings
│   ├── services/
│   │   ├── media.service.ts   # Media business logic
│   │   ├── player.service.ts  # Play tracking
│   │   ├── playlist.service.ts# Playlist operations
│   │   ├── youtube.service.ts # YouTube download
│   │   └── stream.service.ts  # Media streaming
│   ├── middleware/
│   │   ├── errorHandler.ts    # Global error handler
│   │   ├── validator.ts       # Input validation
│   │   └── logger.ts          # Request logging
│   ├── utils/
│   │   ├── fileSystem.ts      # File operations
│   │   └── helpers.ts         # Utility functions
│   ├── types/
│   │   └── index.ts           # TypeScript types
│   └── db/
│       ├── schema.prisma      # Database schema
│       └── migrations/        # DB migrations
├── tsconfig.json
├── package.json
└── Dockerfile
```

---

## Express Server Setup

### Basic Server Configuration
```typescript
// server.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './middleware/logger';

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Initialize Prisma
export const prisma = new PrismaClient();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(logger);

// Routes
app.use('/api', routes);

// Error handling
app.use(errorHandler);

// WebSocket
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  server.close();
});
```

---

## Service Layer Pattern

### Base Service Class
```typescript
// services/base.service.ts
import { PrismaClient } from '@prisma/client';

export abstract class BaseService {
  constructor(protected prisma: PrismaClient) {}
}
```

### Media Service
```typescript
// services/media.service.ts
import { BaseService } from './base.service';
import { Media, Prisma } from '@prisma/client';
import { NotFoundError } from '../utils/errors';
import fs from 'fs/promises';
import path from 'path';

export interface MediaFilters {
  page?: number;
  perPage?: number;
  type?: 'audio' | 'video';
  liked?: boolean;
  search?: string;
  sort?: 'title' | 'playCount' | 'downloadedAt' | 'lastPlayedAt';
  order?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    hasMore: boolean;
  };
}

export class MediaService extends BaseService {
  async findAll(filters: MediaFilters): Promise<PaginatedResult<Media>> {
    const page = filters.page || 1;
    const perPage = Math.min(filters.perPage || 50, 100);
    const skip = (page - 1) * perPage;
    
    const where = this.buildWhereClause(filters);
    const orderBy = this.buildOrderByClause(filters.sort, filters.order);
    
    const [data, total] = await Promise.all([
      this.prisma.media.findMany({
        where,
        orderBy,
        skip,
        take: perPage,
      }),
      this.prisma.media.count({ where }),
    ]);
    
    return {
      data,
      meta: {
        page,
        perPage,
        total,
        hasMore: page * perPage < total,
      },
    };
  }
  
  async findById(id: string): Promise<Media> {
    const media = await this.prisma.media.findUnique({
      where: { id },
    });
    
    if (!media) {
      throw new NotFoundError('Media not found');
    }
    
    return media;
  }
  
  async toggleLike(id: string): Promise<boolean> {
    const media = await this.findById(id);
    
    const updated = await this.prisma.media.update({
      where: { id },
      data: { liked: !media.liked },
    });
    
    return updated.liked;
  }
  
  async delete(id: string): Promise<void> {
    const media = await this.findById(id);
    
    // Delete file from filesystem
    try {
      await fs.unlink(media.filePath);
      if (media.thumbnail) {
        await fs.unlink(media.thumbnail);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
    
    // Delete from database (cascades to relations)
    await this.prisma.media.delete({
      where: { id },
    });
  }
  
  async getFavorites(page: number = 1, perPage: number = 50): Promise<PaginatedResult<Media>> {
    return this.findAll({ page, perPage, liked: true });
  }
  
  async getFrequentlyPlayed(limit: number = 20): Promise<Media[]> {
    return this.prisma.media.findMany({
      where: { playCount: { gt: 0 } },
      orderBy: { playCount: 'desc' },
      take: limit,
    });
  }
  
  async getRecentlyPlayed(limit: number = 20): Promise<Media[]> {
    return this.prisma.media.findMany({
      where: { lastPlayedAt: { not: null } },
      orderBy: { lastPlayedAt: 'desc' },
      take: limit,
    });
  }
  
  private buildWhereClause(filters: MediaFilters): Prisma.MediaWhereInput {
    const where: Prisma.MediaWhereInput = {};
    
    if (filters.type) {
      where.type = filters.type;
    }
    
    if (filters.liked !== undefined) {
      where.liked = filters.liked;
    }
    
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { artist: { contains: filters.search, mode: 'insensitive' } },
        { channel: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    
    return where;
  }
  
  private buildOrderByClause(
    sort?: string,
    order?: string
  ): Prisma.MediaOrderByWithRelationInput {
    const direction = order === 'asc' ? 'asc' : 'desc';
    
    switch (sort) {
      case 'title':
        return { title: direction };
      case 'playCount':
        return { playCount: direction };
      case 'lastPlayedAt':
        return { lastPlayedAt: direction };
      default:
        return { downloadedAt: 'desc' };
    }
  }
}
```

### Player Service
```typescript
// services/player.service.ts
import { BaseService } from './base.service';

export class PlayerService extends BaseService {
  async recordPlay(
    mediaId: string,
    duration: number,
    completedPlay: boolean
  ): Promise<void> {
    await this.prisma.$transaction([
      // Create play history entry
      this.prisma.playHistory.create({
        data: {
          mediaId,
          duration,
          completedPlay,
        },
      }),
      
      // Update media stats
      this.prisma.media.update({
        where: { id: mediaId },
        data: {
          playCount: { increment: 1 },
          lastPlayedAt: new Date(),
        },
      }),
    ]);
  }
}
```

### Playlist Service
```typescript
// services/playlist.service.ts
import { BaseService } from './base.service';
import { Playlist, Media } from '@prisma/client';
import { NotFoundError } from '../utils/errors';

export class PlaylistService extends BaseService {
  async findAll(): Promise<Playlist[]> {
    return this.prisma.playlist.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
  
  async findById(id: string): Promise<Playlist & { tracks: Media[] }> {
    const playlist = await this.prisma.playlist.findUnique({
      where: { id },
      include: {
        playlistMedia: {
          include: { media: true },
          orderBy: { position: 'asc' },
        },
      },
    });
    
    if (!playlist) {
      throw new NotFoundError('Playlist not found');
    }
    
    return {
      ...playlist,
      tracks: playlist.playlistMedia.map((pm) => pm.media),
    };
  }
  
  async create(name: string, description?: string): Promise<Playlist> {
    return this.prisma.playlist.create({
      data: { name, description },
    });
  }
  
  async update(
    id: string,
    data: { name?: string; description?: string }
  ): Promise<Playlist> {
    return this.prisma.playlist.update({
      where: { id },
      data,
    });
  }
  
  async delete(id: string): Promise<void> {
    await this.prisma.playlist.delete({
      where: { id },
    });
  }
  
  async addTrack(playlistId: string, mediaId: string, position?: number): Promise<void> {
    const playlist = await this.prisma.playlist.findUnique({
      where: { id: playlistId },
      include: { playlistMedia: true },
    });
    
    if (!playlist) {
      throw new NotFoundError('Playlist not found');
    }
    
    const pos = position ?? playlist.playlistMedia.length;
    
    await this.prisma.$transaction([
      this.prisma.playlistMedia.create({
        data: {
          playlistId,
          mediaId,
          position: pos,
        },
      }),
      this.prisma.playlist.update({
        where: { id: playlistId },
        data: {
          trackCount: { increment: 1 },
        },
      }),
    ]);
  }
  
  async removeTrack(playlistId: string, mediaId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.playlistMedia.delete({
        where: {
          playlistId_mediaId: {
            playlistId,
            mediaId,
          },
        },
      }),
      this.prisma.playlist.update({
        where: { id: playlistId },
        data: {
          trackCount: { decrement: 1 },
        },
      }),
    ]);
  }
  
  async reorderTracks(
    playlistId: string,
    updates: { mediaId: string; position: number }[]
  ): Promise<void> {
    await this.prisma.$transaction(
      updates.map((update) =>
        this.prisma.playlistMedia.update({
          where: {
            playlistId_mediaId: {
              playlistId,
              mediaId: update.mediaId,
            },
          },
          data: { position: update.position },
        })
      )
    );
  }
}
```

---

## Media Streaming with Range Requests

### Stream Service
```typescript
// services/stream.service.ts
import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { MediaService } from './media.service';

export class StreamService {
  constructor(
    private mediaService: MediaService
  ) {}
  
  async streamMedia(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const media = await this.mediaService.findById(id);
    
    const filePath = media.filePath;
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    
    if (range) {
      // Parse range header
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;
      
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': this.getContentType(media.type),
      };
      
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      // No range, send entire file
      const head = {
        'Content-Length': fileSize,
        'Content-Type': this.getContentType(media.type),
      };
      
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  }
  
  private getContentType(type: string): string {
    return type === 'video' ? 'video/mp4' : 'audio/mpeg';
  }
}
```

---

## YouTube Download Service

### Download Service
```typescript
// services/youtube.service.ts
import ytdl from 'ytdl-core';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import { Server as SocketIOServer } from 'socket.io';
import { MediaService } from './media.service';

export interface DownloadOptions {
  url: string;
  quality?: string;
  type: 'video' | 'audio';
}

export class YoutubeService {
  constructor(
    private mediaService: MediaService,
    private io: SocketIOServer
  ) {}
  
  async getMetadata(url: string) {
    const info = await ytdl.getInfo(url);
    
    return {
      videoId: info.videoDetails.videoId,
      title: info.videoDetails.title,
      duration: parseInt(info.videoDetails.lengthSeconds),
      thumbnail: info.videoDetails.thumbnails[0]?.url,
      channel: info.videoDetails.author.name,
      views: parseInt(info.videoDetails.viewCount),
      uploadDate: info.videoDetails.uploadDate,
      availableQualities: this.extractQualities(info.formats),
    };
  }
  
  async downloadVideo(options: DownloadOptions): Promise<string> {
    const downloadId = this.generateId();
    const { url, quality = '720p' } = options;
    
    try {
      const info = await ytdl.getInfo(url);
      const format = this.selectFormat(info.formats, quality);
      
      const filename = this.sanitizeFilename(info.videoDetails.title);
      const outputPath = path.join(process.env.MEDIA_PATH || '/app/media', `${filename}.mp4`);
      
      const stream = ytdl(url, { format });
      const fileStream = stream.pipe(fs.createWriteStream(outputPath));
      
      let downloadedBytes = 0;
      const totalBytes = parseInt(format.contentLength || '0');
      
      stream.on('progress', (_, downloaded, total) => {
        downloadedBytes = downloaded;
        const progress = (downloaded / total) * 100;
        
        this.io.emit('download:progress', {
          downloadId,
          progress: Math.round(progress),
          speed: this.calculateSpeed(downloaded),
          eta: this.calculateETA(downloaded, total),
        });
      });
      
      await new Promise((resolve, reject) => {
        fileStream.on('finish', resolve);
        fileStream.on('error', reject);
      });
      
      // Save to database
      await this.saveToDatabase(info, outputPath, 'video');
      
      this.io.emit('download:complete', { downloadId });
      
      return outputPath;
    } catch (error) {
      this.io.emit('download:error', {
        downloadId,
        error: error.message,
      });
      throw error;
    }
  }
  
  async downloadAudio(options: DownloadOptions): Promise<string> {
    const downloadId = this.generateId();
    const { url } = options;
    
    try {
      const info = await ytdl.getInfo(url);
      const filename = this.sanitizeFilename(info.videoDetails.title);
      const tempPath = path.join(process.env.MEDIA_PATH || '/app/media', `${filename}.temp.mp4`);
      const outputPath = path.join(process.env.MEDIA_PATH || '/app/media', `${filename}.mp3`);
      
      // Download audio stream
      const stream = ytdl(url, { quality: 'highestaudio' });
      const fileStream = stream.pipe(fs.createWriteStream(tempPath));
      
      await new Promise((resolve, reject) => {
        fileStream.on('finish', resolve);
        fileStream.on('error', reject);
      });
      
      // Convert to MP3 with FFmpeg
      await this.convertToMP3(tempPath, outputPath, downloadId);
      
      // Delete temp file
      await fs.unlink(tempPath);
      
      // Save to database
      await this.saveToDatabase(info, outputPath, 'audio');
      
      this.io.emit('download:complete', { downloadId });
      
      return outputPath;
    } catch (error) {
      this.io.emit('download:error', {
        downloadId,
        error: error.message,
      });
      throw error;
    }
  }
  
  private convertToMP3(inputPath: string, outputPath: string, downloadId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .toFormat('mp3')
        .audioBitrate(192)
        .on('progress', (progress) => {
          this.io.emit('download:progress', {
            downloadId,
            progress: Math.round(progress.percent || 0),
            status: 'processing',
          });
        })
        .on('end', resolve)
        .on('error', reject)
        .save(outputPath);
    });
  }
  
  private async saveToDatabase(info: any, filePath: string, type: string): Promise<void> {
    const stat = await fs.stat(filePath);
    
    await this.prisma.media.create({
      data: {
        title: info.videoDetails.title,
        youtubeId: info.videoDetails.videoId,
        type,
        duration: parseInt(info.videoDetails.lengthSeconds),
        thumbnail: info.videoDetails.thumbnails[0]?.url,
        filePath,
        fileSize: stat.size,
        channel: info.videoDetails.author.name,
      },
    });
  }
  
  private sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  }
  
  private generateId(): string {
    return `dl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private extractQualities(formats: any[]): string[] {
    const qualities = new Set<string>();
    formats.forEach((format) => {
      if (format.qualityLabel) {
        qualities.add(format.qualityLabel);
      }
    });
    return Array.from(qualities);
  }
  
  private selectFormat(formats: any[], quality: string): any {
    return formats.find((f) => f.qualityLabel === quality) || formats[0];
  }
  
  private calculateSpeed(bytes: number): string {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB/s`;
  }
  
  private calculateETA(downloaded: number, total: number): string {
    const remaining = total - downloaded;
    const seconds = Math.round(remaining / (downloaded / Date.now()));
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  }
}
```

---

## Middleware

### Error Handler
```typescript
// middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err);
  
  if (err instanceof NotFoundError) {
    return res.status(404).json({
      error: {
        message: err.message,
        code: 'NOT_FOUND',
      },
    });
  }
  
  if (err instanceof ValidationError) {
    return res.status(400).json({
      error: {
        message: err.message,
        code: 'VALIDATION_ERROR',
      },
    });
  }
  
  res.status(500).json({
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
  });
};
```

### Request Logger
```typescript
// middleware/logger.ts
import { Request, Response, NextFunction } from 'express';

export const logger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `${req.method} ${req.path} ${res.statusCode} - ${duration}ms`
    );
  });
  
  next();
};
```

---

## Route Configuration

### Route Setup
```typescript
// routes/index.ts
import { Router } from 'express';
import mediaRoutes from './media.routes';
import playerRoutes from './player.routes';
import playlistRoutes from './playlist.routes';
import downloadRoutes from './download.routes';

const router = Router();

router.use('/media', mediaRoutes);
router.use('/player', playerRoutes);
router.use('/playlists', playlistRoutes);
router.use('/download', downloadRoutes);

export default router;
```

### Media Routes

```typescript
// routes/media.routes.ts
import { Router } from 'express';
import { API_ROUTES } from '../../../shared/constants/routes';
import { MediaService } from '../services/media.service';
import { StreamService } from '../services/stream.service';
import { prisma } from '../server';

const router = Router();
const mediaService = new MediaService(prisma);
const streamService = new StreamService(mediaService);

// ✅ CORRECT - Use centralized route constants
// NEVER hardcode route strings!

router.get(API_ROUTES.MEDIA.BASE, async (req, res, next) => {
  try {
    const result = await mediaService.findAll(req.query);
    res.json({ data: result.data, meta: result.meta });
  } catch (error) {
    next(error);
  }
});

router.get(API_ROUTES.MEDIA.BY_ID, async (req, res, next) => {
  try {
    const media = await mediaService.findById(req.params.id);
    res.json({ data: media });
  } catch (error) {
    next(error);
  }
});

router.get(API_ROUTES.MEDIA.SEARCH, async (req, res, next) => {
  try {
    const results = await mediaService.search(req.query.q as string, req.query);
    res.json({ data: results });
  } catch (error) {
    next(error);
  }
});

router.get(API_ROUTES.MEDIA.LIKED, async (req, res, next) => {
  try {
    const liked = await mediaService.findLiked();
    res.json({ data: liked });
  } catch (error) {
    next(error);
  }
});

router.get(API_ROUTES.MEDIA.FREQUENT, async (req, res, next) => {
  try {
    const frequent = await mediaService.findFrequent(parseInt(req.query.limit as string) || 20);
    res.json({ data: frequent });
  } catch (error) {
    next(error);
  }
});

router.get(API_ROUTES.MEDIA.STREAM, async (req, res, next) => {
  try {
    await streamService.streamMedia(req, res);
  } catch (error) {
    next(error);
  }
});

router.patch(API_ROUTES.MEDIA.BY_ID, async (req, res, next) => {
  try {
    const updated = await mediaService.update(req.params.id, req.body);
    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
});

router.delete(API_ROUTES.MEDIA.BY_ID, async (req, res, next) => {
  try {
    await mediaService.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
```

### Player Routes

```typescript
// routes/player.routes.ts
import { Router } from 'express';
import { API_ROUTES } from '../../../shared/constants/routes';
import { PlayerService } from '../services/player.service';

const router = Router();
const playerService = new PlayerService(prisma);

// Use centralized route constants
router.post(API_ROUTES.PLAYER.PLAY, async (req, res, next) => {
  try {
    await playerService.recordPlay(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.post(API_ROUTES.PLAYER.RESUME, async (req, res, next) => {
  try {
    const position = parseInt(req.query.position as string) || 0;
    await playerService.resumePlay(req.params.id, position);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.get(API_ROUTES.PLAYER.HISTORY, async (req, res, next) => {
  try {
    const history = await playerService.getHistory(req.query);
    res.json({ data: history });
  } catch (error) {
    next(error);
  }
});

export default router;
```

### Socket Events

```typescript
// services/download.service.ts
import { SOCKET_EVENTS } from '../../../shared/constants/socket-events';
import { SocketService } from './socket.service';

export class DownloadService {
  constructor(private socketService: SocketService) {}
  
  async downloadMedia(url: string, socketId: string): Promise<void> {
    // ✅ Use centralized event constants - NEVER hardcode event names!
    
    this.socketService.emitTo(socketId, SOCKET_EVENTS.DOWNLOAD.STARTED, {
      url,
      timestamp: new Date(),
    });
    
    // Download logic...
    const stream = ytdl(url);
    
    stream.on('progress', (chunk, downloaded, total) => {
      const progress = (downloaded / total) * 100;
      this.socketService.emitTo(socketId, SOCKET_EVENTS.DOWNLOAD.PROGRESS, {
        progress,
        downloaded,
        total,
      });
    });
    
    stream.on('end', () => {
      this.socketService.emitTo(socketId, SOCKET_EVENTS.DOWNLOAD.COMPLETE, {
        url,
        mediaId: 'abc123',
      });
    });
    
    stream.on('error', (error) => {
      this.socketService.emitTo(socketId, SOCKET_EVENTS.DOWNLOAD.ERROR, {
        url,
        error: error.message,
      });
    });
  }
}
```

---

## Environment Configuration

### .env.example
```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://admin:password@postgres:5432/media_player_prod

# Paths
MEDIA_PATH=/app/media

# Frontend
FRONTEND_URL=http://localhost:5173
```

---

## Common Pitfalls

### ❌ Don't
- Don't block event loop with synchronous operations
- Don't expose internal errors to client
- Don't forget to validate user input
- Don't load entire files into memory
- Don't forget to close database connections

### ✅ Do
- Use async/await for all I/O operations
- Implement proper error handling
- Use transactions for multi-step operations
- Stream large files
- Add request validation
- Log errors appropriately
