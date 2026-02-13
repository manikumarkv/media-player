# React Component Development Checklist

**Task Type:** Creating or updating React components  
**Applies To:** Frontend development  
**Enforcement:** Pre-commit validation + AI agent reminders

---

## ✅ Checklist Items

When creating or updating React components, complete ALL items before marking task as done:

### 1️⃣ Component Implementation

#### File Structure
- [ ] Create component in appropriate directory: `frontend/src/components/<Feature>/<ComponentName>.tsx`
- [ ] Use PascalCase for component name
- [ ] Co-locate related files (styles, tests, hooks)
- [ ] Group by feature, not by type

#### Component Architecture
- [ ] Use functional component with hooks (no class components)
- [ ] Keep component focused on presentation/UI only
- [ ] Extract business logic to custom hooks (`hooks/use*.ts`)
- [ ] Extract state management to Zustand stores (`stores/*Store.ts`)
- [ ] Extract API calls to services (`services/*.service.ts`)

#### Props & Types
- [ ] Define TypeScript interface for props
- [ ] Document props with JSDoc comments
- [ ] Use descriptive prop names
- [ ] Set default values for optional props
- [ ] Avoid prop drilling (use Context or Zustand for deep state)

#### Code Quality
- [ ] Component <150 lines (if larger, split into smaller components)
- [ ] No business logic in component (move to hooks/services)
- [ ] No direct API calls in component (use services + hooks)
- [ ] No console.log statements
- [ ] Proper error boundaries if component can fail

---

### 2️⃣ Clean Architecture Compliance

Follow patterns from `react-clean-architecture.instructions.md`:

#### Layered Structure
- [ ] **Presentation Layer:** Component only renders UI
- [ ] **Hooks Layer:** Custom hooks bridge component and state
- [ ] **State Layer:** Zustand store manages state
- [ ] **Service Layer:** Services handle business logic
- [ ] **API Layer:** API client makes HTTP requests
- [ ] **Utils Layer:** Pure utility functions

#### Anti-Patterns to Avoid
- [ ] ❌ No fetch/axios calls directly in component
- [ ] ❌ No complex state logic in component
- [ ] ❌ No business calculations in component
- [ ] ❌ No direct localStorage access in component
- [ ] ❌ No setTimeout/setInterval in component

---

### 3️⃣ Testing

#### Component Tests
- [ ] Create test file: `<ComponentName>.test.tsx`
- [ ] Test rendering with different props
- [ ] Test user interactions (clicks, inputs, etc.)
- [ ] Test edge cases (loading, error, empty states)
- [ ] Test accessibility (screen reader, keyboard nav)
- [ ] Mock external dependencies (API, stores, router)
- [ ] Achieve >80% code coverage

#### Test Examples
- [ ] Renders without crashing
- [ ] Displays correct content based on props
- [ ] Calls callbacks when user interacts
- [ ] Shows loading state while fetching data
- [ ] Shows error message on failure
- [ ] Handles empty data gracefully

---

### 4️⃣ Styling

#### CSS/Styling Approach
- [ ] Use Tailwind CSS utility classes (preferred)
- [ ] Or create scoped CSS module: `<ComponentName>.module.css`
- [ ] Follow existing design system patterns
- [ ] Use design tokens for colors/spacing/fonts
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Dark mode support (if applicable)

#### Accessibility
- [ ] Semantic HTML elements (`<button>`, `<nav>`, `<article>`, etc.)
- [ ] ARIA labels where needed
- [ ] Keyboard navigation support (Tab, Enter, Escape)
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA (4.5:1 minimum)
- [ ] Screen reader compatible

---

### 5️⃣ Performance

- [ ] Avoid unnecessary re-renders (use React.memo if needed)
- [ ] Use useCallback for functions passed as props
- [ ] Use useMemo for expensive calculations
- [ ] Lazy load heavy components (React.lazy + Suspense)
- [ ] Optimize images (WebP, lazy loading, srcset)
- [ ] Avoid inline function definitions in JSX
- [ ] Profile with React DevTools if performance concerns

---

### 6️⃣ State Management

#### When to use what:
- [ ] **useState:** Local UI state (form inputs, modals, toggles)
- [ ] **Zustand:** Global app state (user, player, library)
- [ ] **React Query:** Server state (API data, caching)
- [ ] **Context:** Theme, i18n, auth (when added)

#### State Guidelines
- [ ] Keep state as close to where it's used as possible
- [ ] Lift state up only when multiple components need it
- [ ] Use Zustand for cross-feature state
- [ ] Don't duplicate server data in local state (use React Query)

---

### 7️⃣ Error Handling

- [ ] Handle loading states (show spinners/skeletons)
- [ ] Handle error states (show error messages)
- [ ] Handle empty states (show helpful messages)
- [ ] Provide retry mechanisms for failed operations
- [ ] Log errors to console (dev) or monitoring service (prod)
- [ ] Use Error Boundaries for unexpected errors

---

### 8️⃣ Internationalization (i18n)

If i18n is enabled:
- [ ] Use `t()` function for all user-facing text
- [ ] No hardcoded strings in JSX
- [ ] Use translation keys: `t('component.action')`
- [ ] Test with long translations (German, etc.)
- [ ] Support RTL languages if needed

---

### 9️⃣ Quality Gates

Before committing:
- [ ] Component renders correctly in browser
- [ ] All tests passing (`pnpm test`)
- [ ] ESLint passing (`pnpm lint`)
- [ ] TypeScript compiles without errors (`pnpm type-check`)
- [ ] Code coverage >80% for new component
- [ ] No warnings in browser console
- [ ] Git commit follows conventional commits format

---

## 🤖 AI Agent Instructions

When an AI agent is assigned to create/update a React component:

1. **Load these files first:**
   - `frontend.instructions.md` - Frontend patterns
   - `react-clean-architecture.instructions.md` - Architecture layers
   - `ux-design.instructions.md` - UI/UX specifications

2. **Follow clean architecture:**
   - Component → Hook → Store → Service → API
   - Each layer talks only to adjacent layers
   - No skipping layers

3. **Before marking task complete:**
   - Verify ALL checkboxes are checked
   - Run tests and ensure they pass
   - Test component in browser manually
   - Check for accessibility issues

4. **Handoff to next agent:**
   - If needs backend API, handoff to Backend Agent
   - If needs state management, handoff to Frontend Agent
   - Document what was completed and what remains

---

## 📋 Pre-commit Validation

This checklist is enforced by `.husky/pre-commit-checklist.js`:

**Automated checks:**
- ✅ New component file detected → Must have corresponding test file
- ✅ Component >200 lines → Warning (consider splitting)
- ✅ Direct API calls in component → Blocked (use services)
- ⚠️  Missing accessibility attributes → Warning

**Blocking criteria:**
- ❌ Component without tests → Commit blocked
- ❌ Tests failing → Commit blocked
- ❌ TypeScript errors → Commit blocked

---

## 📊 Example Checklist Usage

### Scenario: Creating `MediaCard` component

```
✅ 1. Component Implementation
  ✅ Created `frontend/src/components/Media/MediaCard.tsx`
  ✅ Functional component with typed props
  ✅ Extracted logic to `useMediaCard` hook
  ✅ Props interface documented with JSDoc

✅ 2. Clean Architecture
  ✅ Component only renders UI
  ✅ Business logic in `useMediaCard` hook
  ✅ API calls in `mediaService.ts`
  ✅ State management in `mediaStore.ts`

✅ 3. Testing
  ✅ Created `MediaCard.test.tsx`
  ✅ Test: renders with media data
  ✅ Test: handles click event
  ✅ Test: shows like button correctly
  ✅ Coverage: 88%

✅ 4. Styling
  ✅ Tailwind CSS classes used
  ✅ Responsive design (mobile/desktop)
  ✅ Dark mode support
  ✅ Focus indicators added

✅ 5. Performance
  ✅ Component wrapped with React.memo
  ✅ Callbacks memoized with useCallback

✅ 6. Accessibility
  ✅ Semantic HTML (article, button)
  ✅ ARIA labels added
  ✅ Keyboard navigation works

✅ 7. Quality Gates
  ✅ Tests passing
  ✅ ESLint clean
  ✅ TypeScript compiles
  ✅ Committed as: "feat(ui): add MediaCard component"
```

---

## 🚨 Common Mistakes to Avoid

❌ **Fat components** - Keep components thin, move logic to hooks  
❌ **Direct API calls** - Always use services layer  
❌ **Prop drilling** - Use Zustand for global state  
❌ **Missing tests** - Write tests alongside component  
❌ **Hardcoded text** - Use i18n translation keys  
❌ **Poor accessibility** - Always think about keyboard/screen readers  
❌ **Unnecessary re-renders** - Profile and optimize  

---

## 🔗 Related Documentation

- `frontend.instructions.md` - Frontend architecture
- `react-clean-architecture.instructions.md` - Clean architecture patterns
- `ux-design.instructions.md` - UI/UX specifications
- `testing.instructions.md` - Testing strategies
- `performance.instructions.md` - Performance optimization
- `i18n.instructions.md` - Internationalization

---

**Last Updated:** 2026-02-13  
**Version:** 1.0.0
