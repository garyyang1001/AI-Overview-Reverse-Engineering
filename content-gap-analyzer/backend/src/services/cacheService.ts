import Redis from 'ioredis';
import logger from '../utils/logger';

class CacheService {
  private client: Redis;
  private isConnected: boolean = false;
  
  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      enableOfflineQueue: false
    });
    
    this.client.on('error', (err: any) => {
      logger.error('Redis Cache Client Error', err);
      this.isConnected = false;
    });
    
    this.client.on('connect', () => {
      logger.info('Redis Cache Client Connected');
      this.isConnected = true;
    });
  }
  
  async get(key: string): Promise<string | null> {
    if (!this.isConnected) return null;
    
    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error(`Cache get error for key ${key}`, error);
      return null;
    }
  }
  
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.isConnected) return;
    
    try {
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      logger.error(`Cache set error for key ${key}`, error);
    }
  }
  
  async del(key: string): Promise<void> {
    if (!this.isConnected) return;
    
    try {
      await this.client.del(key);
    } catch (error) {
      logger.error(`Cache delete error for key ${key}`, error);
    }
  }
  
  async clear(pattern: string): Promise<void> {
    if (!this.isConnected) return;
    
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
        logger.info(`Cleared ${keys.length} cache keys matching pattern: ${pattern}`);
      }
    } catch (error) {
      logger.error(`Cache clear error for pattern ${pattern}`, error);
    }
  }
}

export const cacheService = new CacheService();