import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import logger from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import analysisRoutes from './routes/analysisRoutes';
import healthRoutes from './routes/healthRoutes';
import testRoutes from './routes/testRoutes';

// Import and start the analysis worker
import analysisWorker from './workers/analysisWorker';

// Load environment variables
dotenv.config();

// Debug environment variables
logger.info('Environment variables loaded', {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET',
  SERPAPI_KEY: process.env.SERPAPI_KEY ? 'SET' : 'NOT SET',
  NODE_ENV: process.env.NODE_ENV
});

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api/', rateLimiter);

// Welcome route
app.get('/', (_req, res) => {
  res.json({
    message: 'AIO-Auditor v5.1 API Server',
    version: '5.1.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      analyze: 'POST /api/analyze',
      results: 'GET /api/results/:jobId',
      prompts: '/api/prompts',
      costs: '/api/costs/daily',
      tests: process.env.NODE_ENV === 'development' ? {
        goldenTestSet: 'GET /api/test/golden-test-set',
        runFullSuite: 'POST /api/test/run-full-suite',
        runCategory: 'POST /api/test/run-category/:category',
        runSingle: 'POST /api/test/run-single/:testId'
      } : 'Only available in development mode'
    },
    documentation: 'https://github.com/garyyang1001/AI-Overview-Reverse-Engineering'
  });
});

// Routes
app.use('/api/health', healthRoutes);
app.use('/api', analysisRoutes);

// Test routes (only in development)
if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
  app.use('/api/test', testRoutes);
  logger.info('Test routes enabled in development mode');
}

// Error handling
app.use(errorHandler);

// Start server
server.listen(Number(PORT), '0.0.0.0', () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  logger.info(`Server accessible at: http://localhost:${PORT}`);
});

// Add error handling for server startup
server.on('error', (error: any) => {
  logger.error('Server error:', error);
  process.exit(1);
});

// Add uncaught exception handlers
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown handling
process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  
  // Shutdown worker first
  await analysisWorker.shutdown();
  
  // Then close HTTP server
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  
  // Shutdown worker first
  await analysisWorker.shutdown();
  
  // Then close HTTP server
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});