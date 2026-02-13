# Git Workflow & Automation Instructions

**Project:** YouTube Media Player - Git Workflow Standards  
**Purpose:** Define Git workflow, commit conventions, hooks, and automation  
**Scope:** Husky, lint-staged, Conventional Commits, commitlint, branching strategy

---

## 🎯 Core Principles

1. **Conventional Commits** - Standardized commit messages
2. **Automated Validation** - Pre-commit and pre-push hooks
3. **Clean History** - Meaningful, organized commits
4. **Protected Main** - Never commit directly to main
5. **Feature Branches** - Isolated development

---

## 📦 Required Tools

```json
// package.json devDependencies
{
  "devDependencies": {
    "husky": "^8.0.0",
    "lint-staged": "^15.0.0",
    "@commitlint/cli": "^18.0.0",
    "@commitlint/config-conventional": "^18.0.0"
  }
}
```

---

## 🪝 Husky Setup (Git Hooks)

### Installation

```bash
# Install Husky
npm install --save-dev husky

# Initialize Husky
npx husky install

# Add prepare script (auto-install hooks after npm install)
npm pkg set scripts.prepare="husky install"
```

### Pre-commit Hook (`.husky/pre-commit`)

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run lint-staged
npx lint-staged

# Optional: Run type checking
# npm run type-check
```

### Pre-push Hook (`.husky/pre-push`)

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run tests before push
npm run test

# Run validation
npm run validate
```

### Commit-msg Hook (`.husky/commit-msg`)

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Validate commit message format
npx --no -- commitlint --edit $1
```

---

## 🎨 Lint-Staged Configuration

### `.lintstagedrc.js`

```javascript
module.exports = {
  // TypeScript files
  '*.{ts,tsx}': [
    'eslint --fix',
    'prettier --write',
  ],
  
  // JSON files
  '*.json': [
    'prettier --write',
  ],
  
  // Markdown files
  '*.md': [
    'prettier --write',
  ],
  
  // YAML files
  '*.{yml,yaml}': [
    'prettier --write',
  ],
};
```

### Monorepo Configuration

```javascript
// Root .lintstagedrc.js (if using monorepo)
module.exports = {
  'backend/**/*.ts': [
    'cd backend && eslint --fix',
    'cd backend && prettier --write',
  ],
  'frontend/**/*.{ts,tsx}': [
    'cd frontend && eslint --fix',
    'cd frontend && prettier --write',
  ],
  'shared/**/*.ts': [
    'cd shared && eslint --fix',
    'cd shared && prettier --write',
  ],
};
```

---

## 📝 Conventional Commits

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

```
feat:     New feature
fix:      Bug fix
docs:     Documentation changes
style:    Code style changes (formatting, no logic change)
refactor: Code refactoring (no feature change or bug fix)
perf:     Performance improvements
test:     Adding or updating tests
build:    Build system or dependencies
ci:       CI/CD configuration
chore:    Other changes (maintenance, tooling)
revert:   Revert a previous commit
```

### Examples

```bash
# Feature
git commit -m "feat(player): add playback speed control"

# Bug fix
git commit -m "fix(api): correct media streaming range headers"

# Documentation
git commit -m "docs(readme): update installation instructions"

# Refactoring
git commit -m "refactor(media): extract service layer from controller"

# Breaking change
git commit -m "feat(api): redesign playlist API

BREAKING CHANGE: Playlist endpoints now use /playlists instead of /playlist"

# Multiple paragraphs
git commit -m "feat(download): implement YouTube download queue

- Add queue management
- Support concurrent downloads
- Add progress tracking
- Implement retry logic

Closes #123"
```

### Scopes (Suggested)

```
player      - Media player component
api         - API endpoints
media       - Media management
playlist    - Playlist features
download    - YouTube download
database    - Database/Prisma changes
ui          - User interface
auth        - Authentication (if added)
docker      - Docker configuration
ci          - CI/CD pipeline
```

---

## ✅ Commitlint Configuration

### `commitlint.config.js`

```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  
  rules: {
    // Type enum
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert',
      ],
    ],
    
    // Scope enum (optional)
    'scope-enum': [
      2,
      'always',
      [
        'player',
        'api',
        'media',
        'playlist',
        'download',
        'database',
        'ui',
        'docker',
        'ci',
      ],
    ],
    'scope-empty': [1, 'never'], // Warning if scope is empty
    
    // Subject rules
    'subject-case': [2, 'always', 'lower-case'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'subject-max-length': [2, 'always', 72],
    
    // Body rules
    'body-leading-blank': [2, 'always'],
    'body-max-line-length': [2, 'always', 100],
    
    // Footer rules
    'footer-leading-blank': [2, 'always'],
  },
};
```

---

## 🌿 Branch Naming Convention

### Format

```
<type>/<ticket-id>-<short-description>

Examples:
feature/123-add-player-controls
bugfix/456-fix-stream-headers
hotfix/789-security-patch
refactor/101-extract-media-service
docs/202-update-api-docs
```

### Branch Types

```
feature/    - New features
bugfix/     - Bug fixes
hotfix/     - Urgent production fixes
refactor/   - Code refactoring
docs/       - Documentation updates
test/       - Test additions/changes
chore/      - Maintenance tasks
```

### Rules

- Use lowercase and hyphens
- Include ticket/issue number if available
- Keep description short and clear
- No special characters except hyphens
- Maximum 50 characters total

---

## 🔄 Git Flow Strategy

### Branch Structure

```
main              - Production-ready code
  └─ develop      - Development branch
      ├─ feature/xyz    - Feature branches
      ├─ bugfix/abc     - Bug fix branches
      └─ refactor/def   - Refactor branches
```

### Workflow

```bash
# 1. Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/123-add-playlist-ui

# 2. Make changes and commit
git add .
git commit -m "feat(playlist): add playlist UI components"

# 3. Keep feature branch updated
git fetch origin
git rebase origin/develop

# 4. Push feature branch
git push origin feature/123-add-playlist-ui

# 5. Create Pull Request (develop ← feature/123-add-playlist-ui)

# 6. After PR approval, squash merge to develop

# 7. Delete feature branch
git branch -d feature/123-add-playlist-ui
git push origin --delete feature/123-add-playlist-ui

# 8. When ready for release, merge develop to main
```

---

## 📋 .gitattributes

### `.gitattributes`

```
# Auto detect text files and normalize line endings to LF
* text=auto eol=lf

# Explicitly declare text files
*.ts text eol=lf
*.tsx text eol=lf
*.js text eol=lf
*.jsx text eol=lf
*.json text eol=lf
*.md text eol=lf
*.yml text eol=lf
*.yaml text eol=lf

# Shell scripts
*.sh text eol=lf

# Docker files
Dockerfile text eol=lf
*.dockerignore text eol=lf

# Declare files that will always have CRLF line endings on checkout
*.bat text eol=crlf
*.cmd text eol=crlf

# Denote all files that are truly binary and should not be modified
*.png binary
*.jpg binary
*.jpeg binary
*.gif binary
*.ico binary
*.mp3 binary
*.mp4 binary
*.webm binary
*.woff binary
*.woff2 binary
*.ttf binary
*.eot binary
*.zip binary
*.tar binary
*.gz binary
```

---

## 🚀 NPM Scripts

### Add to `package.json`

```json
{
  "scripts": {
    "prepare": "husky install",
    "commit": "cz",
    "validate": "npm run lint && npm run format:check && npm run type-check"
  }
}
```

### Optional: Commitizen (Interactive Commits)

```bash
# Install Commitizen
npm install --save-dev commitizen cz-conventional-changelog

# Configure
npx commitizen init cz-conventional-changelog --save-dev --save-exact

# Use with: npm run commit
```

---

## 📖 Commit Message Examples

### Good Commits ✅

```bash
# Feature with scope
feat(player): add volume control slider

Implements draggable volume slider with keyboard support.
Includes mute/unmute toggle button.

Closes #234

# Bug fix with detailed explanation
fix(api): correct media streaming for large files

Fixed issue where large media files (>1GB) would timeout
during streaming. Adjusted chunk size and buffer handling.

- Reduced chunk size from 10MB to 1MB
- Implemented proper backpressure handling
- Added timeout configuration

Fixes #456

# Breaking change
feat(api): redesign playlist API endpoints

BREAKING CHANGE: 
- Renamed /playlist to /playlists
- Changed response format to include metadata
- Removed deprecated 'tracks' field

Migration guide: docs/api-migration-v2.md

# Multiple related changes
chore: update dependencies and improve tooling

- Update TypeScript to 5.3.0
- Update ESLint to 8.50.0
- Add import sorting plugin
- Configure strict null checks

# Documentation
docs(api): add Bruno collection examples

Added complete Bruno API collection with examples
for all endpoints and authentication flows.
```

### Bad Commits ❌

```bash
# Too vague
git commit -m "fix bug"
git commit -m "update code"
git commit -m "changes"

# No type
git commit -m "add new feature"

# Wrong format
git commit -m "Feature: Add player controls"

# Too long subject
git commit -m "feat(player): add new player controls with volume slider and progress bar and seeking functionality"

# Multiple unrelated changes
git commit -m "feat: add player controls and fix database bug and update README"
```

---

## 🛡️ Protected Branches

### GitHub Branch Protection (`.github/settings.yml` if using Probot)

```yaml
repository:
  name: media-player
  default_branch: main

branches:
  - name: main
    protection:
      required_status_checks:
        strict: true
        contexts:
          - "build"
          - "test"
          - "lint"
      required_pull_request_reviews:
        required_approving_review_count: 1
        dismiss_stale_reviews: true
        require_code_owner_reviews: false
      enforce_admins: false
      required_linear_history: true
      restrictions: null

  - name: develop
    protection:
      required_status_checks:
        strict: true
        contexts:
          - "build"
          - "test"
      required_pull_request_reviews:
        required_approving_review_count: 1
      enforce_admins: false
```

---

## ✅ Pre-commit Checklist

### Before Every Commit

- [ ] Code compiles without errors
- [ ] All tests pass
- [ ] Code is linted and formatted
- [ ] No console.log or debugger statements
- [ ] Commit message follows convention
- [ ] Changes are atomic (single purpose)
- [ ] Related files are committed together

### Automated by Hooks

- ✅ Lint-staged runs (formats and lints)
- ✅ Commit message validated
- ✅ Tests run before push

---

## 🔧 Troubleshooting

### Skip Hooks (Emergency Only)

```bash
# Skip pre-commit hook (NOT RECOMMENDED)
git commit --no-verify -m "emergency fix"

# Skip pre-push hook
git push --no-verify
```

### Fix Commit Message

```bash
# Amend last commit message
git commit --amend

# Interactive rebase to fix older commits
git rebase -i HEAD~3
```

### Bypass Commitlint for Merge Commits

```javascript
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  ignores: [
    (message) => message.startsWith('Merge'),
  ],
};
```

---

## 📚 Git Workflow Commands

### Daily Workflow

```bash
# Start day: Update develop
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/123-new-feature

# Make changes and commit frequently
git add src/feature.ts
git commit -m "feat(feature): add initial implementation"

git add tests/feature.test.ts
git commit -m "test(feature): add unit tests"

# Update from develop periodically
git fetch origin
git rebase origin/develop

# Push feature branch
git push origin feature/123-new-feature

# Create PR when ready
# After PR merged, clean up
git checkout develop
git pull origin develop
git branch -d feature/123-new-feature
```

### Handling Conflicts

```bash
# During rebase, if conflicts occur
git status                    # See conflicted files
# Fix conflicts manually
git add .
git rebase --continue

# Or abort and try merge instead
git rebase --abort
git merge origin/develop
```

---

## 🎯 Best Practices

### Commit Frequency

✅ **Commit Often**
- After completing a logical unit of work
- After fixing a bug
- After adding a test
- Before switching contexts

❌ **Don't Commit**
- Broken code
- Work in progress (use stash instead)
- Multiple unrelated changes together
- Generated files (build artifacts)

### Commit Size

✅ **Good Commit Size**
- Single feature or bug fix
- Can be reviewed in < 10 minutes
- Can be reverted safely
- All tests pass

❌ **Bad Commit Size**
- Multiple features in one commit
- Thousands of lines changed
- Unrelated changes mixed together

---

## 📝 Pull Request Guidelines

### PR Title Format

Same as commit message:
```
feat(player): add shuffle functionality
fix(api): correct streaming headers
docs: update API documentation
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Closes #123
Related to #456

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Screenshots (if applicable)

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests pass locally
```

---

## 📚 Related Instructions

- **Code Quality:** `.github/instructions/code-quality.instructions.md`
- **Testing:** `.github/instructions/testing.instructions.md`
- **CI/CD:** `.github/instructions/cicd.instructions.md`

---

**When to Reference:**
- ✅ Project setup
- ✅ Before every commit
- ✅ Creating feature branches
- ✅ Setting up Git hooks
- ✅ Configuring team workflow
- ✅ Onboarding new developers
