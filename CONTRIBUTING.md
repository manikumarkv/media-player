# Contributing Guidelines

**Project:** YouTube Media Player - Offline-First Media Library  
**Purpose:** Guide for contributing to the project (human developers + AI agents)  
**Audience:** Developers, GitHub Copilot, Claude, and other AI coding assistants

---

## 🎯 Project Vision

Build an **offline-first media player** that works completely without internet after content is downloaded. Think Spotify/Apple Music, but for locally stored YouTube content.

**Key Principles:**
1. **Offline-first** - Player must work without internet
2. **Docker-first** - Easy deployment anywhere
3. **Type-safe** - TypeScript everywhere
4. **Tested** - All features have tests
5. **Clean architecture** - Separation of concerns

---

## 🚀 Quick Start for Contributors

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Git
- pnpm (recommended) or npm

### Initial Setup

```bash
# Clone repository
git clone <repo-url>
cd downloder

# Install dependencies
cd backend && pnpm install
cd ../frontend && pnpm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Start development
docker-compose up -d

# Run migrations
cd backend && pnpm prisma migrate dev

# Start dev servers
cd backend && pnpm dev
cd frontend && pnpm dev
```

---

## 📋 Before You Start

### 1. Read the Documentation

**Essential reading:**
- `.github/README.md` - Documentation index
- `.github/MVP_FEATURES.md` - What we're building
- `.github/instructions/architecture.instructions.md` - System architecture
- `.github/instructions/[relevant].instructions.md` - Specific area guidelines

**For your task:**
- Frontend work? → Read `frontend.instructions.md` + `react-clean-architecture.instructions.md`
- Backend work? → Read `backend.instructions.md` + `api-standards.instructions.md`
- Database? → Read `database.instructions.md`
- Testing? → Read `testing.instructions.md`

### 2. Check Existing Issues

- Browse open issues for tasks
- Comment on issue to claim it
- Ask questions if requirements unclear

### 3. Follow Git Workflow

See `.github/instructions/git-workflow.instructions.md` for:
- Branch naming conventions
- Commit message format (Conventional Commits)
- PR process

---

## 🤖 For AI Agents (Copilot, Claude, etc.)

### Context Loading Strategy

**Always load these files first:**
```
@.github/instructions/architecture.instructions.md
@.github/MVP_FEATURES.md
@.github/copilot-instructions.md
```

**Then load task-specific instructions:**
```
# Frontend task
@.github/instructions/frontend.instructions.md
@.github/instructions/react-clean-architecture.instructions.md
@.github/instructions/api-routes.instructions.md

# Backend task
@.github/instructions/backend.instructions.md
@.github/instructions/api-standards.instructions.md
@.github/instructions/database.instructions.md

# Full-stack feature
@.github/instructions/frontend.instructions.md
@.github/instructions/backend.instructions.md
@.github/instructions/api-routes.instructions.md
```

### Agent Coordination Patterns

**Single-Agent Tasks:**
- Small bug fixes
- Component creation
- API endpoint implementation
- Test writing
- Documentation updates

**Multi-Agent Tasks (use subtasks):**
- Full-stack features (Frontend agent + Backend agent)
- Database schema changes (Database agent + Migration agent)
- End-to-end features (Multiple specialized agents)

**Agent Handoff Protocol:**
1. **Complete your part** - Finish assigned scope
2. **Document state** - What you did, what's left
3. **Tag next agent** - "Ready for [Backend/Frontend/Testing]"
4. **Provide context** - Link to relevant files/PRs

### Quality Gates (Human Review Required)

**Always require human review for:**
- ✋ Database schema changes (data loss risk)
- ✋ Security-related code (authentication, authorization)
- ✋ Docker configuration changes (deployment impact)
- ✋ Breaking API changes (client compatibility)
- ✋ Performance-critical code (player, streaming)
- ✋ Error handling strategy changes

**AI can proceed without review for:**
- ✅ New UI components (non-critical)
- ✅ Pure functions and utilities
- ✅ Test additions
- ✅ Documentation updates
- ✅ Code refactoring (no behavior change)
- ✅ Linting/formatting fixes

---

## 📂 Project Structure

```
downloder/
├── .github/
│   ├── instructions/        # 21 instruction files
│   ├── copilot/agents/      # 11 specialized agents
│   ├── workflows/           # CI/CD (GitHub Actions)
│   ├── PULL_REQUEST_TEMPLATE.md
│   ├── MVP_FEATURES.md      # What we're building
│   └── README.md            # Documentation index
│
├── backend/
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Express middleware
│   │   ├── utils/           # Helper functions
│   │   ├── types/           # TypeScript types
│   │   └── db/              # Prisma schema & migrations
│   ├── tests/               # Backend tests
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # Business logic (NO React)
│   │   ├── stores/          # Zustand stores
│   │   ├── api/             # API client
│   │   ├── utils/           # Pure utilities
│   │   └── types/           # TypeScript types
│   ├── tests/               # Frontend tests
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.ts
│
├── shared/                  # Shared types & constants
│   ├── src/
│   │   ├── types/           # Shared TypeScript types
│   │   └── constants/       # API routes, error codes
│   └── package.json
│
├── docker-compose.yml       # Container orchestration
├── .env.example             # Environment variables template
└── README.md                # User-facing documentation
```

---

## 🎨 Code Style & Standards

### TypeScript

**Strict mode enabled:**
```json
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true
}
```

**Naming conventions:**
```typescript
// Interfaces & Types
interface Media { }
type MediaFilters = { };

// Classes
class MediaService { }

// Functions & variables
function getMedia() { }
const currentMedia = null;

// Constants
const MAX_FILE_SIZE = 1024;
const API_BASE_URL = process.env.API_URL;

// Enums
enum MediaType {
  AUDIO = 'audio',
  VIDEO = 'video'
}
```

### React Components

**Functional components only:**
```tsx
// ✅ GOOD
export const MediaCard: React.FC<MediaCardProps> = ({ media }) => {
  return <div>{media.title}</div>;
};

// ❌ BAD - No class components
export class MediaCard extends React.Component { }
```

**File naming:**
```
MediaCard.tsx           # Component
MediaCard.module.css    # CSS Module
MediaCard.types.ts      # Types
MediaCard.test.tsx      # Tests
```

**Component organization:**
```tsx
// 1. Imports
import React from 'react';
import { useMedia } from '@/hooks/useMedia';
import styles from './MediaCard.module.css';

// 2. Types
interface MediaCardProps {
  media: Media;
  onPlay: (media: Media) => void;
}

// 3. Component
export const MediaCard: React.FC<MediaCardProps> = ({ media, onPlay }) => {
  // Hooks
  const { isPlaying } = useMedia();
  
  // Event handlers
  const handleClick = () => onPlay(media);
  
  // Render
  return (
    <div className={styles.card} onClick={handleClick}>
      {media.title}
    </div>
  );
};
```

### Backend Services

**Service layer pattern:**
```typescript
// services/media.service.ts
import { PrismaClient } from '@prisma/client';
import { NotFoundError } from '@/utils/errors';

export class MediaService {
  constructor(private prisma: PrismaClient) {}
  
  async getById(id: string): Promise<Media> {
    const media = await this.prisma.media.findUnique({
      where: { id }
    });
    
    if (!media) {
      throw new NotFoundError('Media', id);
    }
    
    return media;
  }
}
```

**Controller pattern:**
```typescript
// routes/media.routes.ts
import { Router } from 'express';
import { MediaService } from '@/services/media.service';
import { ResponseHelper } from '@/utils/responseHelper';

const router = Router();
const mediaService = new MediaService(prisma);

router.get('/:id', async (req, res) => {
  try {
    const media = await mediaService.getById(req.params.id);
    ResponseHelper.success(res, media);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return ResponseHelper.notFound(res, 'Media', req.params.id);
    }
    throw error;
  }
});
```

---

## ✅ Pre-Commit Checklist

**Before committing, ensure:**

- [ ] Code follows project style (ESLint passes)
- [ ] Code is formatted (Prettier)
- [ ] TypeScript compiles without errors
- [ ] All tests pass
- [ ] New features have tests
- [ ] API changes follow `api-standards.instructions.md`
- [ ] No console.logs (use proper logging)
- [ ] No hardcoded values (use environment variables)
- [ ] No commented-out code
- [ ] Updated relevant documentation
- [ ] Commit message follows Conventional Commits
- [ ] Branch name follows convention

**Husky will automatically check:**
- ✅ ESLint
- ✅ Prettier
- ✅ TypeScript compilation
- ✅ Commit message format

---

## 🧪 Testing Requirements

### Coverage Requirements

- **Minimum:** 70% overall coverage
- **Target:** 80% overall coverage
- **Critical paths:** 90%+ coverage (auth, payments, data loss)

### What to Test

**Backend:**
```typescript
// Services (business logic) - MUST test
describe('MediaService', () => {
  it('should get media by id', async () => {
    const media = await mediaService.getById('123');
    expect(media.id).toBe('123');
  });
  
  it('should throw NotFoundError when media not found', async () => {
    await expect(mediaService.getById('invalid')).rejects.toThrow(NotFoundError);
  });
});

// Routes - SHOULD test
describe('GET /api/media/:id', () => {
  it('should return 200 with media', async () => {
    const response = await request(app).get('/api/media/123');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

**Frontend:**
```typescript
// Hooks - MUST test
describe('useMedia', () => {
  it('should load media on mount', async () => {
    const { result } = renderHook(() => useMedia());
    await waitFor(() => expect(result.current.media).toHaveLength(5));
  });
});

// Components - SHOULD test (critical ones)
describe('MediaCard', () => {
  it('should render media title', () => {
    render(<MediaCard media={mockMedia} />);
    expect(screen.getByText('Test Song')).toBeInTheDocument();
  });
});
```

**Utilities - MUST test:**
```typescript
describe('formatDuration', () => {
  it('should format seconds to MM:SS', () => {
    expect(formatDuration(90)).toBe('1:30');
  });
});
```

---

## 🔄 Pull Request Process

### 1. Create PR

**Use the template:**
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Checklist
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No console.logs
- [ ] Follows code style

## Related Issues
Closes #123
```

### 2. PR Title Format

Follow Conventional Commits:
```
feat(player): add shuffle functionality
fix(api): handle null values in media response
docs(readme): update setup instructions
refactor(frontend): extract media card logic to service
```

### 3. Review Process

**For human contributors:**
- At least 1 approval required
- All checks must pass (CI/CD)
- No merge conflicts

**For AI agents:**
- Auto-approve if:
  - ✅ All tests pass
  - ✅ No quality gate violations
  - ✅ Small scope (< 200 lines changed)
- Human review if:
  - ⚠️ Large changes (> 200 lines)
  - ⚠️ Quality gate areas touched
  - ⚠️ Test failures

### 4. Merging

- **Squash and merge** for features (default)
- **Rebase and merge** for bug fixes
- **Merge commit** for releases only

---

## 🚨 Common Pitfalls

### ❌ Don't Do This

**1. Hardcode URLs:**
```typescript
// ❌ BAD
const media = await fetch('/api/media/123');

// ✅ GOOD
import { endpoints } from '@media-player/shared';
const media = await api.get(endpoints.media.getById('123'));
```

**2. Business logic in components:**
```typescript
// ❌ BAD
const MediaLibrary = () => {
  const filtered = media.filter(m => 
    m.title.toLowerCase().includes(search.toLowerCase())
  );
};

// ✅ GOOD
const MediaLibrary = () => {
  const { media } = useMedia({ search });
};
```

**3. Direct database access from routes:**
```typescript
// ❌ BAD
router.get('/', async (req, res) => {
  const media = await prisma.media.findMany();
  res.json(media);
});

// ✅ GOOD
router.get('/', async (req, res) => {
  const media = await mediaService.getAll();
  ResponseHelper.success(res, media);
});
```

**4. Ignoring TypeScript errors:**
```typescript
// ❌ BAD
const media: any = await getMedia();
// @ts-ignore
media.unknownProperty = 'value';

// ✅ GOOD
const media: Media = await getMedia();
```

**5. No error handling:**
```typescript
// ❌ BAD
const downloadVideo = async (url: string) => {
  const video = await ytdl(url);
  return video;
};

// ✅ GOOD
const downloadVideo = async (url: string): Promise<Video> => {
  try {
    const video = await ytdl(url);
    return video;
  } catch (error) {
    logger.error('Download failed', { url, error });
    throw new DownloadError('Failed to download video', { url });
  }
};
```

---

## 🎓 Learning Resources

**Project-specific:**
- All instruction files in `.github/instructions/`
- MVP features in `.github/MVP_FEATURES.md`
- Architecture diagrams in documentation

**External:**
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React Documentation](https://react.dev/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

## 💬 Getting Help

**For human contributors:**
1. Check existing documentation first
2. Search issues for similar questions
3. Ask in project discussions
4. Create issue with `question` label

**For AI agents:**
1. Load relevant instruction files
2. Check similar implementations in codebase
3. Refer to MVP_FEATURES.md for requirements
4. Flag for human review if uncertain

---

## 🎯 Contribution Priorities

**Phase 1 (Current) - Core Features:**
1. Media player implementation
2. Library management
3. Playlist functionality
4. Search and filtering
5. Player controls

**Phase 2 - Enhanced Features:**
1. Bulk downloads
2. Queue management
3. Keyboard shortcuts
4. Notifications

**Phase 3 - Polish:**
1. USB export
2. Themes
3. Advanced features

See `.github/MVP_FEATURES.md` for complete roadmap.

---

## 📜 License

This project is licensed under the MIT License - see LICENSE file for details.

---

## 🙏 Code of Conduct

**Be respectful:**
- Provide constructive feedback
- Help others learn
- Welcome newcomers
- Celebrate successes

**For AI agents:**
- Follow all instruction files
- Document your work clearly
- Flag issues for human review
- Don't introduce breaking changes without approval

---

**Thank you for contributing!** 🎉

Whether you're human or AI, your contributions make this project better. Happy coding!

---

**When to Reference:**
- ✅ Before starting any work
- ✅ When submitting PRs
- ✅ When onboarding new contributors (human or AI)
- ✅ When unsure about conventions

**Related Files:**
- `.github/instructions/git-workflow.instructions.md` - Git conventions
- `.github/instructions/code-quality.instructions.md` - Code standards
- `.github/instructions/testing.instructions.md` - Testing requirements
- `.github/MVP_FEATURES.md` - What we're building

---

**End of Contributing Guidelines**
