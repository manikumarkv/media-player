import fs from 'fs';
import path from 'path';
import { config } from '../config/database.js';
import { NotFoundError, BadRequestError } from '../errors/index.js';
import { type StreamResult } from '../types/index.js';

const CHUNK_SIZE = 1024 * 1024; // 1MB chunks for streaming

export const streamService = {
  /**
   * Get file stream with range support for HTTP 206 Partial Content
   */
  async getFileStream(
    filePath: string,
    range?: string
  ): Promise<StreamResult> {
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(config.mediaPath, filePath);

    // Check if file exists
    if (!fs.existsSync(absolutePath)) {
      throw new NotFoundError('Media file');
    }

    const stat = fs.statSync(absolutePath);
    const fileSize = stat.size;
    const mimeType = this.getMimeType(absolutePath);

    let start = 0;
    let end = fileSize - 1;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const rangeStart = parseInt(parts[0], 10);
      const rangeEnd = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (isNaN(rangeStart) || rangeStart < 0 || rangeStart >= fileSize) {
        throw new BadRequestError('Invalid range start');
      }

      if (isNaN(rangeEnd) || rangeEnd < rangeStart || rangeEnd >= fileSize) {
        end = Math.min(rangeStart + CHUNK_SIZE - 1, fileSize - 1);
      } else {
        end = Math.min(rangeEnd, fileSize - 1);
      }

      start = rangeStart;
    }

    const contentLength = end - start + 1;

    const stream = fs.createReadStream(absolutePath, { start, end });

    return {
      stream,
      start,
      end,
      size: fileSize,
      contentLength,
      mimeType,
    };
  },

  /**
   * Get thumbnail file stream
   */
  async getThumbnailStream(
    thumbnailPath: string
  ): Promise<{ stream: NodeJS.ReadableStream; mimeType: string; size: number }> {
    const absolutePath = path.isAbsolute(thumbnailPath)
      ? thumbnailPath
      : path.join(config.mediaPath, thumbnailPath);

    if (!fs.existsSync(absolutePath)) {
      throw new NotFoundError('Thumbnail');
    }

    const stat = fs.statSync(absolutePath);
    const mimeType = this.getMimeType(absolutePath);
    const stream = fs.createReadStream(absolutePath);

    return {
      stream,
      mimeType,
      size: stat.size,
    };
  },

  /**
   * Check if file exists
   */
  fileExists(filePath: string): boolean {
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(config.mediaPath, filePath);

    return fs.existsSync(absolutePath);
  },

  /**
   * Get file size
   */
  getFileSize(filePath: string): number {
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(config.mediaPath, filePath);

    if (!fs.existsSync(absolutePath)) {
      throw new NotFoundError('File');
    }

    return fs.statSync(absolutePath).size;
  },

  /**
   * Get MIME type from file extension
   */
  getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      // Audio
      '.mp3': 'audio/mpeg',
      '.m4a': 'audio/mp4',
      '.aac': 'audio/aac',
      '.ogg': 'audio/ogg',
      '.opus': 'audio/opus',
      '.wav': 'audio/wav',
      '.flac': 'audio/flac',
      '.webm': 'audio/webm',
      // Video
      '.mp4': 'video/mp4',
      '.mkv': 'video/x-matroska',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime',
      // Images (for thumbnails)
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
    };

    return mimeTypes[ext] ?? 'application/octet-stream';
  },

  /**
   * Parse range header
   */
  parseRange(
    range: string,
    fileSize: number
  ): { start: number; end: number } | null {
    const match = /bytes=(\d*)-(\d*)/.exec(range);
    if (!match) {
      return null;
    }

    const start = match[1] ? parseInt(match[1], 10) : 0;
    const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;

    if (start >= fileSize || end >= fileSize || start > end) {
      return null;
    }

    return { start, end };
  },

  /**
   * Create Content-Range header value
   */
  getContentRangeHeader(start: number, end: number, total: number): string {
    return `bytes ${start}-${end}/${total}`;
  },
};
