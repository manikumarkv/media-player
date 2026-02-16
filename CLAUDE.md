# YouTube Media Player - Claude Code Instructions

**Project:** Offline-first media player with YouTube download capability
**Tech Stack:** React 19 + Express + PostgreSQL + Docker

## Project Overview

Build a local media player that downloads music/videos from YouTube and plays them offline with full player features (playlists, queue, liked songs, play history).

**Offline-First Philosophy:**
- ALL player features work without internet
- Downloads only require internet during download phase
- Priority: Player > Library Management > Download

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite + Zustand
- **Backend:** Node.js 18+ + Express + TypeScript + Prisma ORM
- **Database:** PostgreSQL 15
- **Infrastructure:** Docker (3 containers: frontend, backend, postgres)
- **Download:** ytdl-core or yt-dlp + FFmpeg
- **Testing:** Jest (backend) + Vitest (frontend) + Playwright (E2E)

## Architecture

### 7-Layer Architecture
1. **Presentation Layer:** React components, UI/UX
2. **State Management:** Zustand stores (player, library, download)
3. **API Client Layer:** Axios with centralized endpoints
4. **API Layer:** Express REST endpoints + Socket.io
5. **Service Layer:** Business logic (media, playlist, download services)
6. **Data Access Layer:** Prisma ORM
7. **Database Layer:** PostgreSQL

### Centralized URL Management (CRITICAL)
Never hardcode URLs! Use shared constants:
- **Routes:** `shared/constants/routes.ts` - Path definitions
- **Endpoints:** `shared/constants/endpoints.ts` - URL builders
- **Socket Events:** `shared/constants/socket-events.ts` - Event names

## Project Structure

```
.
├── frontend/                 # React app (Vite)
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Route pages
│   │   ├── stores/          # Zustand stores
│   │   ├── hooks/           # Custom hooks
│   │   ├── api/             # API client
│   │   └── shared/          # Shared constants
│   ├── Dockerfile
│   └── package.json
│
├── backend/                  # Express API
│   ├── src/
│   │   ├── routes/          # Express routes
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Express middleware
│   │   ├── errors/          # Custom error classes
│   │   └── shared/          # Shared constants
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   └── Dockerfile
│
├── docker-compose.yml       # Multi-container setup
└── bruno/                   # API testing collection
```

## Code Standards

### TypeScript
- **Strict Mode:** All TypeScript strict flags enabled
- **No `any`:** Use explicit types or `unknown`
- **No floating promises:** Always `await` or `void`

### ESLint + Prettier
- **Import Order:** builtin > external > internal > parent > sibling
- **Line Length:** 100 characters
- **Semicolons:** Always
- **Quotes:** Single quotes
- **Trailing Commas:** ES5

### Git Commits
- **Format:** Conventional Commits (`feat:`, `fix:`, `docs:`, etc.)
- **Branches:** `<type>/<ticket>-<description>` (e.g., `feature/123-add-player`)

## Common Tasks

### Adding a New API Endpoint
1. Define route in `shared/constants/routes.ts`
2. Add endpoint builder in `shared/constants/endpoints.ts`
3. Create service method in `services/*.service.ts`
4. Create controller in `controllers/*.controller.ts`
5. Register route in `routes/*.routes.ts`
6. Add validation schema (Zod)
7. Write tests (unit + integration)
8. Add to Bruno collection

### Adding a New React Component
1. Create component in `components/<Name>/<Name>.tsx`
2. Use Zustand for state (if needed)
3. Use centralized endpoints for API calls
4. Add accessibility attributes (ARIA, roles)
5. Write component tests (Vitest + Testing Library)

### Database Migration
1. Update `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name <description>`
3. Run `npx prisma generate` (regenerate client)
4. Update services to use new schema

## Slash Commands

Use these specialized commands for domain-specific tasks:

- `/react` - React 19 frontend development
- `/api` - API architecture and design
- `/debug` - Systematic debugging
- `/db` - PostgreSQL database operations
- `/devops` - Docker and infrastructure
- `/test` - Playwright E2E testing
- `/a11y` - Accessibility compliance
- `/cleanup` - Code cleanup and refactoring
- `/actions` - GitHub Actions workflows
- `/typescript` - Advanced TypeScript patterns
- `/ux` - UX/UI design patterns

## Checklists

Before completing tasks, reference the appropriate checklist:

- **API Endpoint:** `.ai/checklists/api-endpoint.md`
- **React Component:** `.ai/checklists/react-component.md`
- **Database Change:** `.ai/checklists/database-change.md`
- **Feature Complete:** `.ai/checklists/feature-complete.md`

## Detailed Documentation

For comprehensive patterns, see `.github/instructions/`:

- `architecture.instructions.md` - System architecture
- `frontend.instructions.md` - React patterns
- `backend.instructions.md` - Express patterns
- `api-routes.instructions.md` - Centralized routes
- `testing.instructions.md` - Testing strategies
- `security.instructions.md` - Security practices
- `performance.instructions.md` - Optimization
- `docker.instructions.md` - Container setup
- `database.instructions.md` - Prisma/PostgreSQL

## Development Philosophy

1. **Offline-First:** Player features work without internet
2. **Type-Safe:** TypeScript strict mode, no `any`
3. **Test-Driven:** Write tests alongside features
4. **Performance-Conscious:** Optimize from the start
5. **Accessible:** WCAG 2.1 AA compliance
6. **Secure by Default:** Validate inputs, sanitize outputs
7. **Clean Code:** ESLint + Prettier + Conventional Commits
