import { app, BrowserWindow, ipcMain, shell, Notification } from 'electron';
import { createMainWindow, getMainWindow, showMainWindow } from './window';
import { createTray, destroyTray, updateTrayState } from './tray';
import { registerMediaKeys, unregisterMediaKeys } from './media-keys';
import { getAppPaths, ensureDirectories, getDatabaseUrl, getYtDlpPath } from './paths';
import { initializeDatabase } from './database';
import path from 'path';

// Ensure single instance
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  // Handle second instance - show existing window
  app.on('second-instance', () => {
    showMainWindow();
  });

  // App ready
  app.whenReady().then(async () => {
    console.log('App ready, initializing...');

    // Ensure directories exist
    ensureDirectories();

    // Set environment variables for backend
    const paths = getAppPaths();
    process.env.DATABASE_URL = getDatabaseUrl();
    process.env.MEDIA_PATH = paths.media;
    process.env.THUMBNAILS_PATH = paths.thumbnails;
    process.env.YT_DLP_PATH = getYtDlpPath();
    process.env.NODE_ENV = app.isPackaged ? 'production' : 'development';

    console.log('Environment configured:', {
      DATABASE_URL: process.env.DATABASE_URL,
      MEDIA_PATH: process.env.MEDIA_PATH,
      YT_DLP_PATH: process.env.YT_DLP_PATH,
    });

    // Initialize database if needed (first run)
    if (app.isPackaged) {
      const dbInitialized = await initializeDatabase();
      if (!dbInitialized) {
        console.warn('Database initialization may have failed');
      }
    }

    // Start backend server
    try {
      const port = await startBackendServer();
      console.log(`Backend server started on port ${port}`);
    } catch (error) {
      console.error('Failed to start backend server:', error);
      app.quit();
      return;
    }

    // Create main window
    createMainWindow();

    // Create system tray
    createTray();

    // Register global media keys
    registerMediaKeys();

    // Setup IPC handlers
    setupIpcHandlers();

    // Check for updates (production only)
    if (app.isPackaged) {
      try {
        const { autoUpdater } = await import('electron-updater');
        autoUpdater.checkForUpdatesAndNotify();
      } catch (error) {
        console.log('Auto-updater not available:', error);
      }
    }

    // macOS: Re-create window when dock icon clicked
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      } else {
        showMainWindow();
      }
    });
  });

  // Window close behavior
  app.on('window-all-closed', () => {
    // On macOS, keep app running
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  // Cleanup before quit
  app.on('before-quit', () => {
    unregisterMediaKeys();
    destroyTray();
    stopBackendServer();
  });

  // Quit when all windows closed (except macOS)
  app.on('will-quit', () => {
    stopBackendServer();
  });

  /**
   * Start the Express backend server
   */
  async function startBackendServer(): Promise<number> {
    return new Promise((resolve) => {
      const port = 3000;

      // Set port
      process.env.PORT = String(port);

      if (app.isPackaged) {
        // In production, require the bundled backend (CJS format)
        const backendPath = path.join(process.resourcesPath, 'backend', 'server.js');

        try {
          console.log('Loading backend from:', backendPath);
          // Dynamic require for bundled CJS backend
          require(backendPath);
          console.log('Backend loaded successfully');

          // Give it a moment to start the HTTP server
          setTimeout(() => {
            console.log('Backend server should be running on port', port);
            resolve(port);
          }, 1000);
        } catch (error) {
          console.error('Failed to load backend:', error);
          // Still resolve to show UI even if backend fails
          resolve(port);
        }
      } else {
        // In development, assume backend is running separately (via pnpm backend:dev)
        console.log('Development mode: expecting backend on port', port);
        resolve(port);
      }
    });
  }

  /**
   * Stop the backend server
   */
  function stopBackendServer(): void {
    // Backend runs in the same process, will be stopped when app quits
    console.log('Backend server shutting down...');
  }

  /**
   * Setup IPC handlers for renderer communication
   */
  function setupIpcHandlers(): void {
    // App info
    ipcMain.handle('get-version', () => app.getVersion());
    ipcMain.handle('is-packaged', () => app.isPackaged);
    ipcMain.handle('get-media-path', () => getAppPaths().media);

    // Tray state updates
    ipcMain.on('update-tray-state', (_event, state) => {
      updateTrayState(state);
    });

    // Notifications
    ipcMain.on('show-notification', (_event, { title, body }) => {
      if (Notification.isSupported()) {
        new Notification({ title, body }).show();
      }
    });

    // Window controls
    ipcMain.on('window:minimize', () => {
      getMainWindow()?.minimize();
    });

    ipcMain.on('window:maximize', () => {
      const win = getMainWindow();
      if (win?.isMaximized()) {
        win.unmaximize();
      } else {
        win?.maximize();
      }
    });

    ipcMain.on('window:close', () => {
      getMainWindow()?.close();
    });

    // File operations
    ipcMain.on('open-file-location', (_event, filePath) => {
      shell.showItemInFolder(filePath);
    });
  }
}
