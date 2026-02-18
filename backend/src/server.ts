import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { config } from './config/database.js';
import { errorHandler } from './middleware/errorHandler.js';
import { router } from './routes/index.js';
import { socketService } from './services/socket.service.js';

const app: Express = express();
const httpServer = createServer(app);

// Socket.io setup via service
const io = socketService.initialize(httpServer);

// Middleware
app.use(helmet());
app.use(cors({ origin: config.frontendUrl }));
app.use(express.json({ limit: '5mb' }));

// Health check (no API prefix)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1', router);

// Error handling
app.use(errorHandler);

// Start server
const PORT = config.port;
httpServer.listen(PORT, () => {
  console.info(`Server running on port ${PORT}`);
  console.info(`Health check: http://localhost:${PORT}/health`);
});

// Export for testing
export { app, io };
