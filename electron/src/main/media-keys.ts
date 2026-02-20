import { globalShortcut } from 'electron';
import { getMainWindow } from './window';

/**
 * Register global media key shortcuts
 */
export function registerMediaKeys(): void {
  // Media Play/Pause key
  try {
    globalShortcut.register('MediaPlayPause', () => {
      console.log('MediaPlayPause pressed');
      getMainWindow()?.webContents.send('media-key:play-pause');
    });
  } catch (error) {
    console.warn('Failed to register MediaPlayPause:', error);
  }

  // Media Next Track key
  try {
    globalShortcut.register('MediaNextTrack', () => {
      console.log('MediaNextTrack pressed');
      getMainWindow()?.webContents.send('media-key:next');
    });
  } catch (error) {
    console.warn('Failed to register MediaNextTrack:', error);
  }

  // Media Previous Track key
  try {
    globalShortcut.register('MediaPreviousTrack', () => {
      console.log('MediaPreviousTrack pressed');
      getMainWindow()?.webContents.send('media-key:previous');
    });
  } catch (error) {
    console.warn('Failed to register MediaPreviousTrack:', error);
  }

  // Media Stop key
  try {
    globalShortcut.register('MediaStop', () => {
      console.log('MediaStop pressed');
      getMainWindow()?.webContents.send('media-key:stop');
    });
  } catch (error) {
    console.warn('Failed to register MediaStop:', error);
  }

  console.log('Global media keys registered');
}

/**
 * Unregister all global shortcuts
 */
export function unregisterMediaKeys(): void {
  globalShortcut.unregisterAll();
  console.log('Global media keys unregistered');
}

/**
 * Check if a shortcut is registered
 */
export function isMediaKeyRegistered(accelerator: string): boolean {
  return globalShortcut.isRegistered(accelerator);
}
