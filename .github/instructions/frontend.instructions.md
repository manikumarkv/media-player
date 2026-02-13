# Frontend Development Instructions

## Overview
This skill provides expertise for building the React-based frontend of the offline media player application.

## Technology Focus
- React 19 with TypeScript
- Vite build tool
- HTML5 Audio/Video APIs
- CSS Modules or Tailwind CSS
- React Context or Zustand for state management
- **Centralized URL Management** (see `api-routes.instructions.md`)

## Core Responsibilities
1. Build responsive, offline-capable UI
2. Implement media player interface
3. Create playlist and library management UI
4. Handle WebSocket connections for download progress
5. Optimize for performance with large media libraries
6. **Use centralized endpoints - NEVER hardcode API URLs**

---

## Component Architecture

### Component Types

**1. Page Components** (`pages/`)
- Top-level route components
- Fetch data and manage page state
- Pass data to child components
- Examples: `Player.tsx`, `Library.tsx`, `Playlists.tsx`

**2. Feature Components** (`components/<Feature>/`)
- Group related components by feature
- Self-contained functionality
- Examples: `Player/`, `Library/`, `Playlist/`

**3. Common Components** (`components/Common/`)
- Reusable across features
- Examples: `Button`, `Modal`, `SearchBar`, `LoadingSpinner`

### Component Structure Pattern
```tsx
// ComponentName.tsx
import React, { useState, useEffect, useCallback } from 'react';
import styles from './ComponentName.module.css';
import type { ComponentProps } from './ComponentName.types';

export const ComponentName: React.FC<ComponentProps> = ({ 
  prop1, 
  prop2,
  onEvent 
}) => {
  // 1. State hooks
  const [state, setState] = useState<StateType>(initialState);
  
  // 2. Context hooks
  const { someValue } = useContext(SomeContext);
  
  // 3. Custom hooks
  const { data, isLoading } = useCustomHook();
  
  // 4. Effects
  useEffect(() => {
    // Side effects
    return () => {
      // Cleanup
    };
  }, [dependencies]);
  
  // 5. Event handlers (memoized if passed to children)
  const handleClick = useCallback(() => {
    // Handler logic
  }, [dependencies]);
  
  // 6. Render helpers
  const renderItem = (item: Item) => {
    return <div>{item.name}</div>;
  };
  
  // 7. Conditional rendering
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  // 8. Main render
  return (
    <div className={styles.container}>
      {/* JSX */}
    </div>
  );
};

// ComponentName.types.ts
export interface ComponentProps {
  prop1: string;
  prop2: number;
  onEvent?: () => void;
}
```

---

## State Management

### When to Use Different Approaches

**1. Local State (useState)**
- Component-specific state
- Form inputs
- UI toggles (modals, dropdowns)

**2. Context API (useContext)**
- Widely shared state (theme, user preferences)
- Avoid prop drilling
- Medium complexity

**3. Zustand (Recommended for Player)**
- Global player state
- Queue management
- Complex state logic
- Better performance than Context

### Zustand Player Store Example
```typescript
// stores/playerStore.ts
import { create } from 'zustand';
import type { Media } from '../types';

interface PlayerState {
  // State
  currentMedia: Media | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  queue: Media[];
  repeatMode: 'off' | 'one' | 'all';
  shuffleEnabled: boolean;
  
  // Actions
  play: (media: Media) => void;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  addToQueue: (media: Media) => void;
  removeFromQueue: (mediaId: string) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  // Initial state
  currentMedia: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 80,
  queue: [],
  repeatMode: 'off',
  shuffleEnabled: false,
  
  // Actions
  play: (media) => set({ currentMedia: media, isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  seek: (time) => set({ currentTime: time }),
  setVolume: (volume) => set({ volume }),
  addToQueue: (media) => set((state) => ({ 
    queue: [...state.queue, media] 
  })),
  removeFromQueue: (mediaId) => set((state) => ({
    queue: state.queue.filter(m => m.id !== mediaId)
  })),
  toggleShuffle: () => set((state) => ({ 
    shuffleEnabled: !state.shuffleEnabled 
  })),
  cycleRepeat: () => set((state) => ({
    repeatMode: state.repeatMode === 'off' ? 'one' : 
                state.repeatMode === 'one' ? 'all' : 'off'
  })),
}));
```

---

## Custom Hooks

### When to Create Custom Hooks
- Reusable logic across components
- Complex stateful logic
- API calls
- Side effects that need cleanup

### Hook Patterns

**API Hook**
```typescript
// hooks/useMedia.ts
export const useMedia = (filters: MediaFilters) => {
  const [data, setData] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const fetchMedia = async () => {
      try {
        setIsLoading(true);
        const response = await api.getMedia(filters);
        setData(response.data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMedia();
  }, [filters]);
  
  return { data, isLoading, error };
};
```

**Player Hook**
```typescript
// hooks/usePlayer.ts
export const usePlayer = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const store = usePlayerStore();
  
  const play = useCallback(async (media: Media) => {
    if (audioRef.current) {
      audioRef.current.src = `/api/media/${media.id}/stream`;
      await audioRef.current.play();
      store.play(media);
      
      // Track play event
      await api.recordPlay(media.id);
    }
  }, [store]);
  
  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      store.pause();
    }
  }, [store]);
  
  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      store.seek(time);
    }
  }, [store]);
  
  // Setup event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const handleTimeUpdate = () => {
      store.seek(audio.currentTime);
    };
    
    const handleEnded = () => {
      // Play next track
    };
    
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [store]);
  
  return { audioRef, play, pause, seek };
};
```

---

## API Integration

### ⚠️ IMPORTANT: Use Centralized Endpoints

**NEVER hardcode API URLs!** Always import from shared constants:

```typescript
// ✅ CORRECT - Use centralized endpoints
import { endpoints } from '@media-player/shared';

const media = await api.get(endpoints.media.getById('123'));
const playlists = await api.get(endpoints.playlist.list());
```

```typescript
// ❌ WRONG - Hardcoded URLs
const media = await api.get('/api/media/123');
const playlists = await api.get('/api/playlists');
```

**See:** `.github/instructions/api-routes.instructions.md` for full details.

---

### API Client Setup

```typescript
// api/client.ts - Type-safe API client using centralized endpoints
import { endpoints } from '../../../shared/constants/endpoints';
import { SOCKET_EVENTS } from '../../../shared/constants/socket-events';

class ApiClient {
  private async request<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    
    if (!response.ok) {
      throw new ApiError(response.status, await response.text());
    }
    
    return response.json();
  }
  
  // Media API - uses centralized endpoints
  media = {
    list: (query?: { limit?: number; offset?: number; liked?: boolean }) =>
      this.request<Media[]>(endpoints.media.list(query)),
    
    getById: (id: string) =>
      this.request<Media>(endpoints.media.getById(id)),
    
    search: (query: string, filters?: Record<string, any>) =>
      this.request<Media[]>(endpoints.media.search(query, filters)),
    
    liked: () =>
      this.request<Media[]>(endpoints.media.liked()),
    
    frequent: (limit = 20) =>
      this.request<Media[]>(endpoints.media.frequent(limit)),
    
    update: (id: string, data: Partial<Media>) =>
      this.request<Media>(endpoints.media.update(id), {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    
    delete: (id: string) =>
      this.request<void>(endpoints.media.delete(id), { method: 'DELETE' }),
  };
  
  // Playlist API - uses centralized endpoints
  playlist = {
    list: () =>
      this.request<Playlist[]>(endpoints.playlist.list()),
    
    create: (data: CreatePlaylistDto) =>
      this.request<Playlist>(endpoints.playlist.create(), {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    getById: (id: string) =>
      this.request<Playlist>(endpoints.playlist.getById(id)),
    
    addMedia: (playlistId: string, mediaId: string) =>
      this.request<void>(endpoints.playlist.addMedia(playlistId, mediaId), {
        method: 'POST',
      }),
    
    removeMedia: (playlistId: string, mediaId: string) =>
      this.request<void>(endpoints.playlist.removeMedia(playlistId, mediaId), {
        method: 'DELETE',
      }),
  };
  
  // Player API - uses centralized endpoints
  player = {
    play: (id: string) =>
      this.request<void>(endpoints.player.play(id), { method: 'POST' }),
    
    resume: (id: string, position?: number) =>
      this.request<void>(endpoints.player.resume(id, position), { method: 'POST' }),
    
    history: (query?: { limit?: number; offset?: number }) =>
      this.request<PlayHistory[]>(endpoints.player.history(query)),
  };
  
  // Download API - uses centralized endpoints
  download = {
    start: (data: StartDownloadDto) =>
      this.request<Download>(endpoints.download.start(), {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    cancel: (id: string) =>
      this.request<void>(endpoints.download.cancel(id), { method: 'POST' }),
    
    status: (id: string) =>
      this.request<DownloadStatus>(endpoints.download.status(id)),
  };
}

export const api = new ApiClient();
```

### Usage in Components

```typescript
// ✅ CORRECT - Use api client with centralized endpoints
import { api } from '../api/client';

export function LibraryView() {
  const [media, setMedia] = useState<Media[]>([]);
  
  useEffect(() => {
    // Endpoints are type-safe and centralized
    api.media.list({ limit: 50 }).then(setMedia);
  }, []);
  
  const handleLike = async (id: string) => {
    await api.media.update(id, { liked: true });
  };
  
  return <MediaGrid items={media} onLike={handleLike} />;
}
```

### WebSocket for Downloads

```typescript
// api/socket.ts - Socket client using centralized events
import { io, Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from '../../../shared/constants/socket-events';

class SocketService {
  private socket: Socket | null = null;
  
  connect() {
    this.socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:3000');
    
    this.socket.on('connect', () => {
      console.log('Socket connected');
    });
    
    // Use centralized event constants - NEVER hardcode event names!
    this.socket.on(SOCKET_EVENTS.DOWNLOAD.PROGRESS, (data) => {
      // Update download progress
      console.log('Download progress:', data);
    });
    
    this.socket.on(SOCKET_EVENTS.DOWNLOAD.COMPLETE, (data) => {
      // Show success notification
      console.log('Download complete:', data);
    });
    
    this.socket.on(SOCKET_EVENTS.DOWNLOAD.ERROR, (data) => {
      // Show error notification
      console.error('Download error:', data);
    });
  }
  
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
  
  onDownloadProgress(callback: (data: DownloadProgress) => void) {
    this.socket?.on('download:progress', callback);
  }
}

export const ws = new WebSocketService();
```

---

## Performance Optimization

### 1. Code Splitting (Lazy Loading)
```typescript
// App.tsx
import { lazy, Suspense } from 'react';

const Player = lazy(() => import('./pages/Player'));
const Library = lazy(() => import('./pages/Library'));
const Download = lazy(() => import('./pages/Download'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Player />} />
        <Route path="/library" element={<Library />} />
        <Route path="/download" element={<Download />} />
      </Routes>
    </Suspense>
  );
}
```

### 2. List Virtualization
```typescript
// For large lists (1000+ items)
import { FixedSizeList } from 'react-window';

const MediaList: React.FC<{ items: Media[] }> = ({ items }) => {
  const Row = ({ index, style }: any) => (
    <div style={style}>
      <MediaItem media={items[index]} />
    </div>
  );
  
  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={80}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
};
```

### 3. Memoization
```typescript
// Expensive components
const MediaCard = React.memo<MediaCardProps>(({ media }) => {
  return <div>{media.title}</div>;
});

// Expensive calculations
const sortedMedia = useMemo(() => {
  return media.sort((a, b) => b.playCount - a.playCount);
}, [media]);
```

### 4. Debounce Search
```typescript
import { debounce } from 'lodash';

const SearchBar: React.FC = () => {
  const [query, setQuery] = useState('');
  
  const debouncedSearch = useMemo(
    () => debounce((value: string) => {
      // Call API
      api.searchMedia(value);
    }, 300),
    []
  );
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    debouncedSearch(e.target.value);
  };
  
  return <input value={query} onChange={handleChange} />;
};
```

---

## Error Handling

### Error Boundary
```typescript
// components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    
    return this.props.children;
  }
}
```

### API Error Handling
```typescript
const MediaPage: React.FC = () => {
  const { data, error, isLoading } = useMedia(filters);
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error.message} />;
  
  return <MediaGrid media={data} />;
};
```

---

## Styling

### CSS Modules Pattern
```typescript
// Button.module.css
.button {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.button--primary {
  background: #007bff;
  color: white;
}

// Button.tsx
import styles from './Button.module.css';

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', children }) => {
  return (
    <button className={`${styles.button} ${styles[`button--${variant}`]}`}>
      {children}
    </button>
  );
};
```

---

## Testing

### Component Testing
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { AudioPlayer } from './AudioPlayer';

describe('AudioPlayer', () => {
  it('should play media when play button clicked', async () => {
    const media = { id: '1', title: 'Song' };
    render(<AudioPlayer media={media} />);
    
    const playButton = screen.getByRole('button', { name: /play/i });
    fireEvent.click(playButton);
    
    expect(screen.getByText(/playing/i)).toBeInTheDocument();
  });
});
```

---

## Build Configuration

### Vite Config
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          router: ['react-router-dom'],
        },
      },
    },
  },
});
```

---

## Common Pitfalls

### ❌ Don't
- Don't forget to cleanup effects
- Don't pass unstable references to dependencies
- Don't mutate state directly
- Don't forget loading/error states
- Don't over-use Context (performance)

### ✅ Do
- Use useCallback for event handlers passed to children
- Use useMemo for expensive calculations
- Clean up subscriptions and timers
- Handle offline scenarios
- Show visual feedback for all actions
