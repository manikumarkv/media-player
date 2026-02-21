import { spawn, type ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { config } from '../config/database.js';
import { BadRequestError } from '../errors/index.js';

// Dynamic yt-dlp path - can be overridden for Electron bundled binary
let ytDlpPath = process.env.YT_DLP_PATH ?? 'yt-dlp';

/**
 * Set the path to yt-dlp binary
 * Used by Electron to point to bundled binary
 */
export function setYtDlpPath(newPath: string): void {
  ytDlpPath = newPath;
  console.log(`yt-dlp path set to: ${ytDlpPath}`);
}

/**
 * Get the current yt-dlp path
 */
export function getYtDlpPath(): string {
  return ytDlpPath;
}

export interface VideoInfo {
  id: string;
  title: string;
  duration: number;
  thumbnail: string;
  channel: string;
  uploadDate: string;
  description: string;
  // Rich metadata from YouTube Music
  artist: string | null;
  album: string | null;
  releaseYear: number | null;
}

/**
 * Parse release year from yt-dlp metadata fields
 * Priority: release_year > release_date > upload_date
 */
export function parseReleaseYear(
  releaseYear: string | number | null | undefined,
  releaseDate: string | null | undefined,
  uploadDate: string | null | undefined
): number | null {
  // Try release_year first (can be number or string)
  if (releaseYear !== null && releaseYear !== undefined && releaseYear !== '') {
    const year = typeof releaseYear === 'number' ? releaseYear : parseInt(releaseYear, 10);
    if (!isNaN(year) && year > 1900 && year < 2100) {
      return year;
    }
  }

  // Try release_date (YYYYMMDD format)
  if (releaseDate && typeof releaseDate === 'string' && releaseDate.length >= 4) {
    const year = parseInt(releaseDate.substring(0, 4), 10);
    if (!isNaN(year) && year > 1900 && year < 2100) {
      return year;
    }
  }

  // Fall back to upload_date (YYYYMMDD format)
  if (uploadDate && typeof uploadDate === 'string' && uploadDate.length >= 4) {
    const year = parseInt(uploadDate.substring(0, 4), 10);
    if (!isNaN(year) && year > 1900 && year < 2100) {
      return year;
    }
  }

  return null;
}

export interface PlaylistVideoInfo {
  id: string;
  title: string;
  duration: number;
  thumbnail: string;
}

export interface PlaylistInfo {
  id: string;
  title: string;
  channel: string;
  videoCount: number;
  videos: PlaylistVideoInfo[];
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
      const args = ['--force-ipv4', '--dump-json', '--no-playlist', '--js-runtimes', 'node', url];

      const process = spawn(ytDlpPath, args);
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
            // YouTube Music metadata fields
            artist?: string;
            creator?: string;
            album?: string;
            release_year?: string | number;
            release_date?: string;
          };

          // Extract artist: prefer 'artist' field, fall back to 'creator', then 'channel'
          const artist = info.artist ?? info.creator ?? null;

          // Extract album (only available on YouTube Music)
          const album = info.album ?? null;

          // Extract release year with fallback chain
          const releaseYear = parseReleaseYear(
            info.release_year,
            info.release_date,
            info.upload_date
          );

          // Debug: Log extracted metadata
          console.log('[youtube.service] Extracted metadata:', {
            title: info.title,
            artist,
            album,
            releaseYear,
            rawArtist: info.artist,
            rawCreator: info.creator,
            rawAlbum: info.album,
            rawReleaseYear: info.release_year,
          });

          resolve({
            id: info.id,
            title: info.title,
            duration: info.duration,
            thumbnail: info.thumbnail,
            channel: info.channel,
            uploadDate: info.upload_date,
            description: info.description,
            artist,
            album,
            releaseYear,
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
    await fs.mkdir(outputDir, { recursive: true });

    // Sanitize filename
    const sanitizedTitle = info.title
      .replace(/[<>:"/\\|?*]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 200);

    const outputTemplate = path.join(outputDir, `${sanitizedTitle}.%(ext)s`);

    // Download best audio format directly without ffmpeg conversion
    // This works in standalone Electron without requiring ffmpeg
    const args = [
      '--force-ipv4', // Force IPv4 to avoid IPv6 issues in Docker containers
      '--js-runtimes',
      'node', // Use Node.js for YouTube JS extraction
      '--no-playlist', // Only download single video, not playlist
      '-f',
      'bestaudio', // Download best audio stream directly (no ffmpeg needed)
      '--embed-metadata',
      '--write-thumbnail',
      '--output',
      outputTemplate,
      '--newline',
      '--progress',
      url,
    ];

    return new Promise((resolve, reject) => {
      const process = spawn(ytDlpPath, args);
      activeDownloads.set(downloadId, process);

      let stderrData = '';

      const parseProgress = (line: string): void => {
        // Parse progress from yt-dlp output
        // Format: [download]   0.0% of    3.27MiB at  542.04KiB/s ETA 00:06
        const progressMatch =
          /\[download\]\s+([\d.]+)%\s+of\s+~?\s*([\d.]+\s*\w+)\s+at\s+([\d.]+\s*\w+\/s)\s+ETA\s+([\d:]+)/.exec(
            line
          );
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

        // Find the actual output file (could be opus, webm, m4a depending on source)
        void (async () => {
          try {
            const files = await fs.readdir(outputDir);
            const audioExtensions = ['.opus', '.webm', '.m4a', '.ogg', '.mp3'];
            const audioFile = files.find(
              (f) => f.startsWith(sanitizedTitle) && audioExtensions.some((ext) => f.endsWith(ext))
            );

            if (!audioFile) {
              reject(new BadRequestError('Output file not found'));
              return;
            }

            const filePath = path.join(outputDir, audioFile);
            // Thumbnail could be webp or jpg depending on source
            const thumbnailFile = files.find(
              (f) => f.startsWith(sanitizedTitle) && (f.endsWith('.webp') || f.endsWith('.jpg'))
            );
            const actualThumbnailPath = thumbnailFile ? path.join(outputDir, thumbnailFile) : undefined;

            resolve({
              filePath,
              thumbnailPath: actualThumbnailPath,
              info,
            });
          } catch (err) {
            reject(new BadRequestError(`Failed to find output file: ${err instanceof Error ? err.message : 'Unknown error'}`));
          }
        })();
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
      const process = spawn(ytDlpPath, ['--version']);

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
    const patterns = [/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]+)/];

    for (const pattern of patterns) {
      const match = pattern.exec(url);
      if (match) {
        return match[1];
      }
    }

    return null;
  },

  /**
   * Validate YouTube playlist URL
   */
  isValidPlaylistUrl(url: string): boolean {
    // Matches playlist URLs or video URLs with list parameter (including music.youtube.com)
    const patterns = [
      /^(https?:\/\/)?(www\.)?youtube\.com\/playlist\?list=[\w-]+/,
      /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?.*list=[\w-]+/,
      /^(https?:\/\/)?music\.youtube\.com\/playlist\?list=[\w-]+/,
      /^(https?:\/\/)?music\.youtube\.com\/watch\?.*list=[\w-]+/,
    ];

    return patterns.some((pattern) => pattern.test(url));
  },

  /**
   * Extract playlist ID from URL
   */
  extractPlaylistId(url: string): string | null {
    const pattern = /[?&]list=([\w-]+)/;
    const match = pattern.exec(url);
    return match ? match[1] : null;
  },

  /**
   * Normalize YouTube URL - converts music.youtube.com to www.youtube.com
   * This is needed because yt-dlp doesn't directly support music.youtube.com
   */
  normalizeUrl(url: string): string {
    return url.replace(/music\.youtube\.com/, 'www.youtube.com');
  },

  /**
   * Get playlist info including all video metadata
   */
  async getPlaylistInfo(url: string): Promise<PlaylistInfo> {
    // Normalize URL (convert music.youtube.com to www.youtube.com)
    const normalizedUrl = this.normalizeUrl(url);

    return new Promise((resolve, reject) => {
      const args = [
        '--force-ipv4',
        '--dump-json',
        '--flat-playlist',
        '--js-runtimes',
        'node',
        normalizedUrl,
      ];

      const process = spawn(ytDlpPath, args);
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
          reject(new BadRequestError(`Failed to get playlist info: ${stderr}`));
          return;
        }

        try {
          // yt-dlp outputs one JSON object per line for flat-playlist
          const lines = stdout
            .trim()
            .split('\n')
            .filter((line) => line.trim());

          if (lines.length === 0) {
            reject(new BadRequestError('Playlist is empty or not found'));
            return;
          }

          // First line contains playlist metadata
          const firstEntry = JSON.parse(lines[0]) as {
            id: string;
            title: string;
            channel?: string;
            uploader?: string;
            duration?: number;
            thumbnail?: string;
            playlist_title?: string;
            playlist_id?: string;
            playlist_uploader?: string;
          };

          // Parse all videos
          const videos: PlaylistVideoInfo[] = lines.map((line) => {
            const entry = JSON.parse(line) as {
              id: string;
              title: string;
              duration?: number;
              thumbnail?: string;
            };
            return {
              id: entry.id,
              title: entry.title || 'Unknown Title',
              duration: entry.duration ?? 0,
              thumbnail: entry.thumbnail ?? '',
            };
          });

          resolve({
            id: firstEntry.playlist_id ?? this.extractPlaylistId(url) ?? '',
            title: firstEntry.playlist_title ?? 'Unknown Playlist',
            channel:
              firstEntry.playlist_uploader ??
              firstEntry.channel ??
              firstEntry.uploader ??
              'Unknown',
            videoCount: videos.length,
            videos,
          });
        } catch {
          reject(new BadRequestError('Failed to parse playlist info'));
        }
      });

      process.on('error', (err) => {
        reject(new BadRequestError(`yt-dlp not found: ${err.message}`));
      });
    });
  },
};
