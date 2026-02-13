# CI/CD Pipeline Instructions

**Project:** YouTube Media Player - Continuous Integration & Deployment  
**Purpose:** Define GitHub Actions workflows, automated testing, Docker builds  
**Scope:** CI/CD pipelines, automated validation, deployment strategies

---

## 🎯 Core Principles

1. **Fail Fast** - Catch issues early
2. **Automated Testing** - All tests run on every PR
3. **Build Validation** - Docker images build successfully
4. **Security Scanning** - Dependency and code security checks
5. **Deploy on Merge** - Auto-deploy to staging/production

---

## 📦 GitHub Actions Workflows

### `.github/workflows/ci.yml` (Pull Request Checks)

\`\`\`yaml
name: CI

on:
  pull_request:
    branches: [ main, develop ]
  push:
    branches: [ main, develop ]

jobs:
  lint:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        package: [backend, frontend]
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: '\${{ matrix.package }}/package-lock.json'
      
      - name: Install dependencies
        working-directory: ./\${{ matrix.package }}
        run: npm ci
      
      - name: Run ESLint
        working-directory: ./\${{ matrix.package }}
        run: npm run lint
      
      - name: Check formatting
        working-directory: ./\${{ matrix.package }}
        run: npm run format:check
      
      - name: Type check
        working-directory: ./\${{ matrix.package }}
        run: npm run type-check

  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        package: [backend, frontend]
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        working-directory: ./\${{ matrix.package }}
        run: npm ci
      
      - name: Run tests
        working-directory: ./\${{ matrix.package }}
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./\${{ matrix.package }}/coverage/coverage-final.json
          flags: \${{ matrix.package }}

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Build backend
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          push: false
          tags: media-player-backend:test
      
      - name: Build frontend
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          push: false
          tags: media-player-frontend:test

  api-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Start services
        run: docker-compose up -d
      
      - name: Wait for API
        run: |
          timeout 60 sh -c 'until curl -f http://localhost:3000/health; do sleep 2; done'
      
      - name: Install Bruno CLI
        run: npm install -g @usebruno/cli
      
      - name: Run API tests
        run: bruno run bruno/ --env docker
      
      - name: Stop services
        if: always()
        run: docker-compose down
\`\`\`

### `.github/workflows/security.yml` (Security Scanning)

\`\`\`yaml
name: Security

on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday
  push:
    branches: [ main ]

jobs:
  npm-audit:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        package: [backend, frontend]
    steps:
      - uses: actions/checkout@v4
      
      - name: Run npm audit
        working-directory: ./\${{ matrix.package }}
        run: npm audit --audit-level=moderate
      
      - name: Run Snyk scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: \${{ secrets.SNYK_TOKEN }}
        with:
          command: test
          args: --all-projects

  docker-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          severity: 'CRITICAL,HIGH'
\`\`\`

### `.github/workflows/deploy.yml` (Deployment)

\`\`\`yaml
name: Deploy

on:
  push:
    branches: [ main ]
    tags: [ 'v*' ]

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: \${{ secrets.DOCKER_USERNAME }}
          password: \${{ secrets.DOCKER_PASSWORD }}
      
      - name: Build and push backend
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          push: true
          tags: |
            \${{ secrets.DOCKER_USERNAME }}/media-player-backend:latest
            \${{ secrets.DOCKER_USERNAME }}/media-player-backend:\${{ github.sha }}
      
      - name: Build and push frontend
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          push: true
          tags: |
            \${{ secrets.DOCKER_USERNAME }}/media-player-frontend:latest
            \${{ secrets.DOCKER_USERNAME }}/media-player-frontend:\${{ github.sha }}

  deploy-staging:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to staging
        run: |
          echo "Deploy to staging server"
          # Add deployment commands here

  deploy-production:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: startsWith(github.ref, 'refs/tags/v')
    steps:
      - name: Deploy to production
        run: |
          echo "Deploy to production server"
          # Add deployment commands here
\`\`\`

---

## 🔒 Required Secrets

Configure in GitHub Settings → Secrets:

- \`DOCKER_USERNAME\` - Docker Hub username
- \`DOCKER_PASSWORD\` - Docker Hub password
- \`SNYK_TOKEN\` - Snyk API token (optional)

---

## ✅ Status Badges

Add to README.md:

\`\`\`markdown
![CI](https://github.com/username/media-player/workflows/CI/badge.svg)
![Security](https://github.com/username/media-player/workflows/Security/badge.svg)
![Deploy](https://github.com/username/media-player/workflows/Deploy/badge.svg)
\`\`\`

---

## 📚 Related Instructions

- **Testing:** \`.github/instructions/testing.instructions.md\`
- **Git Workflow:** \`.github/instructions/git-workflow.instructions.md\`
- **Security:** \`.github/instructions/security.instructions.md\`

---

**When to Reference:**
- ✅ Setting up CI/CD
- ✅ Configuring GitHub Actions
- ✅ Troubleshooting pipeline failures
- ✅ Adding new workflows
