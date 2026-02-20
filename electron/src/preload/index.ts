import { contextBridge, ipcRenderer } from 'electron';

/**
 * Expose Electron APIs to the renderer process
 * These are accessible via window.electronAPI
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getVersion: (): Promise<string> => ipcRenderer.invoke('get-version'),
  getPlatform: (): string => process.platform,
  isPackaged: (): Promise<boolean> => ipcRenderer.invoke('is-packaged'),

  // Media key events from main process
  onMediaKey: (callback: (action: string) => void): void => {
    ipcRenderer.on('media-key:play-pause', () => callback('play-pause'));
    ipcRenderer.on('media-key:next', () => callback('next'));
    ipcRenderer.on('media-key:previous', () => callback('previous'));
    ipcRenderer.on('media-key:stop', () => callback('stop'));
  },

  // Tray events from main process
  onTrayAction: (callback: (action: string) => void): void => {
    ipcRenderer.on('tray:toggle-play', () => callback('toggle-play'));
    ipcRenderer.on('tray:next', () => callback('next'));
    ipcRenderer.on('tray:previous', () => callback('previous'));
  },

  // Update tray state from renderer
  updateTrayState: (state: { isPlaying: boolean; currentTrack: { title: string; artist?: string } | null }): void => {
    ipcRenderer.send('update-tray-state', state);
  },

  // Native notifications
  showNotification: (title: string, body: string): void => {
    ipcRenderer.send('show-notification', { title, body });
  },

  // Window controls
  minimizeWindow: (): void => {
    ipcRenderer.send('window:minimize');
  },
  maximizeWindow: (): void => {
    ipcRenderer.send('window:maximize');
  },
  closeWindow: (): void => {
    ipcRenderer.send('window:close');
  },

  // File operations
  getMediaPath: (): Promise<string> => ipcRenderer.invoke('get-media-path'),
  openFileLocation: (filePath: string): void => {
    ipcRenderer.send('open-file-location', filePath);
  },

  // Remove listeners (for cleanup)
  removeAllListeners: (channel: string): void => {
    ipcRenderer.removeAllListeners(channel);
  },
});

// Type declarations for the exposed API
declare global {
  interface Window {
    electronAPI: {
      getVersion: () => Promise<string>;
      getPlatform: () => string;
      isPackaged: () => Promise<boolean>;
      onMediaKey: (callback: (action: string) => void) => void;
      onTrayAction: (callback: (action: string) => void) => void;
      updateTrayState: (state: { isPlaying: boolean; currentTrack: { title: string; artist?: string } | null }) => void;
      showNotification: (title: string, body: string) => void;
      minimizeWindow: () => void;
      maximizeWindow: () => void;
      closeWindow: () => void;
      getMediaPath: () => Promise<string>;
      openFileLocation: (filePath: string) => void;
      removeAllListeners: (channel: string) => void;
    };
  }
}
