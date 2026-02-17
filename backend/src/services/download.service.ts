import fs from 'fs';
import { prisma } from '../config/database.js';
import { NotFoundError, BadRequestError } from '../errors/index.js';
import { youtubeService } from './youtube.service.js';
import { mediaService } from './media.service.js';
import { socketService } from './socket.service.js';
import { type Download, type DownloadStatus } from '../types/index.js';

export const downloadService = {
  async findAll(): Promise<Download[]> {
    return prisma.download.findMany({
      orderBy: { createdAt: 'desc' },
    });
  },

  async findById(id: string): Promise<Download> {
    const download = await prisma.download.findUnique({
      where: { id },
    });

    if (!download) {
      throw new NotFoundError('Download');
    }

    return download;
  },

  async findPending(): Promise<Download[]> {
    return prisma.download.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
    });
  },

  async findActive(): Promise<Download[]> {
    return prisma.download.findMany({
      where: { status: { in: ['PENDING', 'DOWNLOADING', 'PROCESSING'] } },
      orderBy: { createdAt: 'asc' },
    });
  },

  async getInfo(url: string): Promise<{
    id: string;
    title: string;
    duration: number;
    thumbnail: string;
    channel: string;
  }> {
    if (!youtubeService.isValidUrl(url)) {
      throw new BadRequestError('Invalid YouTube URL');
    }

    const info = await youtubeService.getVideoInfo(url);
    return {
      id: info.id,
      title: info.title,
      duration: info.duration,
      thumbnail: info.thumbnail,
      channel: info.channel,
    };
  },

  async start(url: string): Promise<Download> {
    if (!youtubeService.isValidUrl(url)) {
      throw new BadRequestError('Invalid YouTube URL');
    }

    // Check if already downloaded
    const videoId = youtubeService.extractVideoId(url);
    if (videoId) {
      const existing = await mediaService.findBySourceId(videoId);
      if (existing) {
        throw new BadRequestError('This video has already been downloaded');
      }
    }

    // Get video info first
    const info = await youtubeService.getVideoInfo(url);

    // Create download record
    const download = await prisma.download.create({
      data: {
        url,
        title: info.title,
        status: 'PENDING',
        progress: 0,
      },
    });

    // Start async download process
    void this.processDownload(download.id, url, info);

    // Emit started event
    socketService.emitDownloadStarted(download.id, info.title);

    return download;
  },

  async processDownload(
    downloadId: string,
    url: string,
    info: { id: string; title: string; duration: number }
  ): Promise<void> {
    try {
      // Update status to downloading
      await this.updateStatus(downloadId, 'DOWNLOADING');

      // Download audio
      const result = await youtubeService.downloadAudio(
        url,
        downloadId,
        {},
        (progress) => {
          void this.updateProgress(downloadId, Math.round(progress.percent));
          socketService.emitDownloadProgress({
            downloadId,
            progress: progress.percent,
            speed: progress.speed,
            eta: progress.eta,
          });
        }
      );

      // Update status to processing
      await this.updateStatus(downloadId, 'PROCESSING');
      await this.updateProgress(downloadId, 95);

      // Get file size
      const fileSize = fs.statSync(result.filePath).size;

      // Create media entry
      const media = await mediaService.create({
        title: info.title,
        duration: info.duration,
        filePath: result.filePath,
        thumbnailPath: result.thumbnailPath,
        sourceUrl: url,
        sourceId: info.id,
        mimeType: 'audio/opus',
        fileSize,
      });

      // Update download as completed
      await prisma.download.update({
        where: { id: downloadId },
        data: {
          status: 'COMPLETED',
          progress: 100,
          mediaId: media.id,
        },
      });

      // Emit completion event
      socketService.emitDownloadCompleted(downloadId, media.id);
      socketService.emitMediaAdded(media.id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await prisma.download.update({
        where: { id: downloadId },
        data: {
          status: 'FAILED',
          error: errorMessage,
        },
      });

      socketService.emitDownloadError(downloadId, errorMessage);
    }
  },

  async updateStatus(id: string, status: DownloadStatus): Promise<Download> {
    return prisma.download.update({
      where: { id },
      data: { status },
    });
  },

  async updateProgress(id: string, progress: number): Promise<Download> {
    return prisma.download.update({
      where: { id },
      data: { progress: Math.min(100, Math.max(0, progress)) },
    });
  },

  async cancel(id: string): Promise<Download> {
    const download = await this.findById(id);

    if (download.status === 'COMPLETED') {
      throw new BadRequestError('Cannot cancel completed download');
    }

    if (download.status === 'CANCELLED') {
      throw new BadRequestError('Download already cancelled');
    }

    // Try to kill the process
    youtubeService.cancelDownload(id);

    const updated = await prisma.download.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    socketService.emitDownloadCancelled(id);

    return updated;
  },

  async retry(id: string): Promise<Download> {
    const download = await this.findById(id);

    if (download.status !== 'FAILED' && download.status !== 'CANCELLED') {
      throw new BadRequestError('Can only retry failed or cancelled downloads');
    }

    // Reset and restart
    const updated = await prisma.download.update({
      where: { id },
      data: {
        status: 'PENDING',
        progress: 0,
        error: null,
      },
    });

    // Get video info and restart
    const info = await youtubeService.getVideoInfo(download.url);
    void this.processDownload(id, download.url, {
      id: info.id,
      title: info.title,
      duration: info.duration,
    });

    socketService.emitDownloadStarted(id, info.title);

    return updated;
  },

  async delete(id: string): Promise<void> {
    const download = await this.findById(id);

    // Cancel if active
    if (['PENDING', 'DOWNLOADING', 'PROCESSING'].includes(download.status)) {
      youtubeService.cancelDownload(id);
    }

    await prisma.download.delete({
      where: { id },
    });
  },

  async clearCompleted(): Promise<number> {
    const result = await prisma.download.deleteMany({
      where: { status: 'COMPLETED' },
    });

    return result.count;
  },

  async clearFailed(): Promise<number> {
    const result = await prisma.download.deleteMany({
      where: { status: { in: ['FAILED', 'CANCELLED'] } },
    });

    return result.count;
  },
};
