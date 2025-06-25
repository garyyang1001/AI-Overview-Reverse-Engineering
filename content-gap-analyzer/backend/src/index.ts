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

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/analysis', analysisRoutes);

// Error handling
app.use(errorHandler);

// Start server
server.listen(Number(PORT), '0.0.0.0', () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  logger.info(`Server accessible at: http://localhost:${PORT}`);
});