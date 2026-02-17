import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  mediaPath: process.env.MEDIA_PATH || './media',
  databaseUrl: process.env.DATABASE_URL,
};

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
