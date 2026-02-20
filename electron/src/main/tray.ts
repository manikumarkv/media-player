import { Tray, Menu, nativeImage, app } from 'electron';
import path from 'path';
import { getMainWindow, showMainWindow, toggleMainWindow } from './window';

let tray: Tray | null = null;

interface TrayState {
  isPlaying: boolean;
  currentTrack: {
    title: string;
    artist?: string;
  } | null;
}

let currentState: TrayState = {
  isPlaying: false,
  currentTrack: null,
};

/**
 * Create the system tray
 */
export function createTray(): void {
  // Use template image for macOS (automatically handles dark/light mode)
  const iconName = process.platform === 'darwin' ? 'tray-Template.png' : 'tray.png';
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'icons', iconName)
    : path.join(__dirname, '../../resources/icons', iconName);

  // Create a fallback icon if the file doesn't exist
  let icon: Electron.NativeImage;
  try {
    icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) {
      // Create a simple colored icon as fallback
      icon = nativeImage.createEmpty();
    }
  } catch {
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);
  tray.setToolTip('Music Player');

  // Update menu
  updateTrayMenu();

  // Click behavior
  tray.on('click', () => {
    toggleMainWindow();
  });

  // Double click to show
  tray.on('double-click', () => {
    showMainWindow();
  });
}

/**
 * Update the tray menu based on current state
 */
export function updateTrayMenu(): void {
  if (!tray) return;

  const trackLabel = currentState.currentTrack
    ? `${currentState.currentTrack.title}${currentState.currentTrack.artist ? ` - ${currentState.currentTrack.artist}` : ''}`
    : 'No track playing';

  const contextMenu = Menu.buildFromTemplate([
    {
      label: trackLabel,
      enabled: false,
      icon: undefined, // Could add a music note icon
    },
    { type: 'separator' },
    {
      label: currentState.isPlaying ? 'Pause' : 'Play',
      click: () => {
        getMainWindow()?.webContents.send('tray:toggle-play');
      },
      accelerator: 'Space',
    },
    {
      label: 'Next',
      click: () => {
        getMainWindow()?.webContents.send('tray:next');
      },
    },
    {
      label: 'Previous',
      click: () => {
        getMainWindow()?.webContents.send('tray:previous');
      },
    },
    { type: 'separator' },
    {
      label: 'Show Window',
      click: () => {
        showMainWindow();
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      },
      accelerator: 'CommandOrControl+Q',
    },
  ]);

  tray.setContextMenu(contextMenu);

  // Update tooltip with current track
  tray.setToolTip(currentState.currentTrack ? trackLabel : 'Music Player');
}

/**
 * Update tray state from renderer
 */
export function updateTrayState(state: TrayState): void {
  currentState = state;
  updateTrayMenu();
}

/**
 * Destroy the tray
 */
export function destroyTray(): void {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}

/**
 * Get tray instance
 */
export function getTray(): Tray | null {
  return tray;
}
