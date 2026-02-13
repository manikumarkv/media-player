# 🤖 Custom Copilot Agents

This directory contains specialized Copilot agents from [awesome-copilot](https://github.com/github/awesome-copilot).

---

## 📦 Installed Agents (11 total - 76KB)

### Core Development (3 agents)
1. **expert-react-frontend-engineer.agent.md** (24KB)
   - React 19.2 expert with hooks, Server Components, Actions
   - TypeScript integration, performance optimization
   - Testing with Jest/Vitest, accessibility

2. **typescript-mcp-expert.agent.md** (6KB)
   - TypeScript best practices for FE/BE
   - Advanced type patterns, generics
   - Type-safe API design

3. **api-architect.agent.md** (2.5KB)
   - API design and architecture patterns
   - RESTful endpoint structure, versioning
   - Error handling and response formats

### DevOps & Infrastructure (2 agents)
4. **devops-expert.agent.md** (8.1KB)
   - Docker, Docker Compose, Kubernetes
   - CI/CD pipelines, automation
   - Infrastructure as Code

5. **github-actions-expert.agent.md** (4.5KB)
   - GitHub Actions workflows
   - Automated testing and deployment
   - Workflow optimization

### Database & Quality (2 agents)
6. **postgresql-dba.agent.md** (1.2KB)
   - PostgreSQL optimization
   - Query performance tuning
   - Indexing strategies

7. **accessibility.agent.md** (12KB)
   - WCAG 2.1 AA compliance
   - ARIA attributes, keyboard navigation
   - Semantic HTML

### Testing & Debugging (2 agents)
8. **playwright-tester.agent.md** (1.3KB)
   - E2E testing with Playwright
   - Test player interactions (play/pause/seek)
   - Visual regression testing

9. **debug.agent.md** (3.5KB)
   - Complex debugging scenarios
   - Audio/video playback issues
   - Performance bottleneck analysis

### Code Quality & Design (2 agents)
10. **janitor.agent.md** (3.2KB)
    - Code cleanup and refactoring
    - Remove unused dependencies
    - Tech debt management

11. **se-ux-ui-designer.agent.md** (10KB) ⭐ NEW
    - Jobs-to-be-Done analysis
    - User journey mapping
    - UX research artifacts for design

---

## 🎯 How to Use Agents

### Invoke an Agent
Agents are automatically available in GitHub Copilot Chat:

\`\`\`bash
# In VS Code Copilot Chat or CLI
@agent expert-react-frontend-engineer create a media player component
@agent api-architect design the media library API
@agent playwright-tester write E2E tests for player
@agent debug help me debug audio buffering issues
@agent janitor clean up unused imports
\`\`\`

### Agent Selection Guide

| Task | Use This Agent |
|------|---------------|
| **React Components** | expert-react-frontend-engineer |
| **TypeScript Types** | typescript-mcp-expert |
| **API Design** | api-architect |
| **Docker Setup** | devops-expert |
| **CI/CD Workflows** | github-actions-expert |
| **Database Queries** | postgresql-dba |
| **Accessibility** | accessibility |
| **E2E Testing** | playwright-tester |
| **Debugging** | debug |
| **Code Cleanup** | janitor |
| **UX/UI Design** | se-ux-ui-designer |

---

## 🚀 Agent Capabilities

### @expert-react-frontend-engineer
- Build React 19.2 components with modern hooks
- Implement Server Components and Actions
- Optimize performance with React Compiler
- Write comprehensive tests
- Ensure accessibility compliance

### @typescript-mcp-expert
- Design type-safe APIs
- Create advanced TypeScript patterns
- Implement generic components
- Configure strict TypeScript

### @api-architect ⭐
- Design RESTful API endpoints
- Structure API versioning
- Create consistent error responses
- Implement API best practices

### @devops-expert
- Create Docker multi-container setups
- Design CI/CD pipelines
- Optimize build processes
- Implement monitoring and logging

### @github-actions-expert
- Create GitHub Actions workflows
- Automate testing and deployment
- Optimize workflow performance
- Implement security scanning

### @postgresql-dba
- Optimize database schema
- Improve query performance
- Design indexing strategies
- Implement migrations

### @accessibility
- Ensure WCAG compliance
- Implement keyboard navigation
- Create semantic HTML
- Add ARIA attributes

### @playwright-tester ⭐
- Write E2E tests for user flows
- Test complex interactions
- Visual regression testing
- Cross-browser testing

### @debug ⭐
- Debug complex issues
- Analyze performance bottlenecks
- Troubleshoot audio/video playback
- Find race conditions

### @janitor ⭐
- Refactor legacy code
- Remove unused dependencies
- Clean up imports and exports
- Improve code organization

---

## 📝 Perfect Coverage for YouTube Media Player

| Project Area | Agent(s) |
|-------------|----------|
| **Frontend Development** | expert-react-frontend-engineer, typescript-mcp-expert |
| **Backend APIs** | api-architect, typescript-mcp-expert |
| **Media Player** | expert-react-frontend-engineer, debug |
| **Database** | postgresql-dba |
| **Docker/Infrastructure** | devops-expert |
| **CI/CD** | github-actions-expert |
| **Testing** | playwright-tester |
| **Accessibility** | accessibility |
| **Code Quality** | janitor |
| **Debugging** | debug |

---

## 💡 Usage Examples

\`\`\`bash
# Design API endpoints
@agent api-architect design REST API for media library with playlists

# Write E2E test
@agent playwright-tester create test for downloading and playing a video

# Debug playback issue
@agent debug audio stutters when seeking, what could be the issue?

# Clean up code
@agent janitor remove unused imports and dependencies from backend

# React component
@agent expert-react-frontend-engineer create a queue management component

# Database optimization
@agent postgresql-dba optimize query for fetching most played songs
\`\`\`

---

## 📝 Adding More Agents

Browse available agents:
https://github.com/github/awesome-copilot/tree/main/agents

Download an agent:
\`\`\`bash
curl -o .github/copilot/agents/AGENT_NAME.agent.md \
  https://raw.githubusercontent.com/github/awesome-copilot/main/agents/AGENT_NAME.agent.md
\`\`\`

---

## 🔗 Resources

- [Awesome Copilot Repository](https://github.com/github/awesome-copilot)
- [Agent Documentation](https://github.com/github/awesome-copilot/tree/main/agents)
- [Copilot CLI Docs](https://docs.github.com/copilot/cli)

---

**10 specialized agents ready!** Full coverage for development, testing, debugging, and deployment. 🚀
