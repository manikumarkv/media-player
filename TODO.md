# TODO: Implementation Tasks for Later

This file tracks tasks that are **documented** but **not yet implemented**. Pick these up during actual development.

---

## 🔧 Pre-commit Hook Automation

**Status:** Documented in checklists, not yet coded  
**Priority:** Medium (manual checklist following works for now)  
**When to do:** After project setup (Phase 1 of development)

### Tasks
- [ ] Create `.husky/pre-commit-checklist.js`
- [ ] Implement validation logic:
  - [ ] Check if new route file exists → verify test file exists
  - [ ] Check if new component exists → verify test file exists
  - [ ] Check if Prisma schema changed → verify migration exists
  - [ ] Parse route files for Swagger annotations
  - [ ] Check api-routes.ts is updated
- [ ] Test blocking behavior (should prevent commit)
- [ ] Test warning behavior (should warn but allow)
- [ ] Add to Husky hooks configuration
- [ ] Document usage in CONTRIBUTING.md

**Files that reference this:**
- `.ai/checklists/api-endpoint.md` (Line ~190)
- `.ai/checklists/react-component.md` (Line ~210)
- `.ai/checklists/database-change.md` (Line ~180)

---

## 🎨 First-Run ToS Modal Implementation

**Status:** UX designed, React code patterns provided, not implemented  
**Priority:** High (required before users can use app)  
**When to do:** During frontend setup (Phase 2-3 of development)

### Tasks
- [ ] Create `frontend/src/utils/legal.ts` utility
- [ ] Create `frontend/src/components/Legal/FirstRunModal.tsx`
- [ ] Create `frontend/src/components/Legal/FirstRunModal.css`
- [ ] Add app-level guard in `App.tsx`
- [ ] Create `frontend/src/pages/Settings/Legal.tsx`
- [ ] Test ToS flow:
  - [ ] First-time user sees modal
  - [ ] Cannot proceed without checking all boxes
  - [ ] Decline closes app
  - [ ] Accept saves to localStorage
  - [ ] Existing user bypasses modal
  - [ ] Version upgrade shows modal again
- [ ] Serve DISCLAIMER.md at `/DISCLAIMER.md` route
- [ ] Serve LICENSE at `/LICENSE` route

**Files that reference this:**
- `.github/instructions/first-run-tos.instructions.md` (complete implementation guide)
- `.github/instructions/ux-design.instructions.md` (Journey 0, Mermaid diagram)
- `DISCLAIMER.md` (legal content)
- `LICENSE` (license content)

---

## 📱 Educational Purpose Banner

**Status:** Documented in legal files, not yet implemented  
**Priority:** High (legal requirement)  
**When to do:** During frontend layout (Phase 2 of development)

### Tasks
- [ ] Add persistent banner to app header
- [ ] Text: "⚠️ For Educational Purposes Only"
- [ ] Link to DISCLAIMER.md
- [ ] Visible on all pages
- [ ] Cannot be dismissed (always visible)
- [ ] Style: Yellow/orange background, prominent

**Files that reference this:**
- `DISCLAIMER.md`
- `README.md`
- `.github/instructions/ux-design.instructions.md`

---

## 🧪 Bruno API Test Collections

**Status:** Testing strategy documented, collections not created  
**Priority:** Medium (can test with Swagger UI initially)  
**When to do:** As you build each API endpoint

### Tasks
- [ ] Install Bruno locally
- [ ] Create `api-testing/` directory
- [ ] Create environment configuration (dev, staging, prod)
- [ ] Create collections per resource:
  - [ ] Media endpoints collection
  - [ ] Playlist endpoints collection
  - [ ] Download endpoints collection
- [ ] Add to CI/CD pipeline
- [ ] Document in api-testing.instructions.md

**Files that reference this:**
- `.github/instructions/api-testing.instructions.md`
- `.ai/checklists/api-endpoint.md`

---

## 🎯 Feature Flags Implementation

**Status:** Fully documented, not implemented  
**Priority:** Low (MVP doesn't need feature flags)  
**When to do:** Post-MVP, Phase 2+ when doing gradual rollouts

### Tasks
- [ ] Choose approach (config file vs database)
- [ ] Implement backend FeatureFlagService
- [ ] Create feature flags configuration
- [ ] Add frontend useFeatureFlag hook
- [ ] Create FeatureFlag component
- [ ] Add admin endpoints for flag management (if database approach)
- [ ] Test gradual rollout with consistent hashing

**Files that reference this:**
- `.github/instructions/feature-flags.instructions.md`

---

## 📊 Monitoring & Observability

**Status:** Fully documented, not implemented  
**Priority:** Medium (important for production)  
**When to do:** Before production deployment

### Tasks
- [ ] Setup Winston logging with daily rotation
- [ ] Add Prometheus metrics endpoints
- [ ] Create health check endpoints (basic, readiness, liveness)
- [ ] Configure Grafana dashboards
- [ ] Set up alert rules
- [ ] Integrate Sentry for frontend error tracking
- [ ] Add request/response logging middleware

**Files that reference this:**
- `.github/instructions/monitoring-observability.instructions.md`

---

## 🌐 Internationalization (i18n)

**Status:** Fully documented, not implemented  
**Priority:** Low (MVP is English-only)  
**When to do:** Post-MVP when expanding to international users

### Tasks
- [ ] Install react-i18next
- [ ] Create translation files (en.json, es.json, etc.)
- [ ] Replace all hardcoded strings with t() function
- [ ] Add language switcher component
- [ ] Test with long translations
- [ ] Add RTL support if needed
- [ ] Backend i18n for error messages

**Files that reference this:**
- `.github/instructions/i18n.instructions.md`

---

## 📈 Analytics & Telemetry

**Status:** Fully documented, not implemented  
**Priority:** Medium (helpful for understanding usage)  
**When to do:** After MVP launch

### Tasks
- [ ] Choose provider (Plausible recommended)
- [ ] Implement page view tracking
- [ ] Add event tracking for key actions
- [ ] Create consent banner (GDPR)
- [ ] Track performance metrics
- [ ] Set up analytics dashboard
- [ ] Document tracked events

**Files that reference this:**
- `.github/instructions/analytics.instructions.md`

---

## 📝 Swagger/OpenAPI Documentation

**Status:** Setup documented, not implemented  
**Priority:** Medium (helpful for API development)  
**When to do:** During backend setup (Phase 1-2)

### Tasks
- [ ] Install swagger-jsdoc and swagger-ui-express
- [ ] Create Swagger configuration
- [ ] Add Swagger UI route (`/api-docs`)
- [ ] Add @openapi annotations to routes
- [ ] Define reusable schemas
- [ ] Test in Swagger UI

**Files that reference this:**
- `.github/instructions/openapi-swagger.instructions.md`
- `.ai/checklists/api-endpoint.md`

---

## 🎨 All Remaining Implementation

**Frontend:**
- [ ] Project setup (Vite, React, TypeScript)
- [ ] State management (Zustand stores)
- [ ] API client setup (Axios with interceptors)
- [ ] Component library
- [ ] Player implementation
- [ ] Library views
- [ ] Playlist management
- [ ] Settings pages

**Backend:**
- [ ] Project setup (Express, TypeScript)
- [ ] Database setup (Prisma + PostgreSQL)
- [ ] API endpoints (Media, Playlists, Downloads)
- [ ] YouTube download service
- [ ] WebSocket for progress updates
- [ ] File management
- [ ] Error handling middleware

**Infrastructure:**
- [ ] Docker setup (separate containers)
- [ ] docker-compose.yml
- [ ] Environment configuration
- [ ] CI/CD pipelines (GitHub Actions)
- [ ] Deployment scripts

**Testing:**
- [ ] Frontend tests (Vitest + React Testing Library)
- [ ] Backend tests (Jest)
- [ ] Integration tests
- [ ] E2E tests (Playwright - optional)

---

## 📋 How to Use This File

1. **During development**, open this file
2. **Pick a task** based on current phase
3. **Check off items** as you complete them
4. **Reference linked documentation** for implementation details
5. **Move completed sections** to main project tracking

---

**Last Updated:** 2026-02-13  
**Maintained By:** Development team
