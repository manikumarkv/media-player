# Feature Completion Checklist

**Task Type:** Marking a feature as complete  
**Applies To:** Full-stack feature development  
**Enforcement:** Quality gate before PR merge

---

## ✅ Feature Completion Criteria

Before marking a feature as "complete" and ready for production:

### 1️⃣ Implementation Complete

#### Frontend
- [ ] All UI components implemented
- [ ] All user interactions working
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Dark mode support (if applicable)
- [ ] Loading states implemented
- [ ] Error states handled
- [ ] Empty states handled

#### Backend
- [ ] All API endpoints implemented
- [ ] Input validation working
- [ ] Error handling implemented
- [ ] Response format consistent
- [ ] Business logic in service layer
- [ ] Database queries optimized

#### Database
- [ ] Schema changes migrated
- [ ] Indexes added for performance
- [ ] Data integrity constraints set
- [ ] Rollback migration created

---

### 2️⃣ Testing Complete

#### Unit Tests
- [ ] Frontend components tested (>80% coverage)
- [ ] Backend services tested (>80% coverage)
- [ ] Database queries tested
- [ ] Edge cases covered
- [ ] Error cases tested

#### Integration Tests
- [ ] API endpoints tested end-to-end
- [ ] Frontend-backend integration verified
- [ ] Database operations verified

#### Manual Testing
- [ ] Tested in Chrome
- [ ] Tested in Firefox
- [ ] Tested in Safari
- [ ] Tested on mobile device
- [ ] Tested with slow network
- [ ] Tested with error scenarios

---

### 3️⃣ Documentation Complete

#### Code Documentation
- [ ] JSDoc comments for public functions
- [ ] Inline comments for complex logic
- [ ] README updated if needed
- [ ] Swagger/OpenAPI docs updated

#### User Documentation
- [ ] Feature documented in user guide (if applicable)
- [ ] Screenshots/GIFs added
- [ ] Common use cases documented
- [ ] Known limitations documented

#### Technical Documentation
- [ ] Architecture decisions documented
- [ ] API changes documented in CHANGELOG
- [ ] Database schema changes documented
- [ ] Breaking changes highlighted

---

### 4️⃣ Quality Standards Met

#### Code Quality
- [ ] ESLint passing (no warnings)
- [ ] Prettier formatting applied
- [ ] TypeScript strict mode passing
- [ ] No console.log statements
- [ ] No commented-out code
- [ ] No TODO comments (or tracked in issues)

#### Performance
- [ ] Page load time <2s
- [ ] API response time <200ms (simple queries)
- [ ] No unnecessary re-renders
- [ ] Images optimized
- [ ] Code splitting applied (if needed)

#### Security
- [ ] Input validation implemented
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] Sensitive data not exposed
- [ ] Rate limiting applied (if needed)

---

### 5️⃣ Accessibility

- [ ] Semantic HTML used
- [ ] ARIA labels where needed
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA
- [ ] Screen reader compatible
- [ ] Tested with keyboard only
- [ ] Tested with screen reader (if applicable)

---

### 6️⃣ Cross-Platform

- [ ] Works on Windows
- [ ] Works on macOS
- [ ] Works on Linux
- [ ] Works on iOS (if mobile app)
- [ ] Works on Android (if mobile app)
- [ ] File paths use cross-platform utilities

---

### 7️⃣ Production Readiness

#### Configuration
- [ ] Environment variables documented
- [ ] Default values set appropriately
- [ ] Secrets not committed to git
- [ ] Docker configuration updated (if applicable)

#### Monitoring
- [ ] Logging added for critical operations
- [ ] Error tracking configured
- [ ] Performance metrics tracked
- [ ] Alerts configured (if needed)

#### Deployment
- [ ] Feature flag configured (if gradual rollout)
- [ ] Database migrations tested
- [ ] Rollback plan documented
- [ ] Deployment checklist created

---

### 8️⃣ User Experience

#### Usability
- [ ] Feature intuitive to use
- [ ] Error messages clear and helpful
- [ ] Success feedback provided
- [ ] Loading indicators appropriate
- [ ] No confusing UI elements

#### Polish
- [ ] Animations smooth
- [ ] Transitions natural
- [ ] Colors consistent with design system
- [ ] Typography consistent
- [ ] Spacing consistent

---

### 9️⃣ Team Review

#### Code Review
- [ ] PR created with clear description
- [ ] Self-review completed
- [ ] Peer review requested
- [ ] All review comments addressed
- [ ] At least 1 approval received

#### Design Review
- [ ] Matches design mockups
- [ ] Designer approval (if applicable)
- [ ] UX flows validated

#### Stakeholder Review
- [ ] Demo completed
- [ ] Feedback incorporated
- [ ] Product owner approval

---

### 🔟 CI/CD Passing

- [ ] All automated tests passing
- [ ] Linting passing
- [ ] Type checking passing
- [ ] Build succeeding
- [ ] Docker image builds successfully
- [ ] Preview deployment working

---

## 🤖 AI Agent Instructions

When marking a feature as complete:

1. **Review this entire checklist**
   - Go through each section systematically
   - Check every item honestly
   - Don't skip items

2. **If any items are incomplete:**
   - Mark feature as "In Progress", not "Complete"
   - Create tasks for remaining items
   - Estimate time to complete

3. **Request human review for:**
   - User-facing features (UX validation)
   - Security-critical features
   - Performance-critical features
   - Breaking changes

4. **Before handoff:**
   - Document all completed work
   - Note any known issues
   - Provide testing instructions
   - Update project status

---

## 📋 Quality Gates

Features CANNOT be merged until:

### Critical (Blocking)
- ❌ Tests failing → Fix tests
- ❌ TypeScript errors → Fix errors
- ❌ Security vulnerabilities → Fix vulnerabilities
- ❌ No code review → Request review

### Important (Should Fix)
- ⚠️  Coverage <80% → Add more tests
- ⚠️  Performance issues → Optimize
- ⚠️  Accessibility issues → Fix accessibility
- ⚠️  Missing documentation → Add docs

### Nice to Have (Can Defer)
- 💡 Minor UI polish → Create follow-up issue
- 💡 Additional tests → Create follow-up issue
- 💡 Refactoring opportunities → Create follow-up issue

---

## 📊 Example Feature Completion

### Feature: "Add to Favorites" functionality

```
✅ 1. Implementation Complete
  ✅ Frontend: Heart icon button on MediaCard
  ✅ Backend: POST /api/media/:id/favorite endpoint
  ✅ Database: favorites table created

✅ 2. Testing Complete
  ✅ Unit tests: 92% coverage
  ✅ Integration tests: All passing
  ✅ Manual tests: Tested on Chrome, Firefox, mobile

✅ 3. Documentation Complete
  ✅ API docs updated with new endpoint
  ✅ User guide updated with favorites feature

✅ 4. Quality Standards Met
  ✅ ESLint clean
  ✅ Performance: <50ms response time
  ✅ Security: Input validation added

✅ 5. Accessibility
  ✅ Keyboard accessible (Enter to favorite)
  ✅ ARIA label: "Add to favorites"
  ✅ Screen reader compatible

✅ 6. Production Readiness
  ✅ Feature flag: favorites_enabled = true
  ✅ Logging added for favorite actions
  ✅ Deployment checklist created

✅ 7. Team Review
  ✅ PR approved by 2 reviewers
  ✅ Designer approved UI
  ✅ Product owner demo completed

✅ 8. CI/CD Passing
  ✅ All checks green

✅ FEATURE COMPLETE - READY FOR PRODUCTION
```

---

## 🚨 Common Reasons Features Are NOT Complete

❌ **"Works on my machine"** - Test on other platforms  
❌ **"Tests pass locally"** - Ensure CI/CD passes  
❌ **"Just needs documentation"** - Documentation is required  
❌ **"UI looks good enough"** - Get designer approval  
❌ **"No time for tests"** - Tests are not optional  
❌ **"Small feature, no review needed"** - All features need review  

---

## 🔗 Related Documentation

- All checklist files in `.ai/checklists/`
- `CONTRIBUTING.md` - Contributing guidelines
- `agentic-coordination.instructions.md` - Multi-agent workflows
- `.github/README.md` - Complete documentation index

---

**Last Updated:** 2026-02-13  
**Version:** 1.0.0
