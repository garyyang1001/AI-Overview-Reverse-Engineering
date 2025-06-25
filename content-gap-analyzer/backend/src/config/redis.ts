import Redis from 'ioredis';
import logger from '../utils/logger';

// Redis 連接配置
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  connectTimeout: 10000,
  commandTimeout: 5000,
};

// 創建 Redis 客戶端實例
const redisClient = new Redis(redisConfig);

// Redis 連接事件處理
redisClient.on('connect', () => {
  logger.info('Redis client connected successfully');
});

redisClient.on('ready', () => {
  logger.info('Redis client ready for operations');
});

redisClient.on('error', (error) => {
  logger.error('Redis connection error:', error);
});

redisClient.on('close', () => {
  logger.warn('Redis connection closed');
});

redisClient.on('reconnecting', () => {
  logger.info('Redis client reconnecting...');
});

// 優雅關閉處理
process.on('SIGINT', async () => {
  logger.info('Gracefully closing Redis connection...');
  await redisClient.quit();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Gracefully closing Redis connection...');
  await redisClient.quit();
  process.exit(0);
});

export default redisClient;