# Testing Strategy Instructions

**Project:** YouTube Media Player - Testing Standards  
**Purpose:** Define testing frameworks, patterns, coverage requirements, and best practices  
**Scope:** Vitest (frontend), Jest (backend), integration testing, E2E testing

---

## 🎯 Testing Philosophy

1. **Test Pyramid** - 75% unit, 20% integration, 5% E2E
2. **Test Behavior, Not Implementation** - Focus on what, not how
3. **Fast Tests** - Tests should run in seconds
4. **Isolated Tests** - No dependencies between tests
5. **Meaningful Coverage** - 80%+ for critical paths

---

## 📦 Required Tools

### Backend (Jest)

```json
{
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.0",
    "@faker-js/faker": "^8.3.0",
    "supertest": "^6.3.0",
    "@types/supertest": "^6.0.0"
  }
}
```

### Frontend (Vitest)

```json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0",
    "@testing-library/react": "^14.1.0",
    "@testing-library/jest-dom": "^6.1.0",
    "@testing-library/user-event": "^14.5.0",
    "jsdom": "^23.0.0"
  }
}
```

---

## 🔧 Configuration

### Backend `jest.config.js`

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.interface.ts',
    '!src/server.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### Frontend `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'src/test/'],
    },
  },
});
```

---

## 🧪 Unit Testing Patterns

### Service Tests (Backend)

```typescript
// src/services/__tests__/media.service.test.ts
import { MediaService } from '../media.service';
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset } from 'jest-mock-extended';

const prismaMock = mockDeep<PrismaClient>();
const mediaService = new MediaService(prismaMock);

describe('MediaService', () => {
  beforeEach(() => {
    mockReset(prismaMock);
  });

  describe('getById', () => {
    it('should return media when found', async () => {
      const mockMedia = {
        id: '123',
        title: 'Test Song',
        artist: 'Test Artist',
      };
      
      prismaMock.media.findUnique.mockResolvedValue(mockMedia);
      
      const result = await mediaService.getById('123');
      
      expect(result).toEqual(mockMedia);
      expect(prismaMock.media.findUnique).toHaveBeenCalledWith({
        where: { id: '123' },
      });
    });

    it('should throw when media not found', async () => {
      prismaMock.media.findUnique.mockResolvedValue(null);
      
      await expect(mediaService.getById('999')).rejects.toThrow('Media not found');
    });
  });
});
```

### Component Tests (Frontend)

```typescript
// src/components/Player/__tests__/Player.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Player } from '../Player';
import { usePlayerStore } from '@/stores/player';

vi.mock('@/stores/player');

describe('Player', () => {
  const mockPlay = vi.fn();
  const mockPause = vi.fn();

  beforeEach(() => {
    (usePlayerStore as any).mockReturnValue({
      isPlaying: false,
      currentMedia: { id: '1', title: 'Test Song' },
      play: mockPlay,
      pause: mockPause,
    });
  });

  it('should render player with current media', () => {
    render(<Player />);
    expect(screen.getByText('Test Song')).toBeInTheDocument();
  });

  it('should call play when play button clicked', () => {
    render(<Player />);
    fireEvent.click(screen.getByRole('button', { name: /play/i }));
    expect(mockPlay).toHaveBeenCalled();
  });
});
```

---

## 🔗 Integration Testing

### API Integration Tests

```typescript
// src/routes/__tests__/media.routes.test.ts
import request from 'supertest';
import { app } from '../../server';
import { prisma } from '../../config/database';

describe('Media API', () => {
  beforeAll(async () => {
    await prisma.media.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/media', () => {
    it('should return empty array when no media', async () => {
      const response = await request(app)
        .get('/api/media')
        .expect(200);

      expect(response.body.data).toEqual([]);
    });

    it('should return media list', async () => {
      await prisma.media.create({
        data: { title: 'Song 1', artist: 'Artist 1', duration: 180 },
      });

      const response = await request(app)
        .get('/api/media')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toMatchObject({
        title: 'Song 1',
        artist: 'Artist 1',
      });
    });
  });
});
```

---

## 🎭 E2E Testing (Playwright)

```typescript
// e2e/player.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Media Player', () => {
  test('should play media from library', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to library
    await page.click('text=Library');
    
    // Click first media item
    await page.click('[data-testid="media-card"]:first-child');
    
    // Click play button
    await page.click('[data-testid="play-button"]');
    
    // Verify player is playing
    await expect(page.locator('[data-testid="player"]')).toHaveAttribute('data-playing', 'true');
  });
});
```

---

## 📊 Coverage Requirements

- **Critical Paths:** 90%+ (player, API, auth)
- **Business Logic:** 80%+
- **UI Components:** 70%+
- **Utilities:** 90%+

---

## 🚀 NPM Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test"
  }
}
```

---

## 📚 Related Instructions

- **Code Quality:** `.github/instructions/code-quality.instructions.md`
- **CI/CD:** `.github/instructions/cicd.instructions.md`

---

**When to Reference:**
- ✅ Writing new features
- ✅ Before committing code
- ✅ During code review
- ✅ Setting up CI/CD
