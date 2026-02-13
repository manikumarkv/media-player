# Database Change Checklist

**Task Type:** Creating or updating database schema  
**Applies To:** Database migrations, schema changes  
**Enforcement:** Pre-commit validation + AI agent reminders

---

## ✅ Checklist Items

When making database changes, complete ALL items before marking task as done:

### 1️⃣ Schema Design

#### Planning
- [ ] Document reason for schema change
- [ ] Review existing schema for conflicts
- [ ] Plan for data migration (if modifying existing tables)
- [ ] Consider performance implications (indexes, query patterns)
- [ ] Check for breaking changes to existing code

#### Prisma Schema
- [ ] Update `prisma/schema.prisma`
- [ ] Follow naming conventions (camelCase for fields, PascalCase for models)
- [ ] Add appropriate field types (String, Int, DateTime, etc.)
- [ ] Set required/optional fields correctly (`?` for optional)
- [ ] Add default values where appropriate
- [ ] Define relationships (one-to-one, one-to-many, many-to-many)
- [ ] Add `@map` for custom database column names (if needed)

---

### 2️⃣ Indexes & Constraints

#### Performance Optimization
- [ ] Add indexes for frequently queried fields
- [ ] Add composite indexes for multi-field queries
- [ ] Consider unique constraints where applicable
- [ ] Add foreign key constraints for relationships
- [ ] Review query patterns to optimize indexes

#### Example Indexes
- [ ] `@@index([userId])` for user-specific queries
- [ ] `@@index([createdAt])` for chronological queries
- [ ] `@@unique([email])` for unique fields
- [ ] `@@index([status, createdAt])` for filtered queries

---

### 3️⃣ Migration

#### Create Migration
- [ ] Run `pnpm prisma migrate dev --name descriptive-name`
- [ ] Use descriptive migration name (e.g., `add-media-likes-table`)
- [ ] Review generated SQL in `prisma/migrations/`
- [ ] Verify migration creates expected changes

#### Rollback Script
- [ ] Create rollback migration (undo changes)
- [ ] Test rollback locally
- [ ] Document rollback steps in migration folder
- [ ] Ensure rollback doesn't lose critical data

#### Data Migration
- [ ] If modifying existing tables, write data migration script
- [ ] Handle existing rows appropriately
- [ ] Test with production-like data volumes
- [ ] Plan for zero-downtime deployment if needed

---

### 4️⃣ Prisma Client

#### Generate Client
- [ ] Run `pnpm prisma generate` to update Prisma Client
- [ ] Verify TypeScript types updated correctly
- [ ] Check IntelliSense shows new fields/models
- [ ] Clear any cached Prisma Client instances

#### Update Application Code
- [ ] Update queries to use new fields/models
- [ ] Update TypeScript types/interfaces
- [ ] Handle new fields in existing queries
- [ ] Update seed data if applicable

---

### 5️⃣ Testing

#### Migration Testing
- [ ] Test migration on empty database
- [ ] Test migration on database with existing data
- [ ] Test rollback migration
- [ ] Verify no data loss during migration
- [ ] Test on local PostgreSQL instance

#### Application Testing
- [ ] Update unit tests for affected queries
- [ ] Test CRUD operations with new schema
- [ ] Test edge cases (null values, constraints)
- [ ] Verify indexes improve query performance
- [ ] Check for N+1 query problems

---

### 6️⃣ Documentation

#### Schema Documentation
- [ ] Add JSDoc comments to Prisma models
- [ ] Document field purposes and constraints
- [ ] Document relationships between models
- [ ] Update ER diagrams if maintained

#### Migration Documentation
- [ ] Document breaking changes in CHANGELOG.md
- [ ] Update API documentation if schema affects endpoints
- [ ] Document any required data migrations
- [ ] Add notes for deployment team

---

### 7️⃣ Performance

#### Query Optimization
- [ ] Review queries affected by schema changes
- [ ] Add/update indexes for new query patterns
- [ ] Test query performance with realistic data volumes
- [ ] Use `EXPLAIN ANALYZE` to verify index usage
- [ ] Monitor slow query logs

#### Benchmarking
- [ ] Benchmark critical queries before/after
- [ ] Ensure migrations complete in reasonable time
- [ ] Test with production-size datasets
- [ ] Verify no performance regressions

---

### 8️⃣ Security

- [ ] Don't store sensitive data in plaintext (use encryption)
- [ ] Add appropriate access controls
- [ ] Validate data constraints at database level
- [ ] Use environment variables for connection strings
- [ ] Review for SQL injection vulnerabilities (Prisma handles this)

---

### 9️⃣ Quality Gates

Before committing:
- [ ] Migration runs successfully (`pnpm prisma migrate dev`)
- [ ] Prisma Client generated (`pnpm prisma generate`)
- [ ] All tests passing (`pnpm test`)
- [ ] TypeScript compiles without errors (`pnpm type-check`)
- [ ] Rollback migration tested
- [ ] Documentation updated
- [ ] Git commit follows conventional commits format

---

## 🤖 AI Agent Instructions

When an AI agent is assigned a database change task:

1. **Load these files first:**
   - `database.instructions.md` - Database patterns
   - `architecture.instructions.md` - System architecture

2. **Follow this checklist step-by-step**
   - Do NOT skip rollback migration
   - Test with realistic data volumes
   - Consider performance implications

3. **Before marking task complete:**
   - Verify ALL checkboxes are checked
   - Run migrations successfully
   - Test affected application code
   - Review for breaking changes

4. **Handoff to next agent:**
   - If affects API, handoff to Backend Agent
   - If affects frontend, handoff to Frontend Agent
   - Document schema changes clearly

---

## 📋 Pre-commit Validation

This checklist is enforced by `.husky/pre-commit-checklist.js`:

**Automated checks:**
- ✅ Schema change detected → Must have migration file
- ✅ Migration created → Must have updated Prisma Client
- ✅ New model added → Must have corresponding seed data (optional)
- ⚠️  Missing rollback migration → Warning

**Blocking criteria:**
- ❌ Schema change without migration → Commit blocked
- ❌ Migration without Prisma generate → Commit blocked
- ❌ Tests failing → Commit blocked

---

## 📊 Example Checklist Usage

### Scenario: Adding `likes` field to `Media` model

```
✅ 1. Schema Design
  ✅ Added `likes Int @default(0)` to Media model
  ✅ Reviewed existing Media queries

✅ 2. Indexes & Constraints
  ✅ No index needed (not a query field)
  ✅ Default value set to 0

✅ 3. Migration
  ✅ Ran `pnpm prisma migrate dev --name add-media-likes`
  ✅ Reviewed SQL: `ALTER TABLE "Media" ADD COLUMN "likes" INTEGER DEFAULT 0`
  ✅ Created rollback script
  ✅ Tested on local DB

✅ 4. Prisma Client
  ✅ Ran `pnpm prisma generate`
  ✅ Verified TypeScript types include `likes`

✅ 5. Testing
  ✅ Updated Media tests to include likes
  ✅ Tested CRUD operations
  ✅ All tests passing

✅ 6. Documentation
  ✅ Added JSDoc comment for likes field
  ✅ Updated API docs for GET /api/media

✅ 7. Quality Gates
  ✅ Migration successful
  ✅ Tests passing
  ✅ TypeScript compiles
  ✅ Committed as: "feat(db): add likes field to Media model"
```

---

## 🚨 Common Mistakes to Avoid

❌ **No rollback migration** - Always plan for rollback  
❌ **Forgetting Prisma generate** - Client won't have new types  
❌ **No data migration** - Existing rows may have invalid data  
❌ **Missing indexes** - Queries will be slow  
❌ **Breaking changes without notice** - Update documentation  
❌ **Testing only on empty DB** - Test with real data  

---

## 🔗 Related Documentation

- `database.instructions.md` - Database architecture and patterns
- `architecture.instructions.md` - System architecture
- `backend.instructions.md` - Backend integration
- `performance.instructions.md` - Query optimization

---

**Last Updated:** 2026-02-13  
**Version:** 1.0.0
