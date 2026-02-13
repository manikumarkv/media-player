# Offline Media Player - Project Instructions

## Project Overview
An offline-first media player application that downloads music and videos from YouTube to build a personal library. Users can enjoy full-featured playback without internet dependency once content is downloaded.

**Think of it as**: Spotify/Apple Music for locally stored content.

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **State Management**: React Context API or Zustand for player state
- **Styling**: CSS Modules or Tailwind CSS
- **Player**: HTML5 Audio/Video APIs (native browser support)

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **ORM**: Prisma for PostgreSQL
- **Download Engine**: ytdl-core or yt-dlp wrapper
- **Media Processing**: FFmpeg for audio conversion
- **Real-time**: Socket.io for download progress

### Database
- **Database**: PostgreSQL 15
- **Indexes**: Optimized for playCount, liked, lastPlayedAt, title search
- **Full-text Search**: On title, artist, channel fields

### Infrastructure
- **Containerization**: Docker with docker-compose
- **Services**: 3 containers (frontend/nginx, backend/node, postgres)
- **Volumes**: Persistent storage for media files and database

## Architecture Principles

### Offline-First Design
- All player features MUST work without internet
- Downloads only require internet during the download phase
- Media files stored locally and streamed from backend
- Database queries optimized for fast local access

### Priority Order
1. **Player functionality** (core offline features)
2. **Library management** (playlists, search, favorites)
3. **Download functionality** (YouTube integration)

## Code Standards

### General
- Use TypeScript strict mode in all files
- Prefer async/await over .then() chains
- Use functional programming patterns where appropriate
- Add error handling for all async operations
- Include JSDoc comments for complex functions only

### Frontend (React)
- Use functional components with hooks (NO class components)
- Custom hooks for reusable logic (usePlayer, useQueue, usePlaylist)
- Keep components small and focused (< 200 lines)
- Props destructuring in function signature
- Use TypeScript interfaces for props (export for reuse)
- Lazy load routes and heavy components
- Handle loading and error states for all async operations

Example component structure:
```tsx
interface AudioPlayerProps {
  mediaId: string;
  onPlayEnd?: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
  mediaId, 
  onPlayEnd 
}) => {
  // Component logic
};
```

### Backend (Express + TypeScript)
- Use async/await for all async operations
- Create service layer for business logic (separate from routes)
- Use Prisma for ALL database operations
- Implement proper error middleware
- Return consistent API response format
- Support range requests for media streaming (seeking support)

Example service structure:
```typescript
export class MediaService {
  async getMedia(id: string): Promise<Media> {
    // Service logic
  }
}
```

### Database (Prisma)
- Use Prisma migrations for all schema changes
- Never write raw SQL unless absolutely necessary
- Use transactions for multi-step operations
- Leverage Prisma's type safety
- Include proper indexes in schema

## File Organization

### Backend Structure
```
backend/src/
├── routes/          # Express route handlers
│   ├── media.routes.ts
│   ├── player.routes.ts
│   ├── playlist.routes.ts
│   └── download.routes.ts
├── services/        # Business logic
│   ├── media.service.ts
│   ├── player.service.ts
│   └── youtube.service.ts
├── middleware/      # Express middleware
├── db/             # Prisma schema and migrations
├── types/          # TypeScript type definitions
└── server.ts       # Express app setup
```

### Frontend Structure
```
frontend/src/
├── components/     # React components (grouped by feature)
│   ├── Player/
│   ├── Library/
│   ├── Playlist/
│   └── Common/
├── pages/          # Route components
├── hooks/          # Custom React hooks
├── services/       # API client functions
├── types/          # TypeScript interfaces
└── App.tsx         # Root component
```

## Naming Conventions

### Files
- React components: PascalCase (e.g., `AudioPlayer.tsx`)
- Services: camelCase with `.service.ts` suffix (e.g., `media.service.ts`)
- Routes: camelCase with `.routes.ts` suffix (e.g., `player.routes.ts`)
- Hooks: useCamelCase (e.g., `usePlayer.ts`)
- Types: camelCase with `.types.ts` suffix

### API Endpoints
- RESTful conventions: `/api/resource-name`
- Use plural for collections: `/api/playlists`
- Use IDs in path: `/api/media/:id`
- Use query params for filters: `/api/media?type=audio&liked=true`

### Variables and Functions
- camelCase for variables and functions
- PascalCase for components and classes
- UPPER_SNAKE_CASE for constants
- Prefix boolean variables with `is`, `has`, `should`

## Error Handling

### Frontend
- Show user-friendly error messages via toast/notification
- Log errors to console in development
- Graceful degradation for offline scenarios
- Retry logic for transient network errors

### Backend
- Use centralized error handling middleware
- Return consistent error response format:
```typescript
{
  error: {
    message: "User-friendly message",
    code: "ERROR_CODE",
    details?: any
  }
}
```
- Log all errors with context
- Never expose sensitive data in error responses

## Performance Guidelines

### Frontend
- Virtualize long lists (library view with 1000+ items)
- Debounce search inputs (300ms)
- Lazy load images with placeholder
- Use React.memo for expensive components
- Implement proper loading states (skeleton screens)

### Backend
- Use database indexes for frequently queried fields
- Implement pagination (default 50 items per page)
- Use streaming for large file responses
- Cache frequently accessed data in memory
- Support range requests for media seeking

### Database
- Index: playCount, liked, lastPlayedAt, downloadedAt
- Full-text index on title, artist, channel
- Use EXPLAIN ANALYZE to optimize slow queries
- Batch insert operations when possible

## Security Considerations

### Backend
- Validate all user inputs
- Sanitize file paths to prevent directory traversal
- Use parameterized queries (Prisma handles this)
- Set appropriate CORS policies
- Rate limit download endpoints
- Check file types before saving

### Frontend
- Sanitize user input before display (XSS prevention)
- Validate URLs before passing to backend
- Don't store sensitive data in localStorage
- Use HTTPS in production

## Testing Guidelines

### What to Test
- Player controls (play, pause, seek, volume)
- Playlist operations (create, add, remove, reorder)
- Media streaming with range requests
- Download functionality with progress tracking
- Database queries with various filters
- Error scenarios (network failures, corrupt files)

### What NOT to Test
- Third-party library internals
- Simple getter/setter functions
- Trivial components with no logic

## Docker Best Practices

- Multi-stage builds to reduce image size
- Use alpine images where possible
- Don't run as root user in containers
- Use .dockerignore to exclude unnecessary files
- Health checks for all services
- Named volumes for persistence

## Development Workflow

1. **Plan first**: Use `/plan` for each feature
2. **Create session**: Name sessions per feature (e.g., `/rename player-ui`)
3. **Include context**: Use `@` to include relevant files
4. **Implement**: Write code with Copilot assistance
5. **Review**: Use `/review` before committing
6. **Test**: Verify functionality works as expected

## Common Patterns

### API Response Format
```typescript
// Success
{ data: T, meta?: { page, total, hasMore } }

// Error
{ error: { message: string, code: string } }
```

### React Hook Pattern
```typescript
export const usePlayer = () => {
  const [state, setState] = useState();
  
  // Functions
  const play = useCallback(() => {}, []);
  
  return { state, play };
};
```

### Service Pattern
```typescript
export class MediaService {
  constructor(private prisma: PrismaClient) {}
  
  async findAll(filters: MediaFilters) {
    return this.prisma.media.findMany({
      where: this.buildWhereClause(filters)
    });
  }
}
```

## Important Notes

- **Offline-first**: Player MUST work without internet after downloads
- **No authentication**: Single-user local application
- **Range requests**: Essential for video/audio seeking
- **Error states**: Always show user what's happening
- **Loading states**: Never leave user wondering if something is processing
- **Keyboard shortcuts**: Power users expect them in a media player
- **Performance**: Optimize for large libraries (1000+ items)

## When in Doubt

- Prioritize user experience over technical elegance
- Keep it simple - don't over-engineer
- Make it work offline first
- Ask for clarification if requirements are unclear
