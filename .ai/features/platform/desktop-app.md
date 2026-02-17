# Feature: Desktop App

## Status
- [x] Not Started
- [ ] In Progress
- [ ] Complete

## Priority
P3 (Nice to Have)

## Complexity
High

## Overview
Native desktop application using Electron or Tauri. Provides deeper OS integration, system tray, global media key support, and a more app-like experience than the web version.

## User Stories
- As a desktop user, I want a native app so that I get the best performance and integration
- As a user, I want the app in my system tray so that I can control playback quickly
- As a user, I want global keyboard shortcuts so that I can control music from any application
- As a user, I want native notifications so that I know when downloads complete

## Acceptance Criteria
- [ ] Native Windows/macOS/Linux builds
- [ ] System tray icon with playback controls
- [ ] Global media key support (play/pause, next, prev)
- [ ] Native notifications
- [ ] Auto-start on system boot (optional)
- [ ] Single instance enforcement
- [ ] Deep linking (music://open)
- [ ] Native file system access
- [ ] Automatic updates
- [ ] Hardware-accelerated audio

## Technical Approach

### Framework Choice: Tauri vs Electron

| Aspect | Tauri | Electron |
|--------|-------|----------|
| Bundle size | ~10MB | ~150MB+ |
| Memory usage | Low | High |
| Security | Rust-based, minimal | Node.js, larger surface |
| Web engine | OS WebView | Chromium |
| Complexity | Higher | Lower |
| Maturity | Newer | Battle-tested |

**Recommendation:** Tauri for smaller size and better performance, but Electron for faster development if team is familiar with Node.js.

### Tauri Implementation

#### Project Structure
```
desktop/
├── src-tauri/
│   ├── src/
│   │   ├── main.rs          # Main Tauri app
│   │   ├── commands.rs      # IPC commands
│   │   ├── tray.rs          # System tray
│   │   └── media_keys.rs    # Global shortcuts
│   ├── Cargo.toml
│   └── tauri.conf.json
├── src/                      # Share with web frontend
└── package.json
```

#### Tauri Configuration
```json
// tauri.conf.json
{
  "build": {
    "distDir": "../dist",
    "devPath": "http://localhost:5173"
  },
  "package": {
    "productName": "Music Player",
    "version": "1.0.0"
  },
  "tauri": {
    "allowlist": {
      "all": false,
      "fs": {
        "all": true,
        "scope": ["$APPDATA/**", "$DOWNLOAD/**", "$AUDIO/**"]
      },
      "shell": {
        "open": true
      },
      "notification": {
        "all": true
      },
      "globalShortcut": {
        "all": true
      },
      "window": {
        "all": true
      }
    },
    "bundle": {
      "active": true,
      "icon": [
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/128x128@2x.png",
        "icons/icon.icns",
        "icons/icon.ico"
      ],
      "identifier": "com.musicplayer.app",
      "targets": ["msi", "dmg", "deb", "appimage"]
    },
    "systemTray": {
      "iconPath": "icons/tray.png",
      "iconAsTemplate": true
    },
    "windows": [
      {
        "title": "Music Player",
        "width": 1200,
        "height": 800,
        "minWidth": 800,
        "minHeight": 600,
        "resizable": true,
        "fullscreen": false
      }
    ]
  }
}
```

#### Main Rust Entry
```rust
// main.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, CustomMenuItem};

mod commands;
mod tray;
mod media_keys;

fn main() {
    let tray_menu = SystemTrayMenu::new()
        .add_item(CustomMenuItem::new("play_pause", "Play/Pause"))
        .add_item(CustomMenuItem::new("next", "Next Track"))
        .add_item(CustomMenuItem::new("prev", "Previous Track"))
        .add_native_item(tauri::SystemTrayMenuItem::Separator)
        .add_item(CustomMenuItem::new("show", "Show Window"))
        .add_item(CustomMenuItem::new("quit", "Quit"));

    let tray = SystemTray::new().with_menu(tray_menu);

    tauri::Builder::default()
        .system_tray(tray)
        .on_system_tray_event(tray::handle_tray_event)
        .invoke_handler(tauri::generate_handler![
            commands::play_pause,
            commands::next_track,
            commands::prev_track,
            commands::get_download_path,
            commands::save_file,
        ])
        .setup(|app| {
            // Register global shortcuts
            media_keys::register_media_keys(app.handle())?;

            // Single instance
            #[cfg(desktop)]
            app.handle().plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
                // Focus window when second instance is launched
                if let Some(window) = app.get_window("main") {
                    window.set_focus().ok();
                }
            }))?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running application");
}
```

#### System Tray Handler
```rust
// tray.rs
use tauri::{AppHandle, Manager, SystemTrayEvent};

pub fn handle_tray_event(app: &AppHandle, event: SystemTrayEvent) {
    match event {
        SystemTrayEvent::LeftClick { .. } => {
            if let Some(window) = app.get_window("main") {
                window.show().ok();
                window.set_focus().ok();
            }
        }
        SystemTrayEvent::MenuItemClick { id, .. } => {
            match id.as_str() {
                "play_pause" => {
                    app.emit_all("player:toggle", ()).ok();
                }
                "next" => {
                    app.emit_all("player:next", ()).ok();
                }
                "prev" => {
                    app.emit_all("player:prev", ()).ok();
                }
                "show" => {
                    if let Some(window) = app.get_window("main") {
                        window.show().ok();
                        window.set_focus().ok();
                    }
                }
                "quit" => {
                    std::process::exit(0);
                }
                _ => {}
            }
        }
        _ => {}
    }
}
```

#### Global Media Keys
```rust
// media_keys.rs
use tauri::{AppHandle, Manager};
use tauri::GlobalShortcutManager;

pub fn register_media_keys(app: AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let mut shortcut_manager = app.global_shortcut_manager();

    // Media Play/Pause
    shortcut_manager.register("MediaPlayPause", {
        let app = app.clone();
        move || {
            app.emit_all("player:toggle", ()).ok();
        }
    })?;

    // Media Next
    shortcut_manager.register("MediaTrackNext", {
        let app = app.clone();
        move || {
            app.emit_all("player:next", ()).ok();
        }
    })?;

    // Media Previous
    shortcut_manager.register("MediaTrackPrevious", {
        let app = app.clone();
        move || {
            app.emit_all("player:prev", ()).ok();
        }
    })?;

    // Media Stop
    shortcut_manager.register("MediaStop", {
        let app = app.clone();
        move || {
            app.emit_all("player:stop", ()).ok();
        }
    })?;

    Ok(())
}
```

### Frontend Integration

#### Tauri Event Listeners
```typescript
// tauriIntegration.ts
import { listen } from '@tauri-apps/api/event';
import { sendNotification } from '@tauri-apps/api/notification';

export async function setupTauriListeners(playerStore: PlayerStore) {
  // Listen for tray/media key events
  await listen('player:toggle', () => {
    playerStore.togglePlay();
  });

  await listen('player:next', () => {
    playerStore.nextTrack();
  });

  await listen('player:prev', () => {
    playerStore.prevTrack();
  });

  await listen('player:stop', () => {
    playerStore.stop();
  });
}

export async function showNotification(title: string, body: string) {
  await sendNotification({ title, body });
}

export function isTauri(): boolean {
  return '__TAURI__' in window;
}
```

#### Native File Access
```typescript
// fileAccess.ts
import { save, open } from '@tauri-apps/api/dialog';
import { writeBinaryFile, readBinaryFile } from '@tauri-apps/api/fs';

export async function saveFile(data: Uint8Array, filename: string) {
  const path = await save({
    defaultPath: filename,
    filters: [{ name: 'Audio', extensions: ['mp3', 'flac', 'wav'] }]
  });

  if (path) {
    await writeBinaryFile(path, data);
    return path;
  }
  return null;
}

export async function selectMusicFolder() {
  const selected = await open({
    directory: true,
    multiple: false
  });

  return selected as string | null;
}
```

### Auto-Updater
```rust
// In main.rs setup
use tauri::updater::UpdateResponse;

app.listen_global("tauri://update-available", |event| {
    println!("Update available: {:?}", event.payload());
});

// Check for updates
tauri::updater::check_update(app.handle())?;
```

### Build Scripts

#### package.json
```json
{
  "scripts": {
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build",
    "tauri:build:windows": "tauri build --target x86_64-pc-windows-msvc",
    "tauri:build:mac": "tauri build --target universal-apple-darwin",
    "tauri:build:linux": "tauri build --target x86_64-unknown-linux-gnu"
  }
}
```

## Dependencies
- **Requires:** Tauri CLI, Rust toolchain
- **Blocks:** None
- **Alternative to:** PWA

## Platform-Specific Considerations

### Windows
- MSI installer with Start Menu shortcut
- Auto-start via registry
- Media key support built-in

### macOS
- DMG with drag-to-Applications
- Menu bar item option
- Notarization required for distribution

### Linux
- AppImage for universal compatibility
- .deb for Debian/Ubuntu
- Flatpak for sandboxed distribution

## Notes
- Tauri v2 brings mobile support (iOS/Android)
- Consider code signing for production releases
- Auto-updater requires hosted update server
- May need to handle offline/online transitions differently
- Consider keeping web and desktop UX consistent
- Bundle size ~10MB with Tauri vs ~150MB+ with Electron
