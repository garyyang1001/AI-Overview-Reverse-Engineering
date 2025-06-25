import { Router, Request, Response } from 'express';
import { asyncHandler, healthCheck, errorTracker } from '../utils/errorUtils';
import logger from '../utils/logger';

const router = Router();

/**
 * 基本健康檢查
 */
router.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: '5.1.0'
  });
});

/**
 * 詳細健康檢查 - 包含外部服務狀態
 */
router.get('/detailed', asyncHandler(async (_req: Request, res: Response) => {
  const startTime = Date.now();
  
  // 並行檢查各項服務
  const [databaseOk, redisOk, openaiOk] = await Promise.allSettled([
    healthCheck.database(),
    healthCheck.redis(),
    healthCheck.openai()
  ]);
  
  const responseTime = Date.now() - startTime;
  
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: '5.1.0',
    responseTime: `${responseTime}ms`,
    services: {
      database: {
        status: databaseOk.status === 'fulfilled' && databaseOk.value ? 'healthy' : 'unhealthy',
        ...(databaseOk.status === 'rejected' && { error: databaseOk.reason?.message })
      },
      redis: {
        status: redisOk.status === 'fulfilled' && redisOk.value ? 'healthy' : 'unhealthy',
        ...(redisOk.status === 'rejected' && { error: redisOk.reason?.message })
      },
      openai: {
        status: openaiOk.status === 'fulfilled' && openaiOk.value ? 'healthy' : 'unhealthy',
        ...(openaiOk.status === 'rejected' && { error: openaiOk.reason?.message })
      }
    },
    system: {
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB'
      },
      cpu: {
        usage: process.cpuUsage()
      }
    }
  };
  
  // 檢查是否有服務不健康
  const unhealthyServices = Object.values(healthStatus.services)
    .filter(service => service.status === 'unhealthy');
  
  if (unhealthyServices.length > 0) {
    healthStatus.status = 'degraded';
    logger.warn('Some services are unhealthy', { unhealthyServices });
  }
  
  // 根據整體健康狀態設置 HTTP 狀態碼
  const httpStatus = healthStatus.status === 'healthy' ? 200 : 503;
  
  res.status(httpStatus).json(healthStatus);
}));

/**
 * 錯誤統計端點
 */
router.get('/errors', asyncHandler(async (_req: Request, res: Response) => {
  const errorStats = errorTracker.getStats();
  
  res.json({
    timestamp: new Date().toISOString(),
    errorStatistics: errorStats,
    totalErrors: Object.values(errorStats).reduce((sum, count) => sum + count, 0)
  });
}));

/**
 * 重置錯誤統計
 */
router.post('/errors/reset', asyncHandler(async (_req: Request, res: Response) => {
  errorTracker.reset();
  logger.info('Error statistics reset');
  
  res.json({
    success: true,
    message: 'Error statistics reset successfully',
    timestamp: new Date().toISOString()
  });
}));

export default router;