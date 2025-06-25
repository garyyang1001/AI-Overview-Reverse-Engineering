import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import logger from '../utils/logger';

/**
 * 通用 API 速率限制 - 適用於所有 API 端點
 */
export const generalRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 分鐘
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 每 IP 100 次請求
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: '請求過於頻繁，請稍後再試',
      timestamp: new Date().toISOString()
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      url: req.url,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
    
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: '請求過於頻繁，請稍後再試',
        timestamp: new Date().toISOString(),
        retryAfter: '15 minutes'
      }
    });
  }
});

/**
 * 分析端點的嚴格速率限制 - 因為這是資源密集型操作
 */
export const analysisRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分鐘
  max: 5, // 每個 IP 限制 5 次分析請求
  message: {
    success: false,
    error: {
      code: 'ANALYSIS_RATE_LIMITED',
      message: '分析請求過於頻繁，請稍後再試。每 15 分鐘最多 5 次分析。',
      timestamp: new Date().toISOString()
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // 可以根據用戶 ID 或 IP 地址來限制
    return req.ip || 'unknown';
  },
  handler: (req: Request, res: Response) => {
    logger.warn('Analysis rate limit exceeded', {
      ip: req.ip,
      url: req.url,
      userAgent: req.get('User-Agent'),
      body: req.body,
      timestamp: new Date().toISOString()
    });
    
    res.status(429).json({
      success: false,
      error: {
        code: 'ANALYSIS_RATE_LIMITED',
        message: '分析請求過於頻繁，請稍後再試。每 15 分鐘最多 5 次分析。',
        timestamp: new Date().toISOString(),
        retryAfter: '15 minutes',
        details: {
          windowMs: 15 * 60 * 1000,
          maxRequests: 5,
          currentWindow: new Date(Date.now() + 15 * 60 * 1000).toISOString()
        }
      }
    });
  }
});

/**
 * 健康檢查的寬鬆速率限制
 */
export const healthCheckRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 分鐘
  max: 60, // 每分鐘 60 次檢查
  message: {
    success: false,
    error: {
      code: 'HEALTH_RATE_LIMITED',
      message: '健康檢查請求過於頻繁',
      timestamp: new Date().toISOString()
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // 允許來自本地的健康檢查請求
    return req.ip === '127.0.0.1' || req.ip === '::1';
  }
});

/**
 * 測試端點的開發環境速率限制
 */
export const testRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 分鐘
  max: 20, // 每 5 分鐘 20 次測試請求
  message: {
    success: false,
    error: {
      code: 'TEST_RATE_LIMITED',
      message: '測試請求過於頻繁，請稍後再試',
      timestamp: new Date().toISOString()
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (_req: Request) => {
    // 僅在非開發環境中生效
    return process.env.NODE_ENV !== 'development';
  }
});

/**
 * 管理端點的嚴格速率限制
 */
export const adminRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 分鐘
  max: 10, // 每 5 分鐘 10 次管理操作
  message: {
    success: false,
    error: {
      code: 'ADMIN_RATE_LIMITED',
      message: '管理操作過於頻繁，請稍後再試',
      timestamp: new Date().toISOString()
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

// 向後兼容
export const rateLimiter = generalRateLimiter;