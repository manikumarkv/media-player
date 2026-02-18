import { vi } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockPrismaType = Record<string, any>;

// Mock Prisma client
export const mockPrisma: MockPrismaType = {
  media: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
  },
  playlist: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  playlistItem: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
  },
  queueItem: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
  },
  playHistory: {
    findMany: vi.fn(),
    create: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn(),
    aggregate: vi.fn(),
  },
  download: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
  youTubeSync: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
  },
  youTubeSyncHistory: {
    findMany: vi.fn(),
    create: vi.fn(),
    deleteMany: vi.fn(),
  },
  $transaction: vi.fn((callback) => {
    if (typeof callback === 'function') {
      return callback(mockPrisma);
    }
    return Promise.all(callback);
  }),
};

vi.mock('../config/database.js', () => ({
  prisma: mockPrisma,
  config: {
    port: 3000,
    databaseUrl: 'postgresql://test:test@localhost:5432/test',
    frontendUrl: 'http://localhost:5173',
    mediaPath: '/tmp/media',
  },
}));

// Reset all mocks before each test
export function resetMocks() {
  vi.clearAllMocks();
}
