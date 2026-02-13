# Database and API Instructions

## Overview
PostgreSQL database with Prisma ORM provides fast, reliable data management for the media library, playlists, and play history. All queries must be optimized for offline performance with large datasets.

## Database Schema Principles

### Normalization
- Follow 3rd normal form
- Avoid data duplication
- Use foreign keys for relationships
- Cascade deletes where appropriate

### Indexing Strategy
Index fields that are:
- Frequently queried (playCount, liked, lastPlayedAt)
- Used in WHERE clauses
- Used in ORDER BY clauses
- Foreign keys

### Performance
- Design for 10,000+ media items
- Optimize queries with EXPLAIN ANALYZE
- Use pagination (limit/offset or cursor-based)
- Implement full-text search for instant results

## Prisma Schema

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
  previewFeatures = ["fullTextSearch"]
}

model Media {
  id            String   @id @default(uuid())
  title         String
  artist        String?  
  album         String?  
  youtubeId     String?  @unique
  type          String   // 'video' | 'audio'
  duration      Int      // seconds
  thumbnail     String?  // local path
  filePath      String   @unique
  fileSize      BigInt
  quality       String?  // '1080p', '720p', etc.
  channel       String?
  downloadedAt  DateTime @default(now())
  playCount     Int      @default(0)
  liked         Boolean  @default(false)
  lastPlayedAt  DateTime?
  
  playHistory   PlayHistory[]
  playlistMedia PlaylistMedia[]
  
  @@index([liked])
  @@index([playCount])
  @@index([downloadedAt])
  @@index([lastPlayedAt])
  @@index([type])
  @@fulltext([title, artist, channel])
}

model Playlist {
  id            String   @id @default(uuid())
  name          String
  description   String?
  thumbnail     String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  trackCount    Int      @default(0)
  duration      Int      @default(0) // total seconds
  
  playlistMedia PlaylistMedia[]
  
  @@index([createdAt])
}

model PlaylistMedia {
  id          String   @id @default(uuid())
  playlistId  String
  mediaId     String
  position    Int
  addedAt     DateTime @default(now())
  
  playlist    Playlist @relation(fields: [playlistId], references: [id], onDelete: Cascade)
  media       Media    @relation(fields: [mediaId], references: [id], onDelete: Cascade)
  
  @@unique([playlistId, mediaId])
  @@index([playlistId, position])
}

model PlayHistory {
  id            String   @id @default(uuid())
  mediaId       String
  playedAt      DateTime @default(now())
  duration      Int      // seconds actually played
  completedPlay Boolean  @default(false)
  
  media         Media    @relation(fields: [mediaId], references: [id], onDelete: Cascade)
  
  @@index([mediaId])
  @@index([playedAt])
}

model Settings {
  id    String @id @default(uuid())
  key   String @unique
  value String
}
```

## API Design Principles

### RESTful Conventions
- Use HTTP methods semantically (GET, POST, PUT, DELETE)
- Resource-based URLs: `/api/media`, `/api/playlists`
- Plural nouns for collections
- IDs in URL path: `/api/media/:id`
- Query params for filtering: `/api/media?type=audio&liked=true`

### Response Format
**Success (Single Resource):**
```typescript
{
  data: {
    id: "123",
    title: "Song Title",
    // ... other fields
  }
}
```

**Success (Collection):**
```typescript
{
  data: [
    { id: "1", title: "Item 1" },
    { id: "2", title: "Item 2" }
  ],
  meta: {
    page: 1,
    perPage: 50,
    total: 150,
    hasMore: true
  }
}
```

**Error:**
```typescript
{
  error: {
    message: "Media not found",
    code: "MEDIA_NOT_FOUND",
    details?: any
  }
}
```

### Status Codes
- `200 OK`: Successful GET, PUT, DELETE
- `201 Created`: Successful POST
- `204 No Content`: Successful DELETE (no body)
- `400 Bad Request`: Invalid input
- `404 Not Found`: Resource doesn't exist
- `500 Internal Server Error`: Server error

## API Endpoints Specification

### Media Endpoints

#### List Media
```
GET /api/media?page=1&perPage=50&type=audio&liked=true&search=query&sort=playCount&order=desc

Query Params:
  - page (number, default: 1)
  - perPage (number, default: 50, max: 100)
  - type ('audio' | 'video')
  - liked (boolean)
  - search (string) - full-text search
  - sort ('title' | 'playCount' | 'downloadedAt' | 'lastPlayedAt')
  - order ('asc' | 'desc')

Response: { data: Media[], meta: PaginationMeta }
```

#### Get Single Media
```
GET /api/media/:id

Response: { data: Media }
```

#### Stream Media
```
GET /api/media/:id/stream

Headers:
  Range: bytes=0-1024 (optional)

Response:
  Status: 200 (full) or 206 (partial)
  Content-Type: audio/mpeg or video/mp4
  Accept-Ranges: bytes
  Content-Length: <size>
  Content-Range: bytes 0-1024/5242880
```

#### Record Play Event
```
POST /api/media/:id/play

Body: {
  duration: number,        // seconds played
  completedPlay: boolean   // finished track?
}

Response: { data: { success: true } }
```

#### Toggle Like
```
POST /api/media/:id/like

Response: { data: { liked: boolean } }
```

#### Delete Media
```
DELETE /api/media/:id

Response: 204 No Content
```

#### Get Favorites
```
GET /api/media/favorites?page=1&perPage=50

Response: { data: Media[], meta: PaginationMeta }
```

#### Get Frequently Played
```
GET /api/media/frequently-played?limit=20

Response: { data: Media[] }
```

#### Get Recently Played
```
GET /api/media/recent?limit=20

Response: { data: Media[] }
```

### Playlist Endpoints

#### List Playlists
```
GET /api/playlists

Response: { data: Playlist[] }
```

#### Get Playlist with Tracks
```
GET /api/playlists/:id

Response: { 
  data: {
    ...Playlist,
    tracks: Media[]  // Ordered by position
  }
}
```

#### Create Playlist
```
POST /api/playlists

Body: {
  name: string,
  description?: string
}

Response: { data: Playlist }
```

#### Update Playlist
```
PUT /api/playlists/:id

Body: {
  name?: string,
  description?: string
}

Response: { data: Playlist }
```

#### Delete Playlist
```
DELETE /api/playlists/:id

Response: 204 No Content
```

#### Add Track to Playlist
```
POST /api/playlists/:id/tracks

Body: {
  mediaId: string,
  position?: number  // Optional, defaults to end
}

Response: { data: PlaylistMedia }
```

#### Remove Track from Playlist
```
DELETE /api/playlists/:id/tracks/:mediaId

Response: 204 No Content
```

#### Reorder Playlist Tracks
```
PUT /api/playlists/:id/tracks/reorder

Body: {
  updates: [
    { mediaId: string, position: number }
  ]
}

Response: { data: { success: true } }
```

## Service Layer Implementation

### Structure
```typescript
// media.service.ts
export class MediaService {
  constructor(private prisma: PrismaClient) {}

  async findAll(filters: MediaFilters): Promise<PaginatedResult<Media>> {
    const { page, perPage, type, liked, search, sort, order } = filters;
    
    const where = this.buildWhereClause({ type, liked, search });
    const orderBy = this.buildOrderByClause(sort, order);
    
    const [data, total] = await Promise.all([
      this.prisma.media.findMany({
        where,
        orderBy,
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.media.count({ where })
    ]);
    
    return {
      data,
      meta: {
        page,
        perPage,
        total,
        hasMore: page * perPage < total
      }
    };
  }

  async findById(id: string): Promise<Media> {
    const media = await this.prisma.media.findUnique({
      where: { id }
    });
    
    if (!media) {
      throw new NotFoundError('Media not found');
    }
    
    return media;
  }

  async recordPlay(id: string, duration: number, completedPlay: boolean): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.playHistory.create({
        data: {
          mediaId: id,
          duration,
          completedPlay
        }
      }),
      this.prisma.media.update({
        where: { id },
        data: {
          playCount: { increment: 1 },
          lastPlayedAt: new Date()
        }
      })
    ]);
  }

  async toggleLike(id: string): Promise<boolean> {
    const media = await this.findById(id);
    
    const updated = await this.prisma.media.update({
      where: { id },
      data: { liked: !media.liked }
    });
    
    return updated.liked;
  }

  async delete(id: string): Promise<void> {
    const media = await this.findById(id);
    
    // Delete file from filesystem
    await fs.unlink(media.filePath);
    
    // Delete from database (cascade handles relations)
    await this.prisma.media.delete({
      where: { id }
    });
  }

  private buildWhereClause(filters: any): Prisma.MediaWhereInput {
    const where: Prisma.MediaWhereInput = {};
    
    if (filters.type) where.type = filters.type;
    if (filters.liked !== undefined) where.liked = filters.liked;
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { artist: { contains: filters.search, mode: 'insensitive' } },
        { channel: { contains: filters.search, mode: 'insensitive' } }
      ];
    }
    
    return where;
  }

  private buildOrderByClause(sort?: string, order?: string): Prisma.MediaOrderByWithRelationInput {
    if (!sort) return { downloadedAt: 'desc' };
    
    return { [sort]: order || 'desc' };
  }
}
```

## Optimization Techniques

### Pagination
Always paginate large datasets:
```typescript
const skip = (page - 1) * perPage;
const take = perPage;

await prisma.media.findMany({ skip, take });
```

### Eager Loading
Load related data in one query:
```typescript
await prisma.playlist.findUnique({
  where: { id },
  include: {
    playlistMedia: {
      include: { media: true },
      orderBy: { position: 'asc' }
    }
  }
});
```

### Batching
Use transactions for multiple operations:
```typescript
await prisma.$transaction([
  prisma.media.update(...),
  prisma.playHistory.create(...)
]);
```

### Full-Text Search
Use PostgreSQL full-text search:
```typescript
await prisma.media.findMany({
  where: {
    OR: [
      { title: { search: query } },
      { artist: { search: query } }
    ]
  }
});
```

### Caching (Optional)
Cache frequently accessed data:
```typescript
const cache = new Map<string, Media>();

async getCachedMedia(id: string): Promise<Media> {
  if (cache.has(id)) {
    return cache.get(id)!;
  }
  
  const media = await this.findById(id);
  cache.set(id, media);
  return media;
}
```

## Error Handling

### Custom Error Classes
```typescript
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

### Error Middleware
```typescript
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  
  if (err instanceof NotFoundError) {
    return res.status(404).json({
      error: {
        message: err.message,
        code: 'NOT_FOUND'
      }
    });
  }
  
  if (err instanceof ValidationError) {
    return res.status(400).json({
      error: {
        message: err.message,
        code: 'VALIDATION_ERROR'
      }
    });
  }
  
  res.status(500).json({
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }
  });
});
```

## Testing Database Operations

### Setup Test Database
```typescript
beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await prisma.media.deleteMany();
  await prisma.playlist.deleteMany();
});
```

### Test Cases
```typescript
describe('MediaService', () => {
  it('should find media by id', async () => {
    const media = await service.findById('123');
    expect(media.id).toBe('123');
  });

  it('should throw error if media not found', async () => {
    await expect(service.findById('invalid')).rejects.toThrow(NotFoundError);
  });

  it('should record play event', async () => {
    await service.recordPlay('123', 180, true);
    const media = await service.findById('123');
    expect(media.playCount).toBe(1);
  });
});
```

## Migration Strategy

### Creating Migrations
```bash
npx prisma migrate dev --name init
npx prisma migrate dev --name add_fulltext_search
```

### Running Migrations in Docker
```bash
# In Dockerfile CMD
npx prisma migrate deploy && node dist/server.js
```

### Rollback (if needed)
```bash
npx prisma migrate resolve --rolled-back <migration-name>
```

## Common Pitfalls

### ❌ Don't
- Don't use `findMany` without pagination
- Don't fetch all relations by default
- Don't write raw SQL without proper escaping
- Don't forget indexes on foreign keys
- Don't expose database errors to client

### ✅ Do
- Use transactions for multi-step operations
- Leverage Prisma's type safety
- Add proper error handling
- Log slow queries
- Use connection pooling

## Performance Checklist
- [ ] All foreign keys have indexes
- [ ] Frequently queried fields have indexes
- [ ] Full-text search configured for title/artist
- [ ] Pagination implemented for all list endpoints
- [ ] Eager loading used appropriately
- [ ] Database connection pooling enabled
- [ ] Slow queries logged and optimized
