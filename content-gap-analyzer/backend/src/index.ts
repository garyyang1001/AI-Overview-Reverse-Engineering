// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import logger from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { 
  generalRateLimiter, 
  healthCheckRateLimiter, 
  testRateLimiter
} from './middleware/rateLimiter';
import {
  securityHeaders,
  requestSizeValidator,
  jsonPayloadValidator,
  userAgentValidator,
  corsPreflightHandler,
  securityLogger,
  methodValidator
} from './middleware/security';
import analysisRoutes from './routes/analysisRoutes';
import healthRoutes from './routes/healthRoutes';
import testRoutes from './routes/testRoutes';

// Import and start the analysis worker (after env vars are loaded)
import analysisWorker from './workers/analysisWorker';
// Import playwright service for shutdown


// Debug environment variables
logger.info('Environment variables loaded', {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET',
  SERPAPI_KEY: process.env.SERPAPI_KEY ? 'SET' : 'NOT SET',
  NODE_ENV: process.env.NODE_ENV
});

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// 安全性中間件 - 按順序應用
// 1. 基礎安全標頭
app.use(securityHeaders);

// 2. 安全日誌記錄
app.use(securityLogger);

// 3. CORS 預檢處理
app.use(corsPreflightHandler);

// 4. CORS 配置
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  maxAge: 86400 // 24 小時
}));

// 5. 請求大小驗證
app.use(requestSizeValidator);

// 6. User-Agent 驗證
app.use(userAgentValidator);

// 7. JSON 解析中間件 - 帶有安全驗證
app.use(express.json({ 
  limit: process.env.MAX_REQUEST_SIZE || '1mb',
  verify: jsonPayloadValidator,
  type: 'application/json'
}));

// 8. URL 編碼解析中間件
app.use(express.urlencoded({ 
  extended: true, 
  limit: process.env.MAX_REQUEST_SIZE || '1mb'
}));

// 9. 通用速率限制
app.use('/api/', generalRateLimiter);

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
      export: {
        pdf: 'GET /api/export/pdf/:jobId',
        html: 'GET /api/export/html/:jobId'
      },
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

// 路由配置 - 帶有特定的速率限制
// 健康檢查路由 - 寬鬆的速率限制
app.use('/api/health', healthCheckRateLimiter, methodValidator(['GET', 'POST']), healthRoutes);

// 分析路由 - 嚴格的速率限制（分析端點會有額外限制）
app.use('/api', analysisRoutes);

// 測試路由（僅開發環境）
if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
  app.use('/api/test', testRateLimiter, methodValidator(['GET', 'POST']), testRoutes);
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
  logger.error('Server startup error:', {
    error: error.message,
    code: error.code,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
  
  // 提供友好的錯誤訊息
  if (error.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use. Please try a different port.`);
  } else if (error.code === 'EACCES') {
    logger.error(`Permission denied for port ${PORT}. Try using a port > 1024.`);
  }
  
  process.exit(1);
});

// Add comprehensive uncaught exception handlers
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception - Critical Error:', {
    name: error.name,
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    processId: process.pid,
    nodeVersion: process.version,
    platform: process.platform
  });
  
  // 嘗試優雅關閉
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Promise Rejection - Critical Error:', {
    reason: reason?.message || reason,
    stack: reason?.stack,
    promise: promise.toString(),
    timestamp: new Date().toISOString(),
    processId: process.pid
  });
  
  // 嘗試優雅關閉
  gracefulShutdown('UNHANDLED_REJECTION');
});

// 添加其他重要的 process 事件處理
process.on('warning', (warning) => {
  logger.warn('Process Warning:', {
    name: warning.name,
    message: warning.message,
    stack: warning.stack,
    timestamp: new Date().toISOString()
  });
});

process.on('exit', (code) => {
  logger.info(`Process exiting with code: ${code}`, {
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * 優雅關閉函數
 */
async function gracefulShutdown(reason: string) {
  logger.info(`Initiating graceful shutdown due to: ${reason}`);
  
  try {
    // 設置關閉超時
    const shutdownTimeout = setTimeout(() => {
      logger.error('Forced shutdown due to timeout');
      process.exit(1);
    }, 30000); // 30 秒超時
    
    // 停止接受新請求
    server.close(async () => {
      logger.info('HTTP server closed');
      
      try {
        // 關閉 Worker
        logger.info('Shutting down analysis worker...');
        await analysisWorker.shutdown();
        
        clearTimeout(shutdownTimeout);
        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (shutdownError) {
        logger.error('Error during graceful shutdown:', shutdownError);
        clearTimeout(shutdownTimeout);
        process.exit(1);
      }
    });
    
  } catch (error) {
    logger.error('Error during graceful shutdown initiation:', error);
    process.exit(1);
  }
}

// Graceful shutdown handling for process signals
process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  gracefulShutdown('SIGINT');
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  gracefulShutdown('SIGTERM');
});