# Performance Optimization Instructions

**Project:** YouTube Media Player - Performance Best Practices  
**Purpose:** Define optimization patterns for audio playback, React, database, bundling  
**Scope:** Frontend performance, backend optimization, database queries, caching

---

## 🎯 Performance Goals

- **Audio Playback:** <100ms seek time, <2s load time
- **UI Responsiveness:** <100ms interaction response
- **Database Queries:** <50ms for metadata retrieval
- **Bundle Size:** <500KB initial load (gzipped)
- **First Contentful Paint:** <1.5s

---

## 🎵 Audio Player Optimization

### Preloading Strategy

\`\`\`typescript
// frontend/src/hooks/useAudioPreload.ts
import { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/stores/player';

export function useAudioPreload() {
  const { currentMedia, queue } = usePlayerStore();
  const preloadRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Preload next track in queue
    const nextTrack = queue[0];
    if (nextTrack) {
      preloadRef.current = new Audio(nextTrack.filePath);
      preloadRef.current.preload = 'auto';
    }

    return () => {
      if (preloadRef.current) {
        preloadRef.current.src = '';
        preloadRef.current = null;
      }
    };
  }, [currentMedia, queue]);
}
\`\`\`

### Buffer Management

\`\`\`typescript
// frontend/src/components/Player/AudioPlayer.tsx
const audioRef = useRef<HTMLAudioElement>(null);

useEffect(() => {
  const audio = audioRef.current;
  if (!audio) return;

  // Optimize buffer for large files
  audio.preload = 'metadata'; // Don't preload entire file
  audio.load();

  // Handle buffering
  const handleWaiting = () => {
    console.log('Buffering...');
  };

  const handleCanPlay = () => {
    console.log('Ready to play');
  };

  audio.addEventListener('waiting', handleWaiting);
  audio.addEventListener('canplay', handleCanPlay);

  return () => {
    audio.removeEventListener('waiting', handleWaiting);
    audio.removeEventListener('canplay', handleCanPlay);
  };
}, [currentMedia]);
\`\`\`

---

## ⚛️ React Performance

### Memoization Patterns

\`\`\`typescript
// frontend/src/components/MediaCard/MediaCard.tsx
import { memo } from 'react';

interface MediaCardProps {
  media: Media;
  onPlay: (id: string) => void;
}

export const MediaCard = memo<MediaCardProps>(({ media, onPlay }) => {
  const handlePlay = useCallback(() => {
    onPlay(media.id);
  }, [media.id, onPlay]);

  return (
    <div onClick={handlePlay}>
      <h3>{media.title}</h3>
      <p>{media.artist}</p>
    </div>
  );
}, (prev, next) => {
  // Custom comparison for better performance
  return prev.media.id === next.media.id;
});
\`\`\`

### Virtual Scrolling for Large Lists

\`\`\`typescript
// frontend/src/components/MediaList/VirtualizedList.tsx
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

export function VirtualizedMediaList({ items }: { items: Media[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Row height
    overscan: 5, // Render 5 extra items
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div
        style={{
          height: \`\${virtualizer.getTotalSize()}px\`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: \`\${virtualItem.size}px\`,
              transform: \`translateY(\${virtualItem.start}px)\`,
            }}
          >
            <MediaCard media={items[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
\`\`\`

### Code Splitting

\`\`\`typescript
// frontend/src/App.tsx
import { lazy, Suspense } from 'react';

// Lazy load routes
const Library = lazy(() => import('./pages/Library'));
const Player = lazy(() => import('./pages/Player'));
const Download = lazy(() => import('./pages/Download'));

export function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Library />} />
        <Route path="/player" element={<Player />} />
        <Route path="/download" element={<Download />} />
      </Routes>
    </Suspense>
  );
}
\`\`\`

---

## 🗄️ Database Performance

### Indexing Strategy

\`\`\`prisma
// backend/prisma/schema.prisma
model Media {
  id          String   @id @default(uuid())
  title       String
  artist      String
  playCount   Int      @default(0)
  liked       Boolean  @default(false)
  lastPlayedAt DateTime?
  createdAt   DateTime @default(now())

  // Indexes for common queries
  @@index([playCount(sort: Desc)]) // Most played
  @@index([liked, lastPlayedAt(sort: Desc)]) // Liked songs
  @@index([artist, title]) // Search by artist/title
  @@index([createdAt(sort: Desc)]) // Recently added
}
\`\`\`

### Query Optimization

\`\`\`typescript
// backend/src/services/media.service.ts
import { prisma } from '../config/database';

export class MediaService {
  // ❌ BAD - N+1 query problem
  async getPlaylistsWithMedia() {
    const playlists = await prisma.playlist.findMany();
    
    for (const playlist of playlists) {
      playlist.media = await prisma.media.findMany({
        where: { playlistId: playlist.id },
      });
    }
    
    return playlists;
  }

  // ✅ GOOD - Use include/select
  async getPlaylistsWithMediaOptimized() {
    return prisma.playlist.findMany({
      include: {
        media: {
          select: {
            id: true,
            title: true,
            artist: true,
            // Only select needed fields
          },
        },
      },
    });
  }

  // ✅ GOOD - Pagination for large datasets
  async getMediaPaginated(page: number = 1, limit: number = 50) {
    const [items, total] = await Promise.all([
      prisma.media.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.media.count(),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
\`\`\`

### Connection Pooling

\`\`\`typescript
// backend/src/config/database.ts
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Connection pool settings in DATABASE_URL
// postgresql://user:pass@localhost:5432/db?connection_limit=20&pool_timeout=10
\`\`\`

---

## 📦 Bundle Optimization

### Vite Configuration

\`\`\`typescript
// frontend/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['zustand', 'react-hot-toast'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
\`\`\`

### Bundle Analysis

\`\`\`bash
# Add to package.json
"scripts": {
  "build": "vite build",
  "analyze": "vite build --mode analyze && vite-bundle-visualizer"
}

# Install
npm install -D vite-bundle-visualizer
\`\`\`

---

## 💾 Caching Strategy

### API Response Caching (Frontend)

\`\`\`typescript
// frontend/src/hooks/useMediaQuery.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';

export function useMediaQuery(id: string) {
  return useQuery({
    queryKey: ['media', id],
    queryFn: () => apiClient.get(\`/api/media/\${id}\`),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}
\`\`\`

### Browser Caching (Service Worker)

\`\`\`typescript
// frontend/public/sw.js
const CACHE_NAME = 'media-player-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/index.css',
  '/assets/index.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
\`\`\`

---

## 📂 File Handling Optimization

### Streaming Large Files

\`\`\`typescript
// backend/src/controllers/media.controller.ts
import { createReadStream } from 'fs';

export async function streamMedia(req: Request, res: Response) {
  const { id } = req.params;
  const media = await prisma.media.findUnique({ where: { id } });

  if (!media) throw new NotFoundError('Media', id);

  const filePath = media.filePath;
  const stat = await fs.promises.stat(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    // Handle range requests for seeking
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    res.writeHead(206, {
      'Content-Range': \`bytes \${start}-\${end}/\${fileSize}\`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'audio/mpeg',
    });

    createReadStream(filePath, { start, end }).pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': 'audio/mpeg',
    });

    createReadStream(filePath).pipe(res);
  }
}
\`\`\`

---

## 📊 Performance Monitoring

### Web Vitals (Frontend)

\`\`\`typescript
// frontend/src/utils/vitals.ts
import { onCLS, onFID, onLCP } from 'web-vitals';

export function reportWebVitals() {
  onCLS(console.log);
  onFID(console.log);
  onLCP(console.log);
}

// In main.tsx
reportWebVitals();
\`\`\`

### Response Time Tracking (Backend)

\`\`\`typescript
// backend/src/middleware/performance.middleware.ts
export function performanceMonitor(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: \`\${duration}ms\`,
    });

    if (duration > 1000) {
      logger.warn('Slow request detected', { path: req.path, duration });
    }
  });

  next();
}
\`\`\`

---

## 📚 Related Instructions

- **Frontend:** \`.github/instructions/frontend.instructions.md\`
- **Backend:** \`.github/instructions/backend.instructions.md\`
- **Database:** \`.github/instructions/database.instructions.md\`
- **Player:** \`.github/instructions/player.instructions.md\`

---

**When to Reference:**
- ✅ Optimizing audio playback
- ✅ Large lists (1000+ songs)
- ✅ Slow database queries
- ✅ Large bundle sizes
- ✅ Production performance issues
