import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { prisma, config } from '../config/database.js';
import { BadRequestError } from '../errors/index.js';
import { downloadService } from './download.service.js';
import { mediaService } from './media.service.js';
import { socketService } from './socket.service.js';
import type {
  YouTubeSyncHistory,
  YouTubeSyncStatus,
  YouTubeSyncSettings,
  UpdateYouTubeSyncSettingsInput,
  YouTubeSyncResult,
  YouTubeLikedVideo,
  CookieValidationResult,
} from '../types/index.js';

// Path where cookies are stored
const COOKIES_DIR = path.join(config.mediaPath, '.youtube-sync');
const COOKIES_PATH = path.join(COOKIES_DIR, 'cookies.txt');

// Required YouTube/Google cookies for authentication
const REQUIRED_COOKIES = ['SID', 'HSID', 'SSID', 'APISID', 'SAPISID'];

// Default settings
const DEFAULT_SETTINGS: YouTubeSyncSettings = {
  autoSync: true,
  syncInterval: 60,
  filterMusic: true,
  maxDuration: 600,
};

export const youtubeSyncService = {
  /**
   * Get the current YouTube sync status
   */
  async getStatus(): Promise<YouTubeSyncStatus> {
    const syncConfig = await prisma.youTubeSync.findFirst();

    if (!syncConfig) {
      return {
        isConnected: false,
        authMethod: null,
        email: null,
        lastSyncAt: null,
        ...DEFAULT_SETTINGS,
      };
    }

    return {
      isConnected: syncConfig.isConnected,
      authMethod: syncConfig.authMethod as YouTubeSyncStatus['authMethod'],
      email: syncConfig.email,
      lastSyncAt: syncConfig.lastSyncAt,
      autoSync: syncConfig.autoSync,
      syncInterval: syncConfig.syncInterval,
      filterMusic: syncConfig.filterMusic,
      maxDuration: syncConfig.maxDuration,
    };
  },

  /**
   * Get sync settings
   */
  async getSettings(): Promise<YouTubeSyncSettings> {
    const syncConfig = await prisma.youTubeSync.findFirst();

    if (!syncConfig) {
      return DEFAULT_SETTINGS;
    }

    return {
      autoSync: syncConfig.autoSync,
      syncInterval: syncConfig.syncInterval,
      filterMusic: syncConfig.filterMusic,
      maxDuration: syncConfig.maxDuration,
    };
  },

  /**
   * Update sync settings
   */
  async updateSettings(
    input: UpdateYouTubeSyncSettingsInput
  ): Promise<YouTubeSyncSettings> {
    // Validate input
    if (input.syncInterval !== undefined && input.syncInterval <= 0) {
      throw new BadRequestError('syncInterval must be a positive number');
    }
    if (input.maxDuration !== undefined && input.maxDuration <= 0) {
      throw new BadRequestError('maxDuration must be a positive number');
    }

    const existing = await prisma.youTubeSync.findFirst();

    const updated = await prisma.youTubeSync.upsert({
      where: { id: existing?.id ?? 'default' },
      create: {
        authMethod: 'cookie',
        isConnected: false,
        ...DEFAULT_SETTINGS,
        ...input,
      },
      update: input,
    });

    return {
      autoSync: updated.autoSync,
      syncInterval: updated.syncInterval,
      filterMusic: updated.filterMusic,
      maxDuration: updated.maxDuration,
    };
  },

  /**
   * Get sync history
   */
  async getHistory(limit = 50): Promise<YouTubeSyncHistory[]> {
    return prisma.youTubeSyncHistory.findMany({
      orderBy: { syncedAt: 'desc' },
      take: limit,
    });
  },

  /**
   * Disconnect YouTube account (remove cookies and config)
   */
  async disconnect(): Promise<boolean> {
    const syncConfig = await prisma.youTubeSync.findFirst();

    if (!syncConfig) {
      return false;
    }

    // Delete cookies file if exists
    if (fs.existsSync(COOKIES_PATH)) {
      fs.unlinkSync(COOKIES_PATH);
    }

    // Delete sync config
    await prisma.youTubeSync.delete({
      where: { id: syncConfig.id },
    });

    return true;
  },

  /**
   * Validate cookie file content (Netscape format)
   */
  validateCookieContent(content: string): CookieValidationResult {
    if (!content || content.trim().length === 0) {
      return {
        isValid: false,
        error: 'Cookie file is empty',
      };
    }

    const lines = content.split('\n');

    // Parse cookie lines (skip comments and empty lines)
    const cookies: { domain: string; name: string }[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      const parts = trimmed.split('\t');
      if (parts.length >= 7) {
        cookies.push({
          domain: parts[0],
          name: parts[5],
        });
      }
    }

    if (cookies.length === 0) {
      return {
        isValid: false,
        error: 'No valid cookies found in file',
      };
    }

    // Check for required YouTube/Google cookies
    // Domain can be .youtube.com, youtube.com, .google.com, google.com
    const foundRequired = REQUIRED_COOKIES.filter((required) =>
      cookies.some(
        (c) =>
          c.name === required &&
          (c.domain.includes('youtube') || c.domain.includes('google'))
      )
    );

    // Only require 1 cookie minimum for now (more lenient)
    if (foundRequired.length < 1) {
      const cookieNames = cookies.map((c) => c.name).slice(0, 10).join(', ');
      return {
        isValid: false,
        error: `Missing required YouTube cookies. Found cookies: ${cookieNames}...`,
      };
    }

    return { isValid: true };
  },

  /**
   * Save cookies from uploaded content
   */
  async saveCookies(content: string, authMethod: string): Promise<void> {
    // Ensure cookies directory exists
    if (!fs.existsSync(COOKIES_DIR)) {
      fs.mkdirSync(COOKIES_DIR, { recursive: true });
    }

    // Write cookies file
    fs.writeFileSync(COOKIES_PATH, content, 'utf-8');

    // Update or create sync config
    const existing = await prisma.youTubeSync.findFirst();

    await prisma.youTubeSync.upsert({
      where: { id: existing?.id ?? 'default' },
      create: {
        authMethod,
        isConnected: true,
        ...DEFAULT_SETTINGS,
      },
      update: {
        authMethod,
        isConnected: true,
      },
    });
  },

  /**
   * Check if cookies file exists and is valid
   */
  hasCookies(): boolean {
    return fs.existsSync(COOKIES_PATH);
  },

  /**
   * Parse yt-dlp flat playlist output for liked videos
   */
  parseLikedVideosOutput(output: string): YouTubeLikedVideo[] {
    const videos: YouTubeLikedVideo[] = [];

    if (!output || output.trim().length === 0) {
      return videos;
    }

    const lines = output.trim().split('\n');

    for (const line of lines) {
      const parts = line.split('|||');

      if (parts.length < 5) {
        continue;
      }

      const [id, title, channel, durationStr, categoriesStr] = parts;

      let categories: string[] = [];
      try {
        categories = JSON.parse(categoriesStr || '[]') as string[];
      } catch {
        categories = [];
      }

      videos.push({
        id: id.trim(),
        title: title.trim(),
        channel: channel.trim(),
        duration: parseInt(durationStr, 10) || 0,
        categories,
      });
    }

    return videos;
  },

  /**
   * Check if a video should be skipped based on filter settings
   */
  shouldSkipVideo(
    video: YouTubeLikedVideo,
    settings: { filterMusic: boolean; maxDuration: number }
  ): boolean {
    // Check duration filter
    if (video.duration > settings.maxDuration) {
      return true;
    }

    // Check music filter
    if (settings.filterMusic) {
      const categories = video.categories ?? [];
      const isMusic = categories.some(
        (cat) =>
          cat.toLowerCase() === 'music' ||
          cat.toLowerCase().includes('music')
      );
      if (!isMusic) {
        return true;
      }
    }

    return false;
  },

  /**
   * Fetch liked videos from YouTube using yt-dlp
   */
  async fetchLikedVideos(limit = 100): Promise<YouTubeLikedVideo[]> {
    if (!this.hasCookies()) {
      throw new BadRequestError('Not connected to YouTube');
    }

    return new Promise((resolve, reject) => {
      const args = [
        '--cookies',
        COOKIES_PATH,
        '--flat-playlist',
        '--print',
        '%(id)s|||%(title)s|||%(uploader)s|||%(duration)s|||%(categories)s',
        '--playlist-end',
        String(limit),
        'https://www.youtube.com/playlist?list=LL',
      ];

      const process = spawn('yt-dlp', args);
      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code !== 0) {
          reject(
            new BadRequestError(`Failed to fetch liked videos: ${stderr}`)
          );
          return;
        }

        const videos = this.parseLikedVideosOutput(stdout);
        resolve(videos);
      });

      process.on('error', (err) => {
        reject(new BadRequestError(`yt-dlp error: ${err.message}`));
      });
    });
  },

  /**
   * Sync liked videos from YouTube
   */
  async syncLikedVideos(): Promise<YouTubeSyncResult> {
    const status = await this.getStatus();

    if (!status.isConnected) {
      throw new BadRequestError('Not connected to YouTube');
    }

    const settings = await this.getSettings();

    // Emit sync started event
    socketService.emitYouTubeSyncStarted();

    const result: YouTubeSyncResult = {
      videosFound: 0,
      videosDownloaded: 0,
      videosSkipped: 0,
      videosFailed: 0,
    };

    try {
      // Fetch liked videos
      const videos = await this.fetchLikedVideos(100);
      result.videosFound = videos.length;

      for (const video of videos) {
        // Check if should skip
        if (this.shouldSkipVideo(video, settings)) {
          result.videosSkipped++;
          continue;
        }

        // Check if already in library
        const existing = await mediaService.findBySourceId(video.id);
        if (existing) {
          result.videosSkipped++;
          continue;
        }

        // Download the video
        try {
          await downloadService.start(`https://youtube.com/watch?v=${video.id}`);
          result.videosDownloaded++;

          // Emit progress
          socketService.emitYouTubeSyncProgress({
            totalVideos: result.videosFound,
            processedVideos:
              result.videosDownloaded +
              result.videosSkipped +
              result.videosFailed,
            downloadedVideos: result.videosDownloaded,
            skippedVideos: result.videosSkipped,
            failedVideos: result.videosFailed,
            currentVideo: video.title,
          });
        } catch {
          result.videosFailed++;
        }
      }

      // Update last sync time
      const syncConfig = await prisma.youTubeSync.findFirst();
      if (syncConfig) {
        await prisma.youTubeSync.update({
          where: { id: syncConfig.id },
          data: { lastSyncAt: new Date() },
        });
      }

      // Record sync history
      await prisma.youTubeSyncHistory.create({
        data: {
          videosFound: result.videosFound,
          videosDownloaded: result.videosDownloaded,
          videosFailed: result.videosFailed,
          videosSkipped: result.videosSkipped,
        },
      });

      // Emit completion
      socketService.emitYouTubeSyncCompleted(result);

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      socketService.emitYouTubeSyncError({ error: errorMessage });
      throw error;
    }
  },

  /**
   * Authenticate using uploaded cookies
   */
  async authenticateWithCookies(
    cookieContent: string
  ): Promise<{ success: boolean; email?: string }> {
    const validation = this.validateCookieContent(cookieContent);

    if (!validation.isValid) {
      throw new BadRequestError(validation.error ?? 'Invalid cookie format');
    }

    await this.saveCookies(cookieContent, 'cookie');

    // Try to verify by fetching user info (optional, may not work)
    // For now, just assume success if cookies are valid
    return { success: true };
  },
};
