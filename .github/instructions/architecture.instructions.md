# Architecture Patterns Instructions

**Project:** YouTube Media Player - Offline-First Architecture  
**Purpose:** Define system-wide architecture patterns, design principles, and structural guidelines  
**Scope:** Cross-cutting concerns, system design, integration patterns

---

## 🎯 Core Architecture Principles

### 1. **Offline-First Architecture**

**Principle:** Every feature MUST work without internet except downloads.

```
Priority Order:
1. Player functionality (MUST work offline)
2. Library management (MUST work offline)
3. Download functionality (requires internet during download only)
```

**Pattern:**
```typescript
// Bad - depends on network
async function playMedia(id: string) {
  const media = await fetch(`/api/media/${id}`); // Network required
  player.load(media.streamUrl); // Network required
}

// Good - offline-first
async function playMedia(id: string) {
  const media = await db.media.findUnique({ where: { id } }); // Local DB
  player.load(`/media/files/${media.filename}`); // Local file
}
```

**Implementation:**
- All media stored locally on disk
- Database is local (PostgreSQL in container)
- Player loads from local filesystem
- Downloads create local copies
- Metadata cached in database

---

### 2. **Layered Architecture**

**Pattern:** Strict separation of concerns across layers.

```
┌─────────────────────────────────────────────────────┐
│                  Presentation Layer                  │
│            (React Components + Hooks)                │
├─────────────────────────────────────────────────────┤
│                   State Layer                        │
│            (Zustand Stores + Context)                │
├─────────────────────────────────────────────────────┤
│                 API Layer (Frontend)                 │
│            (Axios Client + Type Definitions)         │
╞═════════════════════════════════════════════════════╡
│                  API Layer (Backend)                 │
│            (Express Routes + Middleware)             │
├─────────────────────────────────────────────────────┤
│                  Service Layer                       │
│          (Business Logic + Orchestration)            │
├─────────────────────────────────────────────────────┤
│                   Data Layer                         │
│            (Prisma ORM + Repositories)               │
├─────────────────────────────────────────────────────┤
│                 Storage Layer                        │
│         (PostgreSQL + Filesystem + Cache)            │
└─────────────────────────────────────────────────────┘
```

**Rules:**
- Each layer can only communicate with adjacent layers
- No layer should skip levels (e.g., Component → Service directly)
- Data flows DOWN (requests) and UP (responses)

---

### 3. **Service-Oriented Backend**

**Pattern:** All business logic in service layer, controllers are thin.

```typescript
// ❌ BAD - Fat controller
router.get('/media/:id', async (req, res) => {
  const media = await prisma.media.findUnique({ where: { id: req.params.id } });
  if (!media) return res.status(404).json({ error: 'Not found' });
  
  await prisma.media.update({
    where: { id: media.id },
    data: { playCount: media.playCount + 1 }
  });
  
  await prisma.playHistory.create({
    data: { mediaId: media.id, timestamp: new Date() }
  });
  
  res.json(media);
});

// ✅ GOOD - Thin controller, fat service
router.get('/media/:id', async (req, res) => {
  try {
    const media = await mediaService.getById(req.params.id);
    await playerService.recordPlay(req.params.id);
    res.json(media);
  } catch (error) {
    handleError(error, res);
  }
});

// Service layer handles all logic
class MediaService {
  async getById(id: string): Promise<Media> {
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (!media) throw new NotFoundError('Media not found');
    return media;
  }
}

class PlayerService {
  async recordPlay(mediaId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.media.update({
        where: { id: mediaId },
        data: { playCount: { increment: 1 }, lastPlayedAt: new Date() }
      }),
      this.prisma.playHistory.create({
        data: { mediaId, timestamp: new Date() }
      })
    ]);
  }
}
```

---

### 4. **Component-Based Frontend**

**Pattern:** Smart containers + Dumb components.

```
src/components/
├── player/
│   ├── Player.tsx              # Smart container (state + logic)
│   ├── PlayerControls.tsx      # Dumb (props only)
│   ├── PlayerProgress.tsx      # Dumb (props only)
│   ├── PlayerVolume.tsx        # Dumb (props only)
│   └── PlayerQueue.tsx         # Smart (has own state)
└── library/
    ├── LibraryView.tsx         # Smart container
    ├── MediaCard.tsx           # Dumb (props only)
    ├── MediaList.tsx           # Dumb (props only)
    └── MediaGrid.tsx           # Dumb (props only)
```

**Smart Component Example:**
```tsx
// Smart - manages state, has logic
export function Player() {
  const { currentMedia, isPlaying, play, pause } = usePlayer();
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (isPlaying) audioRef.current?.play();
    else audioRef.current?.pause();
  }, [isPlaying]);

  return (
    <div>
      <audio ref={audioRef} src={currentMedia?.localPath} />
      <PlayerControls 
        isPlaying={isPlaying} 
        onPlay={play} 
        onPause={pause} 
      />
    </div>
  );
}
```

**Dumb Component Example:**
```tsx
// Dumb - pure props, no state, no logic
interface PlayerControlsProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
}

export function PlayerControls({ isPlaying, onPlay, onPause }: PlayerControlsProps) {
  return (
    <div className="controls">
      {isPlaying ? (
        <button onClick={onPause}>Pause</button>
      ) : (
        <button onClick={onPlay}>Play</button>
      )}
    </div>
  );
}
```

---

## 🏗️ System Architecture Patterns

### 1. **Multi-Container Docker Architecture**

```
┌──────────────────────────────────────────────────────────────┐
│                         Docker Host                          │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │
│  │   Frontend     │  │    Backend     │  │   PostgreSQL   │ │
│  │   (nginx)      │  │   (node:18)    │  │  (postgres:15) │ │
│  │   Port: 80     │  │   Port: 3000   │  │   Port: 5432   │ │
│  └────────┬───────┘  └────────┬───────┘  └────────┬───────┘ │
│           │                   │                   │          │
│           │  HTTP /api/*      │  PostgreSQL       │          │
│           └──────────────────►│◄──────────────────┘          │
│                               │                              │
│           ┌───────────────────▼──────────────────┐           │
│           │      media-network (bridge)          │           │
│           └──────────────────────────────────────┘           │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Volumes (Persistent Storage)                 │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  - media-files:/app/media (shared: backend ↔ nginx) │   │
│  │  - postgres-data:/var/lib/postgresql/data           │   │
│  │  - backend-logs:/app/logs                           │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

**Key Patterns:**
- Frontend container serves static files + proxies API
- Backend container handles business logic + serves media files
- Database container with persistent volume
- Shared volume for media files (backend writes, nginx serves)
- Internal network for service communication
- Only frontend exposes port to host

---

### 2. **Data Flow Architecture**

#### **Download Flow**
```
User Action → Frontend → Backend → YouTube → Filesystem + DB
                ↑                                       │
                └───────── Progress Events ─────────────┘
                           (Socket.io)
```

**Implementation:**
```typescript
// Frontend initiates
await api.post('/downloads', { youtubeUrl });

// Backend processes
class DownloadService {
  async downloadMedia(url: string): Promise<void> {
    // 1. Extract info
    const info = await ytdl.getInfo(url);
    
    // 2. Download to temp
    const tempPath = await this.downloadToTemp(url);
    
    // 3. Convert to MP3
    const finalPath = await this.convertToMP3(tempPath);
    
    // 4. Save to database
    await this.saveToDatabase(info, finalPath);
    
    // 5. Emit progress
    this.socketService.emit('download:complete', { id });
  }
}
```

#### **Playback Flow**
```
User Click → Zustand Store → Player Component → HTML5 Audio → Filesystem
                ↓                                                  ↑
           Play History DB                                         │
                ↓                                                  │
           Update Metadata ─────────────────────────────────────────┘
```

**Implementation:**
```typescript
// 1. User clicks play
<MediaCard onPlay={() => playMedia(media.id)} />

// 2. Update store
const playMedia = usePlayerStore(state => state.play);
playMedia(media.id);

// 3. Store updates and triggers recording
const play = (id: string) => {
  set({ currentMediaId: id, isPlaying: true });
  api.post(`/player/play/${id}`); // Record in history
};

// 4. Component reacts to state change
const { currentMedia } = usePlayer();
<audio src={`/media/${currentMedia.filename}`} />
```

#### **Search Flow**
```
User Input → Debounce → API Request → Database Query → Results
              (300ms)                  (Full-text)
```

---

### 3. **State Management Architecture**

```
┌────────────────────────────────────────────────────────────┐
│                      Zustand Stores                        │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │   Player    │  │   Library   │  │   Queue     │       │
│  │   Store     │  │   Store     │  │   Store     │       │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘       │
│         │                │                │              │
│         ├────────────────┼────────────────┤              │
│         │       Cross-Store Subscriptions │              │
│         └────────────────┴────────────────┘              │
│                                                           │
│  Example: Queue.next() → Player.play() → Library.update()│
└────────────────────────────────────────────────────────────┘
```

**Pattern:**
```typescript
// Player store - manages playback
export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentMedia: null,
  isPlaying: false,
  
  play: (mediaId: string) => {
    const queueStore = useQueueStore.getState();
    set({ currentMedia: queueStore.getMedia(mediaId), isPlaying: true });
  },
  
  next: () => {
    const queueStore = useQueueStore.getState();
    const nextMedia = queueStore.getNext();
    get().play(nextMedia.id);
  }
}));

// Queue store - manages play queue
export const useQueueStore = create<QueueState>((set, get) => ({
  items: [],
  currentIndex: 0,
  
  getNext: () => {
    const { items, currentIndex } = get();
    return items[currentIndex + 1];
  },
  
  onMediaEnded: () => {
    const playerStore = usePlayerStore.getState();
    playerStore.next(); // Cross-store communication
  }
}));
```

---

## 🔄 Integration Patterns

### ⚠️ CRITICAL: Centralized URL Management

**All API routes, endpoints, and socket events MUST be defined in ONE place.**

See: `.github/instructions/api-routes.instructions.md` for complete details.

**Key Files:**
- `shared/constants/routes.ts` - Route path definitions
- `shared/constants/endpoints.ts` - URL builders with parameters
- `shared/constants/socket-events.ts` - Socket.io event names

**Rules:**
- ✅ Always import from shared constants
- ❌ NEVER hardcode route strings
- ❌ NEVER hardcode event names
- ✅ Both FE and BE use same constants

---

### 1. **API Communication Pattern**

**RESTful Conventions (defined in shared/constants/routes.ts):**
```
GET    /api/media              # List all media
GET    /api/media/:id          # Get single media
POST   /api/media              # Create media (from download)
PATCH  /api/media/:id          # Update media metadata
DELETE /api/media/:id          # Delete media

GET    /api/playlists          # List playlists
POST   /api/playlists          # Create playlist
GET    /api/playlists/:id      # Get playlist with media
PATCH  /api/playlists/:id      # Update playlist
DELETE /api/playlists/:id      # Delete playlist

POST   /api/player/play/:id    # Record play event
POST   /api/player/resume/:id  # Resume from last position
GET    /api/player/history     # Get play history

POST   /api/downloads          # Start download
GET    /api/downloads/:id      # Get download status
DELETE /api/downloads/:id      # Cancel download
```

**Frontend API Client Pattern:**
```typescript
// Centralized API client
class ApiClient {
  private baseUrl = '/api';
  
  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`);
    if (!response.ok) throw new ApiError(response);
    return response.json();
  }
  
  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new ApiError(response);
    return response.json();
  }
}

// Type-safe endpoints
export const mediaApi = {
  list: () => client.get<Media[]>('/media'),
  getById: (id: string) => client.get<Media>(`/media/${id}`),
  create: (data: CreateMediaDto) => client.post<Media>('/media', data),
  delete: (id: string) => client.delete(`/media/${id}`)
};
```

---

### 2. **Real-Time Communication Pattern**

**Socket.io for Progress Updates:**

```typescript
// Backend - emit events
class DownloadService {
  async download(url: string, socketId: string) {
    const stream = ytdl(url);
    
    stream.on('progress', (chunk, downloaded, total) => {
      const progress = (downloaded / total) * 100;
      this.socketService.emitTo(socketId, 'download:progress', {
        progress,
        downloaded,
        total
      });
    });
    
    stream.on('end', () => {
      this.socketService.emitTo(socketId, 'download:complete', { url });
    });
  }
}

// Frontend - listen for events
export function useDownloadProgress(downloadId: string) {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    socket.on('download:progress', (data) => {
      if (data.downloadId === downloadId) {
        setProgress(data.progress);
      }
    });
    
    return () => socket.off('download:progress');
  }, [downloadId]);
  
  return progress;
}
```

**Events:**
```
download:started     → Download initiated
download:progress    → Progress update (every 1%)
download:complete    → Download finished
download:error       → Download failed
download:cancelled   → User cancelled

player:sync          → Sync play state across tabs
library:updated      → Library changed (new media)
```

---

### 3. **File Storage Pattern**

```
/app/media/                      # Media root
├── audio/                       # Audio files
│   ├── abc123.mp3
│   ├── def456.mp3
│   └── ghi789.mp3
├── video/                       # Video files
│   ├── video123.mp4
│   └── video456.mp4
├── thumbnails/                  # Cached thumbnails
│   ├── abc123.jpg
│   └── def456.jpg
└── temp/                        # Temporary downloads
    └── download-xyz.tmp
```

**Naming Convention:**
```typescript
function generateFilename(youtubeId: string, format: string): string {
  const hash = crypto.createHash('sha256')
    .update(youtubeId)
    .digest('hex')
    .substring(0, 12);
  
  return `${hash}.${format}`; // e.g., abc123def456.mp3
}
```

**Storage Service Pattern:**
```typescript
class StorageService {
  private readonly mediaDir = '/app/media';
  
  async saveFile(tempPath: string, filename: string): Promise<string> {
    const finalPath = path.join(this.mediaDir, 'audio', filename);
    await fs.promises.rename(tempPath, finalPath);
    return finalPath;
  }
  
  async deleteFile(filename: string): Promise<void> {
    const filePath = path.join(this.mediaDir, 'audio', filename);
    await fs.promises.unlink(filePath);
  }
  
  getFileStream(filename: string): ReadStream {
    const filePath = path.join(this.mediaDir, 'audio', filename);
    return fs.createReadStream(filePath);
  }
}
```

---

## 🔒 Security Patterns

### 1. **Input Validation Pattern**

```typescript
// Use Zod for validation
import { z } from 'zod';

const createMediaSchema = z.object({
  youtubeUrl: z.string().url().includes('youtube.com'),
  title: z.string().min(1).max(200),
  artist: z.string().max(100).optional(),
  format: z.enum(['mp3', 'mp4', 'webm'])
});

// Middleware
function validateRequest<T>(schema: z.Schema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      res.status(400).json({ error: 'Validation failed', details: error });
    }
  };
}

// Usage
router.post('/downloads', 
  validateRequest(createMediaSchema),
  downloadController.create
);
```

---

### 2. **Path Traversal Prevention**

```typescript
// ❌ BAD - vulnerable to path traversal
router.get('/media/:filename', (req, res) => {
  const filePath = `/app/media/${req.params.filename}`;
  res.sendFile(filePath); // Can access ../../../etc/passwd
});

// ✅ GOOD - safe path handling
router.get('/media/:filename', (req, res) => {
  const filename = path.basename(req.params.filename); // Remove path
  const filePath = path.join('/app/media', filename);
  
  // Verify it's in media directory
  if (!filePath.startsWith('/app/media/')) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  res.sendFile(filePath);
});
```

---

### 3. **Error Handling Pattern**

```typescript
// Custom error classes
class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
  }
}

class NotFoundError extends AppError {
  constructor(message: string) {
    super(404, message);
  }
}

class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message);
  }
}

// Global error handler
function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      status: 'error',
      message: error.message
    });
  }
  
  // Unknown error - don't leak details
  console.error('Unknown error:', error);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  });
}
```

---

## ⚡ Performance Patterns

### 1. **Database Query Optimization**

```typescript
// ❌ BAD - N+1 query problem
async function getPlaylistsWithMedia() {
  const playlists = await prisma.playlist.findMany();
  
  for (const playlist of playlists) {
    playlist.media = await prisma.media.findMany({
      where: { playlists: { some: { playlistId: playlist.id } } }
    }); // N queries!
  }
  
  return playlists;
}

// ✅ GOOD - use include for eager loading
async function getPlaylistsWithMedia() {
  return prisma.playlist.findMany({
    include: {
      media: {
        include: { media: true }
      }
    }
  }); // Single query with joins!
}
```

---

### 2. **Streaming Pattern (Range Requests)**

```typescript
// Support seeking in audio/video
router.get('/media/:filename', (req, res) => {
  const filePath = getSecureFilePath(req.params.filename);
  const stat = fs.statSync(filePath);
  const range = req.headers.range;
  
  if (range) {
    // Parse range header
    const [start, end] = range
      .replace(/bytes=/, '')
      .split('-')
      .map(Number);
    
    const chunkSize = (end || stat.size - 1) - start + 1;
    
    // Stream only requested range
    const stream = fs.createReadStream(filePath, { start, end });
    
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end || stat.size - 1}/${stat.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'audio/mpeg'
    });
    
    stream.pipe(res);
  } else {
    // Stream entire file
    res.writeHead(200, {
      'Content-Length': stat.size,
      'Content-Type': 'audio/mpeg'
    });
    
    fs.createReadStream(filePath).pipe(res);
  }
});
```

---

### 3. **Frontend Performance Patterns**

```typescript
// Virtual scrolling for large lists
import { FixedSizeList } from 'react-window';

export function LibraryList({ items }: { items: Media[] }) {
  return (
    <FixedSizeList
      height={600}
      width="100%"
      itemCount={items.length}
      itemSize={80}
    >
      {({ index, style }) => (
        <div style={style}>
          <MediaCard media={items[index]} />
        </div>
      )}
    </FixedSizeList>
  );
}

// Memoization
export const MediaCard = memo(({ media }: { media: Media }) => {
  return <div>{media.title}</div>;
}, (prev, next) => prev.media.id === next.media.id);

// Debounced search
export function SearchBar() {
  const search = useDebounce((query: string) => {
    api.search(query);
  }, 300);
  
  return <input onChange={(e) => search(e.target.value)} />;
}
```

---

## 🧪 Testing Architecture

### 1. **Test Pyramid**

```
        ┌────────────┐
        │   E2E (5%) │  ← Full user flows
        ├────────────┤
        │ Integration│  ← API + DB + Services
        │   (20%)    │
        ├────────────┤
        │   Unit     │  ← Individual functions
        │   (75%)    │
        └────────────┘
```

### 2. **Testing Patterns**

```typescript
// Unit test - isolated
describe('MediaService', () => {
  it('should find media by id', async () => {
    const mockPrisma = {
      media: { findUnique: jest.fn().mockResolvedValue(mockMedia) }
    };
    
    const service = new MediaService(mockPrisma);
    const result = await service.getById('123');
    
    expect(result).toEqual(mockMedia);
  });
});

// Integration test - with database
describe('Media API', () => {
  it('should return media list', async () => {
    await prisma.media.create({ data: mockMedia });
    
    const response = await request(app).get('/api/media');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
  });
});

// E2E test - full flow
describe('Play Media Flow', () => {
  it('should play media from library', async () => {
    await page.goto('/library');
    await page.click('[data-testid="media-card-1"]');
    await page.click('[data-testid="play-button"]');
    
    const isPlaying = await page.$eval('[data-testid="player"]', 
      el => !el.paused
    );
    
    expect(isPlaying).toBe(true);
  });
});
```

---

## 📦 Deployment Architecture

### 1. **Environment Configuration**

```bash
# .env.development
NODE_ENV=development
DATABASE_URL=postgresql://admin:password@localhost:5432/media_player_dev
MEDIA_PATH=/app/media
PORT=3000

# .env.production
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@postgres:5432/media_prod
MEDIA_PATH=/app/media
PORT=3000
```

### 2. **Docker Compose Profiles**

```yaml
# Development profile
docker-compose --profile dev up

# Production profile
docker-compose --profile prod up

# Testing profile
docker-compose --profile test up
```

---

## 🎯 Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Database** | PostgreSQL | Full-text search, JSON support, reliability |
| **State Management** | Zustand | Simpler than Redux, better than Context |
| **Backend Framework** | Express | Simple, flexible, TypeScript support |
| **ORM** | Prisma | Type-safe, great DX, migrations |
| **Containerization** | Docker Compose | Multi-container, easy orchestration |
| **Download Library** | ytdl-core → yt-dlp | Start simple, upgrade if needed |
| **Real-time** | Socket.io | WebSocket + fallbacks, room support |
| **Frontend Build** | Vite | Fast HMR, modern, optimized |
| **Media Format** | MP3 (audio) | Universal support, good compression |

---

## 🔄 Evolution Strategy

### Phase 1-3: MVP
- Monolithic services (one backend, one frontend)
- Shared volumes for simplicity
- Basic error handling

### Phase 4-6: Optimization
- Add Redis for caching (optional)
- Implement queue service for downloads
- Add monitoring (Prometheus + Grafana)

### Phase 7+: Advanced Features
- Multi-user support (authentication)
- Separate download service
- CDN for media delivery (if hosted)

---

## ✅ Architecture Checklist

Before implementing any feature, verify:

- [ ] Does it work offline? (except downloads)
- [ ] Is business logic in service layer?
- [ ] Are components small and focused?
- [ ] Is data validated at API boundary?
- [ ] Are file paths sanitized?
- [ ] Is the database query optimized?
- [ ] Are errors handled gracefully?
- [ ] Is state management appropriate?
- [ ] Are types defined end-to-end?
- [ ] Is it testable?

---

## 📚 Related Instructions

- **Frontend:** `.github/instructions/frontend.instructions.md`
- **Backend:** `.github/instructions/backend.instructions.md`
- **Database:** `.github/instructions/database.instructions.md`
- **Docker:** `.github/instructions/docker.instructions.md`
- **Player:** `.github/instructions/player.instructions.md`

---

**When to Reference:**
- ✅ Before starting any new feature
- ✅ When making cross-cutting changes
- ✅ During architecture reviews
- ✅ When resolving integration issues
- ✅ When adding new services/layers
