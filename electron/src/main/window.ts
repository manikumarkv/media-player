import { BrowserWindow, shell, app } from 'electron';
import path from 'path';

let mainWindow: BrowserWindow | null = null;
let isQuitting = false;

// Set quitting flag when app is about to quit
app.on('before-quit', () => {
  isQuitting = true;
});

/**
 * Create the main application window
 */
export function createMainWindow(): BrowserWindow {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false, // Show when ready
    autoHideMenuBar: true,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: { x: 15, y: 15 },
    backgroundColor: '#121212',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false, // Required for some native modules
    },
  });

  // Show window when ready to avoid visual flash
  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
    // Focus the window
    if (process.platform === 'darwin') {
      mainWindow?.focus();
    }
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Handle window close - minimize to tray on macOS (unless actually quitting)
  mainWindow.on('close', (event) => {
    if (process.platform === 'darwin' && !isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    // In development, load from Vite dev server
    mainWindow.loadURL(`http://localhost:5173`);
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load built frontend from file
    const { app } = require('electron');
    const frontendPath = app.isPackaged
      ? path.join(process.resourcesPath, 'frontend', 'index.html')
      : path.join(__dirname, '../../../frontend/dist/index.html');
    mainWindow.loadFile(frontendPath);
  }

  return mainWindow;
}

/**
 * Get the main window instance
 */
export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

/**
 * Show the main window
 */
export function showMainWindow(): void {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.show();
    mainWindow.focus();
  }
}

/**
 * Hide the main window
 */
export function hideMainWindow(): void {
  mainWindow?.hide();
}

/**
 * Toggle window visibility
 */
export function toggleMainWindow(): void {
  if (mainWindow?.isVisible()) {
    hideMainWindow();
  } else {
    showMainWindow();
  }
}
