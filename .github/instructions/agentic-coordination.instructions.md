# Agentic Engineering Coordination Guide

**Project:** YouTube Media Player - AI Agent Coordination  
**Purpose:** Guidelines for multiple AI agents working together on this codebase  
**Audience:** GitHub Copilot, Claude, GPT, and other AI coding assistants

---

## 🎯 What is Agentic Engineering?

**Agentic Engineering** is a development approach where multiple AI agents (or a single agent across multiple sessions) work together to build software, with clear coordination patterns, handoff protocols, and quality gates.

### Key Principles

1. **Autonomous but Coordinated** - Each agent works independently within their scope
2. **Context-Aware** - Agents load relevant documentation before starting
3. **Test-Driven** - All changes must be tested
4. **Incremental** - Small, reviewable changes
5. **Human-in-the-Loop** - Critical decisions require human approval

---

## 🤖 Agent Roles & Responsibilities

### 1. **Architecture Agent**

**Specialty:** System design, patterns, technical decisions  
**Files:** `.github/instructions/architecture.instructions.md`

**Responsibilities:**
- Define system architecture
- Design component interactions
- Choose tech stack patterns
- Review architectural changes
- Ensure offline-first principle

**When to use:**
- Starting new major features
- Refactoring large components
- Changing data flow
- Adding new services

---

### 2. **Frontend Agent**

**Specialty:** React, UI components, client-side logic  
**Files:** `.github/instructions/frontend.instructions.md`, `react-clean-architecture.instructions.md`

**Responsibilities:**
- Build React components
- Implement hooks and stores
- Create UI layouts
- Handle client-side routing
- Integrate with API client

**When to use:**
- Creating new pages/components
- Building player UI
- Implementing search/filter
- Adding animations/transitions

**Handoff to:**
- **Backend Agent** - When API endpoints needed
- **Testing Agent** - For component tests
- **UX Agent** - For design review

---

### 3. **Backend Agent**

**Specialty:** Node.js, Express, APIs, business logic  
**Files:** `.github/instructions/backend.instructions.md`, `api-standards.instructions.md`

**Responsibilities:**
- Build REST API endpoints
- Implement business logic
- Create services
- Handle WebSocket connections
- Integrate with database

**When to use:**
- Creating new API endpoints
- Implementing download logic
- Building streaming service
- Adding background jobs

**Handoff to:**
- **Database Agent** - For schema changes
- **Testing Agent** - For API tests
- **Frontend Agent** - Once API is ready

---

### 4. **Database Agent**

**Specialty:** Prisma, PostgreSQL, schema design  
**Files:** `.github/instructions/database.instructions.md`

**Responsibilities:**
- Design database schema
- Create Prisma migrations
- Optimize queries
- Add indexes
- Handle data migrations

**When to use:**
- Adding new models
- Changing schema
- Optimizing queries
- Creating migrations

**Quality Gates:**
- ⚠️ **REQUIRES HUMAN REVIEW** - All schema changes
- ⚠️ **REQUIRES HUMAN REVIEW** - Data migrations

**Handoff to:**
- **Backend Agent** - After migrations ready
- **Testing Agent** - For database tests

---

### 5. **Testing Agent**

**Specialty:** Unit tests, integration tests, E2E tests  
**Files:** `.github/instructions/testing.instructions.md`, `api-testing.instructions.md`

**Responsibilities:**
- Write unit tests
- Create integration tests
- Build E2E test suites
- Maintain test coverage
- Fix failing tests

**When to use:**
- After any code changes
- Adding new features
- Fixing bugs
- Before merging PRs

**Coverage requirements:**
- Services: 90%+ (business logic)
- Routes: 80%+ (API endpoints)
- Utilities: 95%+ (pure functions)
- Components: 70%+ (critical paths)

---

### 6. **DevOps Agent**

**Specialty:** Docker, CI/CD, deployment  
**Files:** `.github/instructions/docker.instructions.md`, `cicd.instructions.md`

**Responsibilities:**
- Configure Docker containers
- Setup CI/CD pipelines
- Manage deployments
- Monitor services
- Handle infrastructure

**When to use:**
- Updating Dockerfiles
- Modifying CI/CD
- Deployment issues
- Performance problems

**Quality Gates:**
- ⚠️ **REQUIRES HUMAN REVIEW** - Docker config changes
- ⚠️ **REQUIRES HUMAN REVIEW** - CI/CD modifications

---

### 7. **Security Agent**

**Specialty:** Security, validation, authentication  
**Files:** `.github/instructions/security.instructions.md`

**Responsibilities:**
- Review security vulnerabilities
- Add input validation
- Implement rate limiting
- Handle authentication (future)
- Audit dependencies

**When to use:**
- Adding user input
- Exposing new endpoints
- Dependency updates
- Security reviews

**Quality Gates:**
- ⚠️ **REQUIRES HUMAN REVIEW** - All security changes

---

## 🔄 Agent Coordination Patterns

### Pattern 1: Sequential Handoff (Full-Stack Feature)

**Use case:** Building a complete feature (e.g., "Add playlist functionality")

```
1. Architecture Agent
   ↓ (defines structure)
2. Database Agent
   ↓ (creates schema)
3. Backend Agent
   ↓ (builds API)
4. Frontend Agent
   ↓ (builds UI)
5. Testing Agent
   ↓ (adds tests)
6. HUMAN REVIEW
   ↓ (approves merge)
7. DevOps Agent
   (deploys)
```

**Example workflow:**

```markdown
## Task: Add Playlist Creation Feature

### Step 1: Architecture Agent
**Input:** "Design playlist creation feature"
**Output:** 
- Component structure
- API endpoint spec
- Database schema proposal
**Handoff:** → Database Agent (with schema)

### Step 2: Database Agent
**Input:** Schema proposal from Architecture
**Output:**
- Prisma schema updates
- Migration files
- Index additions
**Handoff:** → Backend Agent (with schema ready)

### Step 3: Backend Agent
**Input:** Database schema + API spec
**Output:**
- POST /api/playlists endpoint
- PlaylistService.create()
- Validation middleware
**Handoff:** → Frontend Agent (with API docs)

### Step 4: Frontend Agent
**Input:** API endpoints + component structure
**Output:**
- CreatePlaylistModal component
- usePlaylist() hook
- playlistStore integration
**Handoff:** → Testing Agent (with implementation)

### Step 5: Testing Agent
**Input:** Complete implementation
**Output:**
- Service tests
- API integration tests
- Component tests
**Handoff:** → HUMAN REVIEW

### Step 6: Human Review
**Checks:**
- [ ] All tests pass
- [ ] Code quality good
- [ ] Follows patterns
- [ ] Documentation updated
**Handoff:** → DevOps Agent (if approved)
```

---

### Pattern 2: Parallel Development (Independent Features)

**Use case:** Multiple features that don't conflict

```
         ┌─> Frontend Agent (Player UI)
         │
Task ────┼─> Backend Agent (Download API)
         │
         └─> Database Agent (Add indexes)
         
         ↓ (all complete)
         
    Testing Agent (tests all)
```

**Example:**

```markdown
## Task: Phase 1 MVP Features

### Parallel Track A: Player Controls
- Frontend Agent: Build player bar
- Backend Agent: Add streaming endpoint
- No dependencies, can work in parallel

### Parallel Track B: Search Feature
- Frontend Agent: Build search UI
- Backend Agent: Add search API
- No dependencies, can work in parallel

### Sync Point: Both Complete
- Testing Agent: Test both features
- HUMAN REVIEW: Check integration
```

---

### Pattern 3: Iterative Refinement (Bug Fixing)

**Use case:** Fixing bugs or improving existing code

```
1. Testing Agent
   ↓ (identifies failure)
2. Specialized Agent (Frontend/Backend)
   ↓ (fixes issue)
3. Testing Agent
   ↓ (verifies fix)
4. HUMAN REVIEW (if complex)
```

**Example:**

```markdown
## Task: Fix Search Not Working

### Step 1: Testing Agent
**Reproduces bug:**
- Search for "queen" returns empty
- Expected: 3 results
- Actual: 0 results

### Step 2: Backend Agent (owner of search)
**Diagnosis:**
- SQL query using LIKE without %
- Fix: Add wildcards
**Output:** Fixed query

### Step 3: Testing Agent
**Verifies:**
- Search now returns 3 results
- All other tests still pass
**Handoff:** → HUMAN REVIEW (optional for small fix)
```

---

## 📝 Task Decomposition Guidelines

### Small Task (1 agent, no review)

**Characteristics:**
- ✅ < 100 lines changed
- ✅ Pure functions/utilities
- ✅ Documentation updates
- ✅ Linting fixes
- ✅ No schema changes
- ✅ No breaking changes

**Example:**
```markdown
## Task: Add formatFileSize utility

**Agent:** Frontend Agent
**Scope:** 
- Add function to utils/formatters.ts
- Add unit tests
- Export from index.ts

**Auto-merge:** Yes (if tests pass)
```

---

### Medium Task (2-3 agents, optional review)

**Characteristics:**
- ✅ 100-300 lines changed
- ✅ New component or service
- ✅ New API endpoint
- ✅ No schema changes
- ✅ No quality gates violated

**Example:**
```markdown
## Task: Add "Like" button to media cards

**Agents:**
1. Backend Agent: POST /api/media/:id/like
2. Frontend Agent: Like button component
3. Testing Agent: Tests for both

**Review:** Optional (CI/CD auto-checks)
```

---

### Large Task (4+ agents, requires review)

**Characteristics:**
- ✅ > 300 lines changed
- ✅ Multiple components/services
- ✅ Schema changes
- ✅ Breaking changes
- ✅ Quality gates touched

**Example:**
```markdown
## Task: Implement bulk playlist download

**Agents:**
1. Architecture Agent: Design approach
2. Database Agent: Add download_batch table
3. Backend Agent: Batch download service
4. Frontend Agent: Bulk download UI
5. Testing Agent: E2E tests

**Review:** REQUIRED
- [ ] Schema changes reviewed
- [ ] Performance tested
- [ ] Error handling verified
```

---

## 🎯 Context Management

### What Context to Load

**Always load (every agent):**
```
@.github/copilot-instructions.md
@.github/MVP_FEATURES.md
@.github/instructions/architecture.instructions.md
```

**Task-specific (based on role):**

**Frontend tasks:**
```
@.github/instructions/frontend.instructions.md
@.github/instructions/react-clean-architecture.instructions.md
@.github/instructions/api-routes.instructions.md
@frontend/src/components/
```

**Backend tasks:**
```
@.github/instructions/backend.instructions.md
@.github/instructions/api-standards.instructions.md
@.github/instructions/database.instructions.md
@backend/src/services/
```

**Full-stack tasks:**
```
@.github/instructions/frontend.instructions.md
@.github/instructions/backend.instructions.md
@.github/instructions/api-routes.instructions.md
```

---

### Context Optimization Tips

**For large codebases:**
1. Load only relevant directories
2. Use grep to find related code
3. Check similar implementations first
4. Don't load entire codebase

**Example:**
```bash
# ❌ BAD - Too much context
@frontend/src/

# ✅ GOOD - Specific context
@frontend/src/components/Player/
@frontend/src/hooks/usePlayer.ts
@frontend/src/services/playerService.ts
```

---

## 🚦 Quality Gates (Human Review Required)

### Critical Changes

**ALWAYS require human review:**

1. **Database schema changes**
   - Data loss risk
   - Migration complexity
   - Index changes

2. **Security changes**
   - Authentication/authorization
   - Input validation logic
   - Rate limiting changes

3. **Docker/Infrastructure**
   - Dockerfile changes
   - docker-compose.yml
   - CI/CD pipelines

4. **Breaking API changes**
   - Endpoint renames/removals
   - Response structure changes
   - Status code changes

5. **Performance-critical paths**
   - Media streaming logic
   - Player implementation
   - Database queries with > 1M rows

---

### Auto-Approve Eligible

**Can proceed without review (if tests pass):**

1. **Documentation updates**
2. **New tests** (adding, not changing)
3. **UI components** (non-critical)
4. **Pure utility functions**
5. **Code formatting**
6. **Dependency updates** (minor/patch)
7. **Bug fixes** (< 50 lines, tested)

---

## 📊 Agent Communication Protocol

### Handoff Message Format

```markdown
## Handoff to [Next Agent Name]

**Task:** [Brief description]

**Completed:**
- [x] Item 1
- [x] Item 2
- [x] Item 3

**Files Changed:**
- `path/to/file1.ts` (added)
- `path/to/file2.ts` (modified)

**Context for Next Agent:**
- [Important information]
- [Dependencies or blockers]
- [Any decisions made]

**Next Steps:**
1. [First thing to do]
2. [Second thing to do]

**Testing:**
- [x] Tests pass locally
- [x] No linting errors
- [ ] Needs E2E tests (your task)

**Questions:**
- [Any uncertainties for next agent]

@[next-agent-name] Ready for you!
```

---

### Status Updates

**Agents should update task status regularly:**

```markdown
## Status Update: [Feature Name]

**Progress:** 60% complete

**Completed:**
- [x] Database schema
- [x] API endpoints
- [x] Service layer

**In Progress:**
- [ ] Frontend components (50%)

**Blocked:**
- None

**ETA:** 2 hours
```

---

## 🧪 Testing Requirements for Agents

### Before Handoff

**Every agent must:**

1. **Run tests**
   ```bash
   pnpm test
   ```

2. **Check linting**
   ```bash
   pnpm lint
   ```

3. **Check types**
   ```bash
   pnpm type-check
   ```

4. **Build (if applicable)**
   ```bash
   pnpm build
   ```

5. **Document changes**
   - Update relevant docs
   - Add JSDoc comments
   - Update API docs (if applicable)

---

### Coverage Requirements

**Agents must add tests:**

- **Services:** 90%+ coverage
- **API endpoints:** 80%+ coverage
- **Utilities:** 95%+ coverage
- **Components:** 70%+ (critical paths)

**If coverage drops:**
- ⚠️ Flag for review
- ⚠️ Add tests before merge
- ⚠️ Explain why coverage decreased

---

## 🔍 Code Review Checklist (For Human Reviewers)

### When reviewing agent work:

**Functionality:**
- [ ] Feature works as specified
- [ ] No regressions in existing features
- [ ] Edge cases handled
- [ ] Error handling in place

**Code Quality:**
- [ ] Follows project patterns
- [ ] No code duplication
- [ ] No TODO/FIXME comments
- [ ] No console.logs

**Tests:**
- [ ] Tests pass
- [ ] Coverage adequate
- [ ] Tests meaningful (not just for coverage)
- [ ] E2E tests for critical paths

**Documentation:**
- [ ] Code is self-documenting
- [ ] Complex logic explained
- [ ] API changes documented
- [ ] README updated (if needed)

**Performance:**
- [ ] No N+1 queries
- [ ] No memory leaks
- [ ] Efficient algorithms
- [ ] Appropriate caching

**Security:**
- [ ] Input validated
- [ ] No SQL injection risks
- [ ] No XSS vulnerabilities
- [ ] Secrets not hardcoded

---

## 🚀 Best Practices

### For All Agents

1. **Start small** - Make incremental changes
2. **Test early** - Run tests frequently
3. **Document as you go** - Don't leave for later
4. **Follow patterns** - Check existing implementations
5. **Ask for help** - Flag for review if uncertain
6. **Clean up** - Remove dead code, TODOs
7. **Think offline-first** - Every feature must work offline

---

### For Architecture Agent

1. **Design before coding** - Plan the approach
2. **Consider offline-first** - Core principle
3. **Choose patterns wisely** - Follow existing architecture
4. **Document decisions** - Explain the "why"
5. **Think long-term** - Will this scale?

---

### For Frontend Agent

1. **Separate concerns** - Follow clean architecture
2. **No business logic in components** - Use services
3. **Type everything** - Full TypeScript
4. **Accessible** - Keyboard navigation, ARIA
5. **Responsive** - Mobile-friendly

---

### For Backend Agent

1. **Thin controllers** - Business logic in services
2. **Standard responses** - Use ResponseHelper
3. **Error handling** - Try/catch everywhere
4. **Validate inputs** - Use Zod
5. **Log appropriately** - Errors, warnings, info

---

### For Database Agent

1. **Migrations only** - Never manual schema changes
2. **Add indexes** - For all query fields
3. **Test migrations** - Up and down
4. **Data integrity** - Foreign keys, constraints
5. **Backup before major changes**

---

## 📚 Example: Complete Feature Implementation

### Task: Add "Recently Played" Feature

#### **Phase 1: Architecture Agent**

```markdown
## Recently Played - Architecture

**Components:**
1. Database: PlayHistory table (already exists)
2. Backend: GET /api/media/recently-played endpoint
3. Frontend: RecentlyPlayed page component

**Data Flow:**
User plays media → PlayHistory recorded → Query recent → Display in UI

**Files to create/modify:**
- Backend: `routes/media.routes.ts` (add endpoint)
- Backend: `services/player.service.ts` (add getRecentlyPlayed)
- Frontend: `pages/RecentlyPlayed.tsx` (new page)
- Frontend: `hooks/useRecentlyPlayed.ts` (new hook)

**Handoff:** → Backend Agent
```

#### **Phase 2: Backend Agent**

```markdown
## Recently Played - Backend Implementation

**Completed:**
- [x] Added GET /api/media/recently-played endpoint
- [x] Added PlayerService.getRecentlyPlayed() method
- [x] Returns last 20 played media (no duplicates)
- [x] Orders by playedAt DESC
- [x] Includes full media details

**Files Changed:**
- `backend/src/routes/media.routes.ts`
- `backend/src/services/player.service.ts`

**API Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "123",
      "title": "Song Title",
      "playedAt": "2024-02-13T21:00:00Z"
    }
  ]
}
```

**Tests:**
- [x] Unit tests pass
- [x] API returns correct data
- [x] Handles empty history

**Handoff:** → Frontend Agent (API ready!)
```

#### **Phase 3: Frontend Agent**

```markdown
## Recently Played - Frontend Implementation

**Completed:**
- [x] Created RecentlyPlayed page
- [x] Created useRecentlyPlayed hook
- [x] Added route /recently-played
- [x] Displays media cards with play date
- [x] Click to play
- [x] Empty state when no history

**Files Changed:**
- `frontend/src/pages/RecentlyPlayed.tsx` (new)
- `frontend/src/hooks/useRecentlyPlayed.ts` (new)
- `frontend/src/App.tsx` (added route)

**Tests:**
- [x] Component renders
- [x] Hook fetches data
- [x] Empty state shows

**Handoff:** → Testing Agent (needs E2E)
```

#### **Phase 4: Testing Agent**

```markdown
## Recently Played - E2E Tests

**Completed:**
- [x] E2E test: User plays song, appears in recently played
- [x] E2E test: Recently played persists after refresh
- [x] E2E test: Empty state when no history
- [x] All tests pass

**Coverage:**
- Backend service: 95%
- API endpoint: 90%
- Frontend hook: 85%
- Frontend component: 80%

**Handoff:** → HUMAN REVIEW (ready to merge!)
```

#### **Phase 5: Human Review**

```markdown
## Recently Played - Review

**Checked:**
- [x] Feature works as expected
- [x] Tests comprehensive
- [x] Code quality good
- [x] Follows patterns
- [x] Documentation updated

**Approved!** ✅

**Handoff:** → DevOps Agent (deploy)
```

---

## ✅ Summary

**Agentic Engineering Success Formula:**

1. **Clear roles** - Each agent knows their job
2. **Context loading** - Load relevant docs first
3. **Small increments** - Bite-sized changes
4. **Quality gates** - Human review for critical changes
5. **Testing always** - No code without tests
6. **Communication** - Clear handoff messages
7. **Follow patterns** - Check existing code first

---

**When to Reference:**
- ✅ Before starting multi-agent tasks
- ✅ When coordinating between agents
- ✅ When unclear about agent responsibilities
- ✅ When planning large features
- ✅ When reviewing agent work

**Related Files:**
- `CONTRIBUTING.md` - General contribution guidelines
- `.github/MVP_FEATURES.md` - What we're building
- All `.github/instructions/*.instructions.md` - Specific guidance

---

**End of Agentic Engineering Coordination Guide**
