/**
 * Electron integration utilities
 * Provides detection and IPC communication with Electron main process
 */

interface ElectronAPI {
  getVersion: () => Promise<string>;
  getPlatform: () => string;
  isPackaged: () => Promise<boolean>;
  onMediaKey: (callback: (action: string) => void) => void;
  onTrayAction: (callback: (action: string) => void) => void;
  updateTrayState: (state: {
    isPlaying: boolean;
    currentTrack: { title: string; artist?: string } | null;
  }) => void;
  showNotification: (title: string, body: string) => void;
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  getMediaPath: () => Promise<string>;
  openFileLocation: (filePath: string) => void;
  removeAllListeners: (channel: string) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

/**
 * Check if running in Electron
 */
export function isElectron(): boolean {
  return typeof window !== 'undefined' && window.electronAPI !== undefined;
}

/**
 * Get the API base URL
 * In Electron, returns http://localhost:3000
 * In browser/Docker, returns empty string (same-origin)
 */
export function getApiBaseUrl(): string {
  return isElectron() ? 'http://localhost:3000' : '';
}

/**
 * Get a full URL for a media endpoint (stream, thumbnail)
 * This ensures proper URL formation in both Electron and web contexts
 */
export function getMediaUrl(path: string): string {
  return `${getApiBaseUrl()}${path}`;
}

/**
 * Get the Electron API if available
 */
export function getElectronAPI(): ElectronAPI | null {
  if (isElectron()) {
    return window.electronAPI ?? null;
  }
  return null;
}

/**
 * Get app version (Electron or fallback)
 */
export async function getAppVersion(): Promise<string> {
  const api = getElectronAPI();
  if (api) {
    return api.getVersion();
  }
  return '1.0.0'; // Fallback for web
}

/**
 * Get platform name
 */
export function getPlatform(): string {
  const api = getElectronAPI();
  if (api) {
    return api.getPlatform();
  }
  // Detect from user agent for web
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('mac')) return 'darwin';
  if (ua.includes('win')) return 'win32';
  if (ua.includes('linux')) return 'linux';
  return 'unknown';
}

/**
 * Show native notification (Electron) or web notification (browser)
 */
export function showNotification(title: string, body: string): void {
  const api = getElectronAPI();
  if (api) {
    api.showNotification(title, body);
  } else if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body });
  } else if ('Notification' in window && Notification.permission !== 'denied') {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        new Notification(title, { body });
      }
    });
  }
}

/**
 * Update the system tray state
 */
export function updateTrayState(state: {
  isPlaying: boolean;
  currentTrack: { title: string; artist?: string } | null;
}): void {
  const api = getElectronAPI();
  if (api) {
    api.updateTrayState(state);
  }
}

/**
 * Setup media key listeners
 */
export function setupMediaKeyListeners(handlers: {
  onPlayPause?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onStop?: () => void;
}): void {
  const api = getElectronAPI();
  if (api) {
    api.onMediaKey((action) => {
      switch (action) {
        case 'play-pause':
          handlers.onPlayPause?.();
          break;
        case 'next':
          handlers.onNext?.();
          break;
        case 'previous':
          handlers.onPrevious?.();
          break;
        case 'stop':
          handlers.onStop?.();
          break;
      }
    });
  }
}

/**
 * Setup tray action listeners
 */
export function setupTrayListeners(handlers: {
  onTogglePlay?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
}): void {
  const api = getElectronAPI();
  if (api) {
    api.onTrayAction((action) => {
      switch (action) {
        case 'toggle-play':
          handlers.onTogglePlay?.();
          break;
        case 'next':
          handlers.onNext?.();
          break;
        case 'previous':
          handlers.onPrevious?.();
          break;
      }
    });
  }
}

/**
 * Open file location in system file manager
 */
export function openFileLocation(filePath: string): void {
  const api = getElectronAPI();
  if (api) {
    api.openFileLocation(filePath);
  }
}

/**
 * Get the media storage path
 */
export async function getMediaPath(): Promise<string | null> {
  const api = getElectronAPI();
  if (api) {
    return api.getMediaPath();
  }
  return null;
}
