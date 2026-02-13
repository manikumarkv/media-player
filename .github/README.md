# 📚 Copilot Instructions & Setup

This directory contains all custom instructions and configurations for GitHub Copilot CLI.

---

## 📊 Summary

- **Total Instructions**: 28 files (~450KB)
- **Total Agents**: 11 agents (~76KB)
- **Core Architecture**: 6 files (architecture, API routes, API standards, Docker, database, cross-platform)
- **Development Patterns**: 6 files (frontend, backend, player, download, UX design, React clean architecture)
- **Process & Coordination**: 4 files (contributing, environment config, agentic coordination, git workflow)
- **Tooling & Quality**: 7 files (testing, CI/CD, security, error handling, performance, API testing, code quality)
- **Advanced Features**: 5 files (monitoring, feature flags, OpenAPI, i18n, analytics)

---

## 📂 Instruction Files

### Core Architecture
- `architecture.instructions.md` (29KB) - 7-layer architecture, offline-first patterns
- `api-routes.instructions.md` (22KB) - Centralized endpoint management (shared FE/BE)
- `api-standards.instructions.md` (27KB) ⭐ NEW - Response structures, HTTP status codes, error codes
- `docker.instructions.md` (13KB) - Multi-container setup, volumes, networking
- `database.instructions.md` (13KB) - Prisma schema, migrations, query patterns
- `cross-platform.instructions.md` (16KB) - Windows/macOS/Linux compatibility

### Development Patterns
- `frontend.instructions.md` (17KB) - React 19, Zustand, hooks, API client
- `backend.instructions.md` (26KB) - Express, services, middleware, WebSockets
- `player.instructions.md` (8.3KB) - HTML5 Audio/Video APIs, queue management
- `download.instructions.md` (10KB) - YouTube download with ytdl-core/yt-dlp
- `ux-design.instructions.md` (26KB) - 3 personas, 4 user journeys, Mermaid flows
- `react-clean-architecture.instructions.md` (38KB) ⭐ NEW - Business logic separation, layered architecture

### Process & Coordination
- `agentic-coordination.instructions.md` (19KB) ⭐ NEW - Multi-agent workflows, task decomposition, quality gates
- `environment-config.instructions.md` (16KB) ⭐ NEW - .env setup, deployment targets, secrets management
- `git-workflow.instructions.md` (14KB) - Husky, lint-staged, Conventional Commits
- `code-quality.instructions.md` (16KB) - ESLint, Prettier, TypeScript strict mode

### Tooling & Quality
- `api-testing.instructions.md` (17KB) - Bruno API testing strategy
- `cicd.instructions.md` (6.7KB) - GitHub Actions workflows, automated testing
- `error-handling.instructions.md` (9.5KB) - Error classes, logging, retry logic
- `mermaid-diagrams.instructions.md` (8.5KB) - Visual flows, Copilot @mermAId
- `performance.instructions.md` (11KB) - Audio optimization, React perf, caching
- `security.instructions.md` (7.5KB) - Helmet, rate limiting, input validation
- `testing.instructions.md` (6.4KB) - Jest/Vitest setup, test patterns, coverage

### Advanced Features (Post-MVP)
- `monitoring-observability.instructions.md` (19KB) ⭐ NEW - Logging, metrics, tracing, alerting
- `feature-flags.instructions.md` (18KB) ⭐ NEW - Feature toggles, gradual rollouts
- `openapi-swagger.instructions.md` (12KB) ⭐ NEW - API documentation generation
- `i18n.instructions.md` (18KB) ⭐ NEW - Internationalization, multi-language support
- `analytics.instructions.md` (20KB) ⭐ NEW - User behavior tracking, telemetry

---

## 🎯 How to Use

### Copilot CLI Auto-loads Instructions
All `.instructions.md` files in this directory are **automatically recognized** by GitHub Copilot CLI.

```bash
# Working on frontend? Copilot loads:
# - frontend.instructions.md
# - architecture.instructions.md
# - api-routes.instructions.md

# Working on backend? Copilot loads:
# - backend.instructions.md
# - api-routes.instructions.md
# - database.instructions.md

# Working on Docker? Copilot loads:
# - docker.instructions.md
```

### Loading Specific Instructions
```bash
# Load by task type
gh copilot explain "this component"  # Auto-loads relevant instructions

# Context-aware help
gh copilot suggest "add error handling"  # Uses error-handling.instructions.md
```

---

## 📝 When to Reference Which File

| Task | Primary File | Supporting Files |
|------|-------------|------------------|
| **React Components** | `frontend.instructions.md` | `react-clean-architecture.md`, `architecture.md`, `performance.md` |
| **API Endpoints** | `backend.instructions.md` | `api-standards.md`, `api-routes.md`, `security.md`, `error-handling.md` |
| **API Responses** | `api-standards.instructions.md` | `backend.md`, `error-handling.md` |
| **API Documentation** | `openapi-swagger.instructions.md` | `api-standards.md`, `backend.md` |
| **Media Player** | `player.instructions.md` | `frontend.md`, `performance.md` |
| **Database Queries** | `database.instructions.md` | `backend.md`, `performance.md` |
| **Docker Setup** | `docker.instructions.md` | `architecture.md` |
| **YouTube Download** | `download.instructions.md` | `backend.md`, `error-handling.md` |
| **Multi-language Support** | `i18n.instructions.md` | `frontend.md`, `backend.md` |
| **User Analytics** | `analytics.instructions.md` | `monitoring-observability.md` |
| **Feature Rollouts** | `feature-flags.instructions.md` | `backend.md`, `frontend.md` |
| **Production Monitoring** | `monitoring-observability.instructions.md` | `backend.md`, `performance.md` |
| **Testing** | `testing.instructions.md` | All (write tests for everything) |
| **Git Commits** | `git-workflow.instructions.md` | Always (every commit) |
| **CI/CD** | `cicd.instructions.md` | `testing.md`, `security.md` |

---

## 🚀 Quick Start

1. **Phase 1: Project Setup**
   - Reference: `docker.md`, `code-quality.md`, `git-workflow.md`
   - Initialize projects, setup linters, configure Husky

2. **Phase 2: Backend Development**
   - Reference: `backend.md`, `database.md`, `api-routes.md`
   - Build API endpoints, database schema, WebSocket handlers

3. **Phase 3: Frontend Development**
   - Reference: `frontend.md`, `player.md`, `api-routes.md`
   - Build UI components, media player, API integration

4. **Phase 4: Testing & Quality**
   - Reference: `testing.md`, `api-testing.md`, `security.md`
   - Write tests, setup Bruno, security hardening

5. **Phase 5: Advanced Features**
   - Reference: `monitoring-observability.md`, `feature-flags.md`, `i18n.md`, `analytics.md`
   - Add logging, feature flags, multi-language support, user tracking

6. **Phase 6: Deployment**
   - Reference: `cicd.md`, `docker.md`
   - Setup GitHub Actions, deploy containers

---

## ✨ Tips

- **Don't memorize** - Instructions are auto-loaded when relevant
- **Stay consistent** - Follow patterns in instruction files
- **Keep updated** - Add new patterns as project evolves
- **Reference often** - Instructions are your single source of truth

---

**Ready to build!** 🎉 All instructions are in place for industry-standard development.
