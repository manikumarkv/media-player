import fs from 'fs/promises';
import path from 'path';
import { prisma } from '../config/database.js';
import { NotFoundError, BadRequestError } from '../errors/index.js';
import { youtubeService, type PlaylistInfo } from './youtube.service.js';
import { mediaService } from './media.service.js';
import { playlistService } from './playlist.service.js';
import { socketService } from './socket.service.js';
import { downloadQueueService } from './download-queue.service.js';
import type { Download, DownloadStatus } from '../types/index.js';

export interface PlaylistDownloadOptions {
  videoIds?: string[];
  createPlaylist?: boolean;
  playlistName?: string;
}

export interface PlaylistDownloadResult {
  playlistId: string;
  playlistTitle: string;
  totalVideos: number;
  skipped: number;
  downloads: Download[];
  createdPlaylistId?: string;
}

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
    console.log('[downloadService.start] Starting download for:', url);

    if (!youtubeService.isValidUrl(url)) {
      console.log('[downloadService.start] Invalid URL');
      throw new BadRequestError('Invalid YouTube URL');
    }

    // Check if already downloaded
    const videoId = youtubeService.extractVideoId(url);
    console.log('[downloadService.start] Video ID:', videoId);

    if (videoId) {
      const existing = await mediaService.findBySourceId(videoId);
      if (existing) {
        console.log('[downloadService.start] Already downloaded');
        throw new BadRequestError('This video has already been downloaded');
      }
    }

    // Get video info first
    console.log('[downloadService.start] Getting video info...');
    const info = await youtubeService.getVideoInfo(url);
    console.log('[downloadService.start] Got video info:', info.title);

    // Create download record
    const download = await prisma.download.create({
      data: {
        url,
        title: info.title,
        status: 'PENDING',
        progress: 0,
      },
    });

    // Emit started event
    socketService.emitDownloadStarted(download.id, info.title);

    // Queue the download with auto-retry
    void downloadQueueService.enqueueWithRetry(
      download.id,
      () =>
        this.executeDownload(download.id, url, {
          id: info.id,
          title: info.title,
          duration: info.duration,
          artist: info.artist,
          album: info.album,
          releaseYear: info.releaseYear,
          channel: info.channel,
        }),
      {
        maxAttempts: 3,
        baseDelayMs: 5000, // 5s -> 15s -> 45s
        onRetry: ({ attempt, maxAttempts, delayMs, error }) => {
          socketService.emitDownloadRetrying({
            downloadId: download.id,
            attempt,
            maxAttempts,
            delayMs,
            error: error.message,
          });
        },
      }
    ).catch((error: unknown) => {
      // Final failure after all retries exhausted
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      void prisma.download.update({
        where: { id: download.id },
        data: { status: 'FAILED', error: errorMessage },
      });
      socketService.emitDownloadError(download.id, errorMessage);
    });

    return download;
  },

  /**
   * Execute a download - this method throws on error for retry support
   * Used by the queue system with auto-retry
   */
  async executeDownload(
    downloadId: string,
    url: string,
    info: {
      id: string;
      title: string;
      duration: number;
      artist?: string | null;
      album?: string | null;
      releaseYear?: number | null;
      channel?: string;
    },
    playlistId?: string
  ): Promise<void> {
    // Update status to downloading
    await this.updateStatus(downloadId, 'DOWNLOADING');

    // Download audio
    const result = await youtubeService.downloadAudio(url, downloadId, {}, (progress) => {
      void this.updateProgress(downloadId, Math.round(progress.percent));
      socketService.emitDownloadProgress({
        downloadId,
        progress: progress.percent,
        speed: progress.speed,
        eta: progress.eta,
      });
    });

      // Update status to processing
      await this.updateStatus(downloadId, 'PROCESSING');
      await this.updateProgress(downloadId, 95);

      // Get file size
      const fileStats = await fs.stat(result.filePath);
      const fileSize = fileStats.size;

      // Detect mimeType based on file extension
      const ext = path.extname(result.filePath).toLowerCase();
      const mimeTypeMap: Record<string, string> = {
        '.opus': 'audio/opus',
        '.webm': 'audio/webm',
        '.m4a': 'audio/mp4',
        '.mp3': 'audio/mpeg',
        '.ogg': 'audio/ogg',
      };
      const mimeType = mimeTypeMap[ext] || 'audio/webm';

      // Create media entry with rich metadata
      // Artist fallback: extracted artist > channel name
      const artist = info.artist ?? info.channel ?? undefined;

      // Debug: Log metadata before creating media
      console.log('[download.service] Creating media with metadata:', {
        title: info.title,
        artist,
        album: info.album,
        year: info.releaseYear,
        infoArtist: info.artist,
        infoChannel: info.channel,
      });

      const media = await mediaService.create({
        title: info.title,
        artist,
        album: info.album ?? undefined,
        year: info.releaseYear ?? undefined,
        duration: info.duration,
        filePath: result.filePath,
        thumbnailPath: result.thumbnailPath,
        sourceUrl: url,
        sourceId: info.id,
        mimeType,
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

      // Add to playlist if specified
      if (playlistId) {
        await playlistService.addItem(playlistId, media.id);
      }

    // Emit completion event
    socketService.emitDownloadCompleted(downloadId, media.id);
    socketService.emitMediaAdded(media.id);
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

    // Get video info and restart with rich metadata
    const info = await youtubeService.getVideoInfo(download.url);

    socketService.emitDownloadStarted(id, info.title);

    // Queue the download with auto-retry
    void downloadQueueService.enqueueWithRetry(
      id,
      () =>
        this.executeDownload(id, download.url, {
          id: info.id,
          title: info.title,
          duration: info.duration,
          artist: info.artist,
          album: info.album,
          releaseYear: info.releaseYear,
          channel: info.channel,
        }),
      {
        maxAttempts: 3,
        baseDelayMs: 5000,
        onRetry: ({ attempt, maxAttempts, delayMs, error }) => {
          socketService.emitDownloadRetrying({
            downloadId: id,
            attempt,
            maxAttempts,
            delayMs,
            error: error.message,
          });
        },
      }
    ).catch((error: unknown) => {
      // Final failure after all retries exhausted
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      void prisma.download.update({
        where: { id },
        data: { status: 'FAILED', error: errorMessage },
      });
      socketService.emitDownloadError(id, errorMessage);
    });

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

  /**
   * Get playlist info without downloading
   */
  async getPlaylistInfo(url: string): Promise<PlaylistInfo> {
    if (!youtubeService.isValidPlaylistUrl(url)) {
      throw new BadRequestError('Invalid YouTube playlist URL');
    }

    return youtubeService.getPlaylistInfo(url);
  },

  /**
   * Start downloading videos from a playlist
   * @param url - The YouTube playlist URL
   * @param options - Optional parameters for selective download and playlist creation
   * @param options.videoIds - If provided, only download these specific video IDs
   * @param options.createPlaylist - If true, create a playlist in the app with downloaded songs
   * @param options.playlistName - Custom name for the created playlist (defaults to YouTube playlist title)
   */
  async startPlaylist(
    url: string,
    options?: PlaylistDownloadOptions
  ): Promise<PlaylistDownloadResult> {
    if (!youtubeService.isValidPlaylistUrl(url)) {
      throw new BadRequestError('Invalid YouTube playlist URL');
    }

    // Get playlist info
    const playlistInfo = await youtubeService.getPlaylistInfo(url);

    const downloads: Download[] = [];
    let skipped = 0;

    // Create playlist FIRST if requested (so we can add items as they complete)
    let createdPlaylistId: string | undefined;
    if (options?.createPlaylist) {
      const playlistName = options.playlistName ?? playlistInfo.title;
      const playlist = await prisma.playlist.create({
        data: {
          name: playlistName,
          description: `Downloaded from YouTube playlist: ${playlistInfo.title}`,
          isSystem: false,
        },
      });
      createdPlaylistId = playlist.id;
    }

    // Filter videos if videoIds are specified
    const videosToDownload = options?.videoIds
      ? playlistInfo.videos.filter((video) => options.videoIds?.includes(video.id))
      : playlistInfo.videos;

    // Process each video in the playlist
    for (const video of videosToDownload) {
      // Check if already downloaded
      const existing = await mediaService.findBySourceId(video.id);
      if (existing) {
        skipped++;
        // If already downloaded and we have a playlist, add existing media to it
        if (createdPlaylistId) {
          await playlistService.addItem(createdPlaylistId, existing.id);
        }
        continue;
      }

      // Create download record
      const videoUrl = `https://www.youtube.com/watch?v=${video.id}`;
      const download = await prisma.download.create({
        data: {
          url: videoUrl,
          title: video.title,
          status: 'PENDING',
          progress: 0,
        },
      });

      downloads.push(download);

      // Emit started event (before queuing so UI knows it's pending)
      socketService.emitDownloadStarted(download.id, video.title);

      // Queue the download with auto-retry
      // This ensures only 2 concurrent downloads at a time (default concurrency)
      void downloadQueueService.enqueueWithRetry(
        download.id,
        async () => {
          // Get full video info for rich metadata (artist, album, year)
          let info: {
            id: string;
            title: string;
            duration: number;
            artist?: string | null;
            album?: string | null;
            releaseYear?: number | null;
            channel?: string;
          };

          try {
            const videoInfo = await youtubeService.getVideoInfo(videoUrl);
            info = {
              id: videoInfo.id,
              title: videoInfo.title,
              duration: videoInfo.duration,
              artist: videoInfo.artist,
              album: videoInfo.album,
              releaseYear: videoInfo.releaseYear,
              channel: videoInfo.channel,
            };
          } catch {
            // Fall back to basic info if metadata fetch fails
            info = {
              id: video.id,
              title: video.title,
              duration: video.duration,
            };
          }

          await this.executeDownload(download.id, videoUrl, info, createdPlaylistId);
        },
        {
          maxAttempts: 3,
          baseDelayMs: 5000, // 5s -> 15s -> 45s
          onRetry: ({ attempt, maxAttempts, delayMs, error }) => {
            socketService.emitDownloadRetrying({
              downloadId: download.id,
              attempt,
              maxAttempts,
              delayMs,
              error: error.message,
            });
          },
        }
      ).catch((error: unknown) => {
        // Final failure after all retries exhausted
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        void prisma.download.update({
          where: { id: download.id },
          data: { status: 'FAILED', error: errorMessage },
        });
        socketService.emitDownloadError(download.id, errorMessage);
      });
    }

    return {
      playlistId: playlistInfo.id,
      playlistTitle: playlistInfo.title,
      totalVideos: playlistInfo.videoCount,
      skipped,
      downloads,
      createdPlaylistId,
    };
  },
};
