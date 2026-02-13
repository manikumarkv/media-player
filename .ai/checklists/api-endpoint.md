# API Endpoint Development Checklist

**Task Type:** Creating or updating API endpoints  
**Applies To:** Backend development  
**Enforcement:** Pre-commit validation + AI agent reminders

---

## ✅ Checklist Items

When creating or updating API endpoints, complete ALL items before marking task as done:

### 1️⃣ Backend Implementation

#### Route Definition
- [ ] Create/update route in `backend/src/routes/*.routes.ts`
- [ ] Use appropriate HTTP method (GET, POST, PUT, DELETE, PATCH)
- [ ] Define route path following RESTful conventions (`/api/resource` or `/api/resource/:id`)
- [ ] Add route to centralized `api-routes.ts` file (shared FE/BE)

#### Service Logic
- [ ] Implement business logic in `backend/src/services/*.service.ts`
- [ ] Keep routes thin (only request/response handling)
- [ ] Move all business logic to service layer
- [ ] Handle errors gracefully with try-catch

#### Input Validation
- [ ] Add Zod schema for request body validation
- [ ] Validate all user inputs (body, params, query)
- [ ] Return 400 Bad Request for validation errors
- [ ] Use consistent error format from `api-standards.instructions.md`

#### Error Handling
- [ ] Implement proper error handling for all failure cases
- [ ] Use custom error classes (NotFoundError, ValidationError, etc.)
- [ ] Return appropriate HTTP status codes (400, 404, 409, 422, 500)
- [ ] Include error codes from standardized enum
- [ ] Log errors with context (request ID, user, timestamp)

#### Response Format
- [ ] Follow standard response structure: `{ success: true, data: T }`
- [ ] Use `ResponseHelper` utility for consistency
- [ ] Include pagination for list endpoints (page, limit, total, hasNext)
- [ ] Return appropriate status codes (200, 201, 204)

#### Code Quality
- [ ] Add JSDoc comments for endpoint function
- [ ] Document parameters, return type, and possible errors
- [ ] Use TypeScript types for request/response
- [ ] Follow naming conventions (camelCase for functions)
- [ ] No console.log statements (use logger)

---

### 2️⃣ Documentation

#### Swagger/OpenAPI
- [ ] Add `@openapi` JSDoc annotations to route
- [ ] Document all parameters (path, query, body)
- [ ] Document all response codes (200, 400, 404, 500)
- [ ] Include example request and response
- [ ] Tag endpoint appropriately (Media, Playlists, Downloads, etc.)
- [ ] Test in Swagger UI (`http://localhost:3000/api-docs`)

#### Centralized API Routes
- [ ] Update `shared/api-routes.ts` with new endpoint
- [ ] Add TypeScript type for endpoint parameters
- [ ] Ensure frontend can import and use
- [ ] Keep routes in sync between FE and BE

---

### 3️⃣ Testing

#### Unit Tests
- [ ] Create test file: `backend/src/routes/*.routes.test.ts`
- [ ] Test happy path (200 OK)
- [ ] Test validation errors (400 Bad Request)
- [ ] Test not found (404)
- [ ] Test server errors (500)
- [ ] Test edge cases (empty arrays, null values, etc.)
- [ ] Mock external dependencies (database, services)
- [ ] Achieve >80% code coverage

#### Integration Tests (Optional)
- [ ] Test with real database (if complex queries)
- [ ] Test authentication/authorization (when added)
- [ ] Test rate limiting
- [ ] Test with invalid tokens/headers

---

### 4️⃣ API Testing (Bruno)

#### Create Bruno Request
- [ ] Add request to Bruno collection: `api-testing/endpoints/<resource>.bru`
- [ ] Set correct HTTP method and URL
- [ ] Add example request body (if POST/PUT/PATCH)
- [ ] Add environment variables for dynamic values

#### Test Scenarios
- [ ] Test happy path with valid data
- [ ] Test with invalid data (validation errors)
- [ ] Test with non-existent ID (404)
- [ ] Test edge cases
- [ ] Save example responses in Bruno

#### Add to CI/CD
- [ ] Ensure Bruno tests run in GitHub Actions
- [ ] Add to automated test suite
- [ ] Verify tests pass before merging

---

### 5️⃣ Security

- [ ] Validate and sanitize all inputs
- [ ] Check for SQL injection vulnerabilities (use Prisma parameterized queries)
- [ ] Check for XSS vulnerabilities (sanitize user content)
- [ ] Implement rate limiting (if public endpoint)
- [ ] Add authentication check (when auth implemented)
- [ ] Don't expose sensitive data in responses
- [ ] Use HTTPS in production

---

### 6️⃣ Performance

- [ ] Optimize database queries (use indexes)
- [ ] Implement pagination for large datasets
- [ ] Add caching headers (if applicable)
- [ ] Avoid N+1 query problems
- [ ] Test with realistic data volumes
- [ ] Monitor response times (should be <200ms for simple queries)

---

### 7️⃣ Quality Gates

Before committing:
- [ ] All tests passing (`pnpm test`)
- [ ] ESLint passing (`pnpm lint`)
- [ ] TypeScript compiles without errors (`pnpm type-check`)
- [ ] Code coverage >80% for new code
- [ ] No `console.log` statements
- [ ] No commented-out code
- [ ] Git commit follows conventional commits format

---

## 🤖 AI Agent Instructions

When an AI agent is assigned to create/update an API endpoint:

1. **Load these files first:**
   - `backend.instructions.md` - Backend patterns
   - `api-standards.instructions.md` - Response formats
   - `api-routes.instructions.md` - Route management
   - `error-handling.instructions.md` - Error patterns

2. **Follow this checklist step-by-step**
   - Do NOT skip any items
   - Mark each checkbox as you complete it
   - Document why if any item is not applicable

3. **Before marking task complete:**
   - Verify ALL checkboxes are checked
   - Run all tests and ensure they pass
   - Test endpoint manually in Bruno or Swagger UI
   - Review code for quality and consistency

4. **Handoff to next agent:**
   - If task requires frontend work, handoff to Frontend Agent
   - If task requires DB changes, handoff to Database Agent
   - Document what was completed and what remains

---

## 📋 Pre-commit Validation

This checklist is enforced by `.husky/pre-commit-checklist.js`:

**Automated checks:**
- ✅ New route file detected → Must have corresponding test file
- ✅ New route added → Must have Swagger annotations
- ✅ New route added → Must be in centralized `api-routes.ts`
- ⚠️  Missing Bruno test → Warning (not blocking, but recommended)

**Blocking criteria:**
- ❌ Route without tests → Commit blocked
- ❌ Route without Swagger docs → Commit blocked
- ❌ Tests failing → Commit blocked

---

## 🔗 Related Documentation

- `backend.instructions.md` - Backend architecture and patterns
- `api-standards.instructions.md` - API response standards and status codes
- `api-routes.instructions.md` - Centralized route management
- `error-handling.instructions.md` - Error classes and patterns
- `testing.instructions.md` - Testing strategies
- `api-testing.instructions.md` - Bruno API testing
- `openapi-swagger.instructions.md` - API documentation

---

**Last Updated:** 2026-02-13  
**Version:** 1.0.0
