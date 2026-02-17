import { spawn, type ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import { config } from '../config/database.js';
import { BadRequestError } from '../errors/index.js';

export interface VideoInfo {
  id: string;
  title: string;
  duration: number;
  thumbnail: string;
  channel: string;
  uploadDate: string;
  description: string;
}

export interface DownloadOptions {
  format?: 'audio' | 'video';
  quality?: string;
  outputPath?: string;
}

export interface DownloadProgress {
  percent: number;
  downloaded: string;
  total: string;
  speed: string;
  eta: string;
}

type ProgressCallback = (progress: DownloadProgress) => void;

// Map to track active downloads for cancellation
const activeDownloads = new Map<string, ChildProcess>();

export const youtubeService = {
  /**
   * Extract video info without downloading
   */
  async getVideoInfo(url: string): Promise<VideoInfo> {
    return new Promise((resolve, reject) => {
      const args = [
        '--dump-json',
        '--no-playlist',
        '--js-runtimes', 'node',
        url,
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
          reject(new BadRequestError(`Failed to get video info: ${stderr}`));
          return;
        }

        try {
          const info = JSON.parse(stdout) as {
            id: string;
            title: string;
            duration: number;
            thumbnail: string;
            channel: string;
            upload_date: string;
            description: string;
          };
          resolve({
            id: info.id,
            title: info.title,
            duration: info.duration,
            thumbnail: info.thumbnail,
            channel: info.channel,
            uploadDate: info.upload_date,
            description: info.description,
          });
        } catch {
          reject(new BadRequestError('Failed to parse video info'));
        }
      });

      process.on('error', (err) => {
        reject(new BadRequestError(`yt-dlp not found: ${err.message}`));
      });
    });
  },

  /**
   * Download audio from YouTube
   */
  async downloadAudio(
    url: string,
    downloadId: string,
    options: DownloadOptions = {},
    onProgress?: ProgressCallback
  ): Promise<{ filePath: string; thumbnailPath?: string; info: VideoInfo }> {
    const info = await this.getVideoInfo(url);
    const outputDir = options.outputPath ?? config.mediaPath;

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Sanitize filename
    const sanitizedTitle = info.title
      .replace(/[<>:"/\\|?*]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 200);

    const outputTemplate = path.join(outputDir, `${sanitizedTitle}.%(ext)s`);
    const thumbnailPath = path.join(outputDir, `${sanitizedTitle}.jpg`);

    // Use opus format (YouTube's native audio) to avoid quality loss from transcoding
    // opus provides better quality at lower bitrates than mp3
    const args = [
      '--js-runtimes', 'node',            // Use Node.js for YouTube JS extraction
      '--no-playlist',                    // Only download single video, not playlist
      '-x',                               // Extract audio (implies -f bestaudio)
      '--audio-format', 'opus',           // Keep as opus (YouTube's native format) - no transcoding loss
      '--embed-metadata',
      '--write-thumbnail',
      '--convert-thumbnails', 'jpg',
      '--output', outputTemplate,
      '--newline',
      '--progress',
      url,
    ];

    return new Promise((resolve, reject) => {
      const process = spawn('yt-dlp', args);
      activeDownloads.set(downloadId, process);

      let stderrData = '';

      const parseProgress = (line: string) => {
        // Parse progress from yt-dlp output
        // Format: [download]   0.0% of    3.27MiB at  542.04KiB/s ETA 00:06
        const progressMatch = /\[download\]\s+([\d.]+)%\s+of\s+~?\s*([\d.]+\s*\w+)\s+at\s+([\d.]+\s*\w+\/s)\s+ETA\s+([\d:]+)/.exec(line);
        if (progressMatch && onProgress) {
          onProgress({
            percent: parseFloat(progressMatch[1]),
            downloaded: progressMatch[2].trim(),
            total: progressMatch[2].trim(),
            speed: progressMatch[3].trim(),
            eta: progressMatch[4],
          });
        }
      };

      // yt-dlp outputs progress to both stdout and stderr depending on version
      process.stdout.on('data', (data: Buffer) => {
        const line = data.toString();
        parseProgress(line);
      });

      process.stderr.on('data', (data: Buffer) => {
        const line = data.toString();
        stderrData += line;
        // Also check stderr for progress (yt-dlp often outputs there)
        parseProgress(line);
      });

      process.on('close', (code) => {
        activeDownloads.delete(downloadId);

        if (code !== 0) {
          reject(new BadRequestError(`Download failed: ${stderrData}`));
          return;
        }

        // Find the actual output file (opus format)
        const files = fs.readdirSync(outputDir);
        const audioFile = files.find(
          (f) => f.startsWith(sanitizedTitle) && f.endsWith('.opus')
        );

        if (!audioFile) {
          reject(new BadRequestError('Output file not found'));
          return;
        }

        const filePath = path.join(outputDir, audioFile);
        const actualThumbnailPath = fs.existsSync(thumbnailPath) ? thumbnailPath : undefined;

        resolve({
          filePath,
          thumbnailPath: actualThumbnailPath,
          info,
        });
      });

      process.on('error', (err) => {
        activeDownloads.delete(downloadId);
        reject(new BadRequestError(`yt-dlp error: ${err.message}`));
      });
    });
  },

  /**
   * Cancel an active download
   */
  cancelDownload(downloadId: string): boolean {
    const process = activeDownloads.get(downloadId);
    if (process) {
      process.kill('SIGTERM');
      activeDownloads.delete(downloadId);
      return true;
    }
    return false;
  },

  /**
   * Check if yt-dlp is available
   */
  async isAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      const process = spawn('yt-dlp', ['--version']);

      process.on('close', (code) => {
        resolve(code === 0);
      });

      process.on('error', () => {
        resolve(false);
      });
    });
  },

  /**
   * Validate YouTube URL
   */
  isValidUrl(url: string): boolean {
    const patterns = [
      /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+/,
      /^(https?:\/\/)?youtu\.be\/[\w-]+/,
      /^(https?:\/\/)?(www\.)?youtube\.com\/shorts\/[\w-]+/,
    ];

    return patterns.some((pattern) => pattern.test(url));
  },

  /**
   * Extract video ID from URL
   */
  extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]+)/,
    ];

    for (const pattern of patterns) {
      const match = pattern.exec(url);
      if (match) {
        return match[1];
      }
    }

    return null;
  },
};
