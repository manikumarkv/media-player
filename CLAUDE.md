# YouTube Media Player - Claude Code Instructions

## ⛔ MANDATORY RULES - READ FIRST

> **STOP. These rules are NON-NEGOTIABLE. Violating them wastes the user's time.**

### Rule 1: NO CODE WITHOUT TESTS
```
BEFORE writing implementation code, you MUST:
1. Create the test file first (*.test.ts or *.test.tsx)
2. Write test cases (they will fail initially)
3. THEN write implementation to make tests pass
```

### Rule 2: NO TASK COMPLETION WITHOUT VERIFICATION
```
BEFORE marking ANY task complete, you MUST:
1. Run: pnpm test
2. Run: pnpm type-check
3. Run: pnpm lint
4. Show the output in your response
5. ALL must pass - if any fails, FIX before continuing
```

### Rule 3: NO SKIPPING CHECKLISTS
```
BEFORE starting work, you MUST:
1. Identify task type (API endpoint, React component, DB change, Feature)
2. Read the corresponding checklist file
3. Follow EVERY item - no exceptions
```

---

## 🚦 TASK WORKFLOW (Follow In Order)

### Gate 1: IDENTIFY & LOAD
```
1. What type of task is this?
   - API Endpoint → Read .ai/checklists/api-endpoint.md
   - React Component → Read .ai/checklists/react-component.md
   - Database Change → Read .ai/checklists/database-change.md
   - Feature Complete → Read .ai/checklists/feature-complete.md

2. State which checklist you are following
```

### Gate 2: TEST FIRST
```
1. Create test file BEFORE implementation
2. Write failing tests for expected behavior
3. Run tests to confirm they fail: pnpm test
```

### Gate 3: IMPLEMENT
```
1. Write code to make tests pass
2. Follow checklist items in order
3. Check off each item as you complete it
```

### Gate 4: VERIFY (Required Output)
```
Run these commands and SHOW OUTPUT in your response:

pnpm test
pnpm type-check
pnpm lint

If ANY command fails → FIX before continuing
If ALL pass → You may mark task complete
```

---

## 📋 INLINE CHECKLISTS (Quick Reference)

### For API Endpoints - MUST DO:
- [ ] **TEST FILE FIRST**: Create `*.routes.test.ts` or `*.service.test.ts`
- [ ] Service method in `services/*.service.ts`
- [ ] Controller in `controllers/*.controller.ts`
- [ ] Route in `routes/*.routes.ts`
- [ ] Zod validation schema
- [ ] Test: happy path (200)
- [ ] Test: validation error (400)
- [ ] Test: not found (404)
- [ ] Test: edge cases
- [ ] Coverage >80%
- [ ] Run verification gate

### For React Components - MUST DO:
- [ ] **TEST FILE FIRST**: Create `<Component>.test.tsx`
- [ ] Component in `components/<Feature>/<Name>.tsx`
- [ ] Props interface with TypeScript
- [ ] Test: renders correctly
- [ ] Test: user interactions
- [ ] Test: loading state
- [ ] Test: error state
- [ ] Test: empty state
- [ ] Accessibility: ARIA labels, keyboard nav
- [ ] Coverage >80%
- [ ] Run verification gate

### For Database Changes - MUST DO:
- [ ] Update `prisma/schema.prisma`
- [ ] Run `pnpm prisma migrate dev --name <name>`
- [ ] Run `pnpm prisma generate`
- [ ] Update affected services
- [ ] Test migration on existing data
- [ ] Run verification gate

---

## 🔴 BLOCKING VIOLATIONS

These will ALWAYS block your work:

| Violation | Why It's Blocked |
|-----------|------------------|
| Implementation without test file | Tests are mandatory |
| Marking task complete without running verification | Must prove code works |
| Skipping checklist items | All items are required |
| `pnpm test` fails | Broken code cannot proceed |
| `pnpm type-check` fails | Type errors are bugs |
| Coverage <80% for new code | Insufficient testing |

---

## ✅ CORRECT WORKFLOW EXAMPLE

```markdown
User: "Add a media service method to get media by ID"

Claude's response:

1. **Loading checklist**: Reading .ai/checklists/api-endpoint.md

2. **Creating test file first**:
   [Creates backend/src/services/media.service.test.ts]

3. **Writing failing tests**:
   - Test: returns media when found
   - Test: throws NotFoundError when not found

4. **Running tests to confirm they fail**:
   $ pnpm test
   FAIL src/services/media.service.test.ts

5. **Implementing the method**:
   [Creates the service method]

6. **Verification Gate**:
   $ pnpm test
   PASS src/services/media.service.test.ts
   ✓ returns media when found
   ✓ throws NotFoundError when not found
   Coverage: 92%

   $ pnpm type-check
   No errors

   $ pnpm lint
   No warnings

7. **Task complete** ✅
```

---

## ❌ INCORRECT WORKFLOW EXAMPLE

```markdown
User: "Add a media service method to get media by ID"

Claude's response (WRONG):

1. [Creates service method directly without tests]
2. [Marks task as complete without verification]
3. "Done! I've added the method."

❌ VIOLATION: No tests written
❌ VIOLATION: No verification gate
❌ VIOLATION: Checklist not followed
```

---

## 📁 Project Overview

**Project:** Offline-first media player with YouTube download capability

**Offline-First Philosophy:**
- ALL player features work without internet
- Downloads only require internet during download phase
- Priority: Player > Library Management > Download

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite + Zustand
- **Backend:** Node.js 18+ + Express + TypeScript + Prisma ORM
- **Database:** PostgreSQL 15
- **Testing:** Vitest (frontend + backend)
- **Infrastructure:** Docker (3 containers: frontend, backend, postgres)

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
- **Routes:** `shared/constants/routes.ts`
- **Endpoints:** `shared/constants/endpoints.ts`
- **Socket Events:** `shared/constants/socket-events.ts`

## Project Structure

```
.
├── frontend/                 # React app (Vite)
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Route pages
│   │   ├── stores/          # Zustand stores
│   │   ├── hooks/           # Custom hooks
│   │   └── api/             # API client
│   └── package.json
│
├── backend/                  # Express API
│   ├── src/
│   │   ├── routes/          # Express routes
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Express middleware
│   │   └── errors/          # Custom error classes
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   └── package.json
│
├── shared/                   # Shared constants & types
└── docker-compose.yml
```

## Code Standards

### TypeScript
- **Strict Mode:** All TypeScript strict flags enabled
- **No `any`:** Use explicit types or `unknown`
- **No floating promises:** Always `await` or `void`

### Git Commits
- **Format:** Conventional Commits (`feat:`, `fix:`, `docs:`, etc.)

## Detailed Checklists

For comprehensive checklists with all items, read these files:

| Task Type | Checklist File |
|-----------|----------------|
| API Endpoint | `.ai/checklists/api-endpoint.md` |
| React Component | `.ai/checklists/react-component.md` |
| Database Change | `.ai/checklists/database-change.md` |
| Feature Complete | `.ai/checklists/feature-complete.md` |

## Slash Commands

- `/react` - React 19 frontend development
- `/api` - API architecture and design
- `/debug` - Systematic debugging
- `/db` - PostgreSQL database operations
- `/test` - Testing

---

## 🔁 REMINDER: Every Response Must Include

When completing implementation work, your response MUST include:

1. **Checklist declaration**: "Following checklist: [name]"
2. **Test file creation**: Show the test file you created
3. **Verification output**: Show results of `pnpm test`, `pnpm type-check`, `pnpm lint`
4. **Checklist status**: Which items you completed

**If you cannot show verification output, the task is NOT complete.**
