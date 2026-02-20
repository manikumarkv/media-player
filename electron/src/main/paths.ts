import { app } from 'electron';
import path from 'path';
import fs from 'fs';

/**
 * Get platform-aware paths for the application
 */
export function getAppPaths() {
  const userDataPath = app.getPath('userData');

  const paths = {
    // User data directory
    userData: userDataPath,

    // Database location: ~/Library/Application Support/Music Player/data.db (macOS)
    database: path.join(userDataPath, 'data.db'),

    // Media storage: ~/Library/Application Support/Music Player/media/
    media: path.join(userDataPath, 'media'),

    // Logs: ~/Library/Application Support/Music Player/logs/
    logs: path.join(userDataPath, 'logs'),

    // Temp downloads: ~/Library/Application Support/Music Player/temp/
    temp: path.join(userDataPath, 'temp'),

    // Thumbnails
    thumbnails: path.join(userDataPath, 'thumbnails'),
  };

  return paths;
}

/**
 * Ensure all required directories exist
 */
export function ensureDirectories(): void {
  const paths = getAppPaths();

  for (const dir of [paths.media, paths.logs, paths.temp, paths.thumbnails]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

/**
 * Get the path to the bundled yt-dlp binary
 */
export function getYtDlpPath(): string {
  const platform = process.platform;
  const arch = process.arch;

  // Determine binary name
  let binaryName = 'yt-dlp';
  if (platform === 'win32') {
    binaryName = 'yt-dlp.exe';
  }

  // In development, use resources directory
  // In production, use app.asar.unpacked
  const resourcesPath = app.isPackaged
    ? path.join(process.resourcesPath, 'binaries')
    : path.join(__dirname, '../../resources/binaries', `${platform}-${arch === 'arm64' ? 'arm64' : 'x64'}`);

  const binaryPath = path.join(resourcesPath, binaryName);

  // Check if binary exists
  if (!fs.existsSync(binaryPath)) {
    console.warn(`yt-dlp binary not found at: ${binaryPath}`);
    // Fall back to system yt-dlp
    return 'yt-dlp';
  }

  return binaryPath;
}

/**
 * Get the path to the backend resources
 */
export function getBackendPath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'backend');
  }
  return path.join(__dirname, '../../../backend/dist');
}

/**
 * Get the path to the frontend resources
 */
export function getFrontendPath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'frontend');
  }
  return path.join(__dirname, '../../../frontend/dist');
}

/**
 * Get database URL for SQLite
 */
export function getDatabaseUrl(): string {
  const dbPath = getAppPaths().database;
  return `file:${dbPath}`;
}
