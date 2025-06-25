import { createClient } from 'redis';
import logger from '../utils/logger';

class CacheService {
  private client: any;
  private isConnected: boolean = false;
  
  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    
    this.client.on('error', (err: any) => {
      logger.error('Redis Client Error', err);
      this.isConnected = false;
    });
    
    this.client.on('connect', () => {
      logger.info('Redis Client Connected');
      this.isConnected = true;
    });
    
    this.connect();
  }
  
  private async connect() {
    try {
      await this.client.connect();
    } catch (error) {
      logger.warn('Redis not available, running without cache', error);
      this.isConnected = false;
    }
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
        await this.client.setEx(key, ttlSeconds, value);
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
        await this.client.del(keys);
        logger.info(`Cleared ${keys.length} cache keys matching pattern: ${pattern}`);
      }
    } catch (error) {
      logger.error(`Cache clear error for pattern ${pattern}`, error);
    }
  }
}

export const cacheService = new CacheService();