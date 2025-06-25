/**
 * AIO-Auditor v5.1 安全中間件
 * 實現企業級安全防護措施
 */

import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { createError } from '../utils/errorUtils';
import logger from '../utils/logger';

/**
 * 請求大小驗證中間件
 */
export const requestSizeValidator = (req: Request, _res: Response, next: NextFunction) => {
  const contentLength = parseInt(req.get('Content-Length') || '0');
  const maxSize = parseInt(process.env.MAX_REQUEST_SIZE || '1048576'); // 1MB 默認
  
  if (contentLength > maxSize) {
    logger.warn('Request size exceeded', {
      ip: req.ip,
      contentLength,
      maxSize,
      url: req.url,
      timestamp: new Date().toISOString()
    });
    
    const error = createError.payloadTooLarge(
      `請求載荷過大。最大允許大小: ${Math.round(maxSize / 1024 / 1024)}MB`
    );
    return next(error);
  }
  
  next();
};

/**
 * JSON 載荷驗證中間件
 */
export const jsonPayloadValidator = (req: Request, _res: Response, buf: Buffer) => {
  try {
    // 檢查是否為有效的 UTF-8
    const content = buf.toString('utf8');
    
    // 基本的內容安全檢查
    if (content.includes('\0')) {
      throw new Error('Invalid null bytes in request');
    }
    
    // 檢查是否包含潛在的惡意腳本
    const suspiciousPatterns = [
      /<script[^>]*>/i,
      /javascript:/i,
      /vbscript:/i,
      /onload=/i,
      /onerror=/i,
      /eval\(/i,
      /document\.cookie/i
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(content)) {
        logger.warn('Suspicious content detected in request', {
          ip: req.ip,
          pattern: pattern.toString(),
          url: req.url,
          timestamp: new Date().toISOString()
        });
        
        throw new Error('Potentially malicious content detected');
      }
    }
  } catch (error: any) {
    logger.error('JSON payload validation failed', {
      error: error.message,
      ip: req.ip,
      url: req.url,
      timestamp: new Date().toISOString()
    });
    
    throw createError.badRequest('無效的請求內容');
  }
};

/**
 * 增強版 Helmet 配置
 */
export const securityHeaders = helmet({
  // 內容安全政策
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.openai.com", "https://serpapi.com"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  
  // 跨站腳本攻擊保護
  crossOriginEmbedderPolicy: false, // 為了兼容性暫時關閉
  
  // DNS 預取控制
  dnsPrefetchControl: {
    allow: false
  },
  
  // 框架選項
  frameguard: {
    action: 'deny'
  },
  
  // 隱藏 X-Powered-By 標頭
  hidePoweredBy: true,
  
  // HTTP 嚴格傳輸安全
  hsts: {
    maxAge: 31536000, // 1 年
    includeSubDomains: true,
    preload: true
  },
  
  // IE 不相容性檢查
  ieNoOpen: true,
  
  // MIME 類型嗅探保護
  noSniff: true,
  
  // 來源檢查
  originAgentCluster: true,
  
  // 權限政策
  permittedCrossDomainPolicies: false,
  
  // 引用者政策
  referrerPolicy: {
    policy: "no-referrer"
  },
  
  // XSS 過濾器
  xssFilter: true
});

/**
 * IP 白名單中間件（用於管理端點）
 */
export const ipWhitelist = (allowedIPs: string[] = []) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const clientIP = req.ip || 'unknown';
    
    // 開發環境跳過檢查
    if (process.env.NODE_ENV === 'development') {
      return next();
    }
    
    // 檢查 IP 是否在白名單中
    if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
      logger.warn('IP not in whitelist', {
        ip: clientIP,
        allowedIPs,
        url: req.url,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
      
      const error = createError.forbidden('IP 地址不在允許範圍內');
      return next(error);
    }
    
    next();
  };
};

/**
 * API Key 驗證中間件（用於受保護的端點）
 */
export const apiKeyAuth = (req: Request, _res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;
  const validApiKey = process.env.ADMIN_API_KEY;
  
  if (!validApiKey) {
    logger.error('ADMIN_API_KEY not configured');
    const error = createError.internal('服務配置錯誤');
    return next(error);
  }
  
  if (!apiKey || apiKey !== validApiKey) {
    logger.warn('Invalid API key', {
      ip: req.ip,
      providedKey: apiKey ? `${apiKey.substring(0, 8)}...` : 'none',
      url: req.url,
      timestamp: new Date().toISOString()
    });
    
    const error = createError.unauthorized('無效的 API 金鑰');
    return next(error);
  }
  
  next();
};

/**
 * User-Agent 驗證中間件
 */
export const userAgentValidator = (req: Request, _res: Response, next: NextFunction) => {
  const userAgent = req.get('User-Agent');
  
  if (!userAgent) {
    logger.warn('Missing User-Agent header', {
      ip: req.ip,
      url: req.url,
      timestamp: new Date().toISOString()
    });
    
    const error = createError.badRequest('缺少必要的請求標頭');
    return next(error);
  }
  
  // 檢查是否為已知的惡意 User-Agent
  const suspiciousAgents = [
    /sqlmap/i,
    /nikto/i,
    /nessus/i,
    /masscan/i,
    /zap/i
  ];
  
  for (const pattern of suspiciousAgents) {
    if (pattern.test(userAgent)) {
      logger.warn('Suspicious User-Agent detected', {
        ip: req.ip,
        userAgent,
        url: req.url,
        timestamp: new Date().toISOString()
      });
      
      const error = createError.forbidden('不允許的客戶端');
      return next(error);
    }
  }
  
  next();
};

/**
 * 請求方法驗證中間件
 */
export const methodValidator = (allowedMethods: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!allowedMethods.includes(req.method)) {
      logger.warn('Method not allowed', {
        ip: req.ip,
        method: req.method,
        allowedMethods,
        url: req.url,
        timestamp: new Date().toISOString()
      });
      
      res.status(405).json({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: `方法 ${req.method} 不被允許`,
          allowedMethods,
          timestamp: new Date().toISOString()
        }
      });
      return;
    }
    
    next();
  };
};

/**
 * CORS 預檢請求處理
 */
export const corsPreflightHandler = (req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
    res.header('Access-Control-Max-Age', '86400'); // 24 小時
    res.status(200).end();
    return;
  }
  
  next();
};

/**
 * 安全日誌記錄中間件
 */
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // 記錄可疑的請求
    if (res.statusCode >= 400 || duration > 30000) { // 30 秒以上的請求
      logger.warn('Security event', {
        ip: req.ip,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
        userAgent: req.get('User-Agent'),
        referer: req.get('Referer'),
        timestamp: new Date().toISOString()
      });
    }
  });
  
  next();
};