# Feature: PWA

## Status
- [x] Not Started
- [ ] In Progress
- [ ] Complete

## Priority
P2 (Important)

## Complexity
Medium

## Overview
Progressive Web App that can be installed on desktop and mobile devices. Provides app-like experience with offline support, home screen icon, and native-feeling interactions while remaining a web application.

## User Stories
- As a user, I want to install the app to my home screen so that I can access it like a native app
- As a user, I want the app to work offline so that I can use my downloaded music without internet
- As a user, I want push notifications so that I'm notified when downloads complete
- As a user, I want the app to feel native so that I get a seamless experience

## Acceptance Criteria
- [ ] Installable on desktop (Chrome, Edge, Firefox)
- [ ] Installable on mobile (iOS Safari, Android Chrome)
- [ ] Works offline (core functionality)
- [ ] Custom splash screen on launch
- [ ] App icon on home screen/dock
- [ ] Standalone window (no browser UI)
- [ ] Push notifications (download complete, etc.)
- [ ] Background sync for queued downloads
- [ ] Handles deep links (open specific playlist)
- [ ] Responsive across all screen sizes

## Technical Approach

### Frontend Changes
- **Files to modify:**
  - `frontend/index.html` - Add PWA meta tags
  - `frontend/vite.config.ts` - Add PWA plugin
- **New files:**
  - `frontend/public/manifest.json` - Web app manifest
  - `frontend/src/sw.ts` - Service worker
  - `frontend/public/icons/` - App icons in various sizes
- **New components:**
  - `frontend/src/components/PWA/InstallPrompt.tsx` - Install prompt UI
  - `frontend/src/components/PWA/UpdatePrompt.tsx` - Update notification
  - `frontend/src/hooks/usePWA.ts` - PWA utilities

### Web App Manifest
```json
// public/manifest.json
{
  "name": "Music Player",
  "short_name": "Music",
  "description": "Offline-first music player with YouTube download",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f0f0f",
  "theme_color": "#6366f1",
  "orientation": "any",
  "icons": [
    {
      "src": "/icons/icon-72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/desktop.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    },
    {
      "src": "/screenshots/mobile.png",
      "sizes": "750x1334",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ],
  "categories": ["music", "entertainment"],
  "shortcuts": [
    {
      "name": "Library",
      "url": "/library",
      "icons": [{ "src": "/icons/library.png", "sizes": "96x96" }]
    },
    {
      "name": "Download",
      "url": "/download",
      "icons": [{ "src": "/icons/download.png", "sizes": "96x96" }]
    }
  ],
  "share_target": {
    "action": "/share",
    "method": "POST",
    "enctype": "application/x-www-form-urlencoded",
    "params": {
      "url": "url",
      "text": "text",
      "title": "title"
    }
  }
}
```

### Service Worker
```typescript
// sw.ts (using Workbox)
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

declare let self: ServiceWorkerGlobalScope;

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Cache API responses
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 // 24 hours
      })
    ]
  })
);

// Cache audio files (downloaded music)
registerRoute(
  ({ request }) => request.destination === 'audio',
  new CacheFirst({
    cacheName: 'audio-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 500,
        maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
      })
    ]
  })
);

// Cache images (album art)
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'image-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
      })
    ]
  })
);

// Background sync for downloads
const downloadQueue = new BackgroundSyncPlugin('download-queue', {
  maxRetentionTime: 24 * 60 // 24 hours
});

registerRoute(
  ({ url }) => url.pathname === '/api/download',
  new NetworkFirst({
    plugins: [downloadQueue]
  }),
  'POST'
);

// Push notification handling
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};

  event.waitUntil(
    self.registration.showNotification(data.title || 'Music Player', {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      data: data.url
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data || '/')
  );
});
```

### PWA Hook
```typescript
// usePWA.ts
export function usePWA() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Capture install prompt
    const handleBeforeInstall = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    // Track online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true);
            }
          });
        });
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) return false;

    const result = await installPrompt.prompt();
    if (result.outcome === 'accepted') {
      setIsInstalled(true);
      setInstallPrompt(null);
      return true;
    }
    return false;
  };

  const update = () => {
    navigator.serviceWorker.getRegistration().then((registration) => {
      registration?.waiting?.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    });
  };

  return {
    installPrompt: !!installPrompt,
    isInstalled,
    isOnline,
    updateAvailable,
    install,
    update
  };
}
```

### Install Prompt Component
```typescript
// InstallPrompt.tsx
function InstallPrompt() {
  const { installPrompt, install, isInstalled } = usePWA();
  const [dismissed, setDismissed] = useState(false);

  if (!installPrompt || isInstalled || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-bg-secondary rounded-lg shadow-lg p-4 z-50">
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          <img src="/icons/icon-96.png" className="w-12 h-12" alt="App icon" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium">Install Music Player</h3>
          <p className="text-sm text-text-secondary">
            Install the app for offline access and a better experience
          </p>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <Button variant="secondary" size="sm" onClick={() => setDismissed(true)}>
          Not now
        </Button>
        <Button size="sm" onClick={install}>
          Install
        </Button>
      </div>
    </div>
  );
}
```

### Vite PWA Plugin Config
```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.png'],
      manifest: false, // Using manual manifest.json
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache'
            }
          }
        ]
      }
    })
  ]
});
```

### Backend Changes
- **New endpoints:**
  - `POST /api/push/subscribe` - Register push subscription
  - `POST /api/push/unsubscribe` - Remove push subscription

### Database Changes
```prisma
model PushSubscription {
  id           String   @id @default(cuid())
  endpoint     String   @unique
  keys         Json     // { p256dh, auth }
  createdAt    DateTime @default(now())
}
```

## Dependencies
- **Requires:** Mobile Responsive design
- **Blocks:** Desktop App (provides alternative path)

## Icon Sizes Required
- 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512
- Maskable versions for Android adaptive icons
- Apple touch icons

## Testing Checklist
- [ ] Lighthouse PWA audit score 100
- [ ] Install prompt appears on desktop
- [ ] Install prompt appears on mobile
- [ ] App works offline
- [ ] Service worker caches correctly
- [ ] Push notifications work
- [ ] Background sync works
- [ ] Share target works
- [ ] App shortcuts work
- [ ] Update prompt appears

## Notes
- iOS Safari has PWA limitations (no push notifications, limited background)
- Consider using IndexedDB for larger offline data storage
- May want to add "Add to Home Screen" instructions for iOS
- Background audio continues when app is minimized
- Consider periodic background sync for library updates
