/**
 * 錯誤處理工具函數
 * 提供便利的錯誤創建和處理方法
 */

import { AppError } from '../middleware/errorHandler';
import logger from './logger';
import { Request, Response, NextFunction } from 'express';

/**
 * 異步控制器包裝器
 * 自動捕獲異步錯誤並傳遞給錯誤處理中間件
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 創建常見的應用錯誤
 */
export const createError = {
  badRequest: (message: string = '請求參數錯誤') => 
    new AppError(message, 400, 'BAD_REQUEST'),
    
  unauthorized: (message: string = '未授權訪問') => 
    new AppError(message, 401, 'UNAUTHORIZED'),
    
  forbidden: (message: string = '權限不足') => 
    new AppError(message, 403, 'FORBIDDEN'),
    
  notFound: (message: string = '資源不存在') => 
    new AppError(message, 404, 'NOT_FOUND'),
    
  conflict: (message: string = '資源衝突') => 
    new AppError(message, 409, 'CONFLICT'),
    
  tooManyRequests: (message: string = '請求過於頻繁') => 
    new AppError(message, 429, 'TOO_MANY_REQUESTS'),
    
  internal: (message: string = '內部服務器錯誤') => 
    new AppError(message, 500, 'INTERNAL_ERROR'),
    
  serviceUnavailable: (message: string = '服務暫時不可用') => 
    new AppError(message, 503, 'SERVICE_UNAVAILABLE'),
    
  validation: (message: string = '數據驗證失敗') => 
    new AppError(message, 400, 'VALIDATION_ERROR'),
    
  timeout: (message: string = '請求超時') => 
    new AppError(message, 408, 'TIMEOUT'),
    
  payloadTooLarge: (message: string = '請求載荷過大') => 
    new AppError(message, 413, 'PAYLOAD_TOO_LARGE')
};

/**
 * 業務邏輯相關的特定錯誤
 */
export const businessErrors = {
  jobNotFound: (jobId: string) => 
    new AppError(`分析任務 ${jobId} 不存在`, 404, 'JOB_NOT_FOUND'),
    
  costLimitExceeded: (current: number, limit: number) => 
    new AppError(
      `每日成本限制已超出：$${current.toFixed(4)} >= $${limit}`,
      429,
      'COST_LIMIT_EXCEEDED'
    ),
    
  analysisInProgress: (jobId: string) => 
    new AppError(`分析任務 ${jobId} 正在進行中，請稍後查詢`, 409, 'ANALYSIS_IN_PROGRESS'),
    
  scraperBlocked: (url: string) => 
    new AppError(`無法訪問網頁 ${url}，可能被反爬蟲機制阻止`, 503, 'SCRAPER_BLOCKED'),
    
  aiServiceError: (service: string) => 
    new AppError(`AI 服務 ${service} 暫時不可用，請稍後重試`, 503, 'AI_SERVICE_ERROR'),
    
  promptNotFound: (category: string, version: string) => 
    new AppError(`找不到 ${category} 類別的 ${version} 版本提示`, 404, 'PROMPT_NOT_FOUND'),
    
  invalidKeyword: (keyword: string) => 
    new AppError(`關鍵字 "${keyword}" 格式不正確或包含非法字符`, 400, 'INVALID_KEYWORD'),
    
  urlNotAccessible: (url: string) => 
    new AppError(`無法訪問 URL: ${url}`, 400, 'URL_NOT_ACCESSIBLE')
};

/**
 * 錯誤統計追蹤
 */
class ErrorTracker {
  private errorCounts: Map<string, number> = new Map();
  private _lastReset: Date = new Date();
  
  track(errorCode: string): void {
    const current = this.errorCounts.get(errorCode) || 0;
    this.errorCounts.set(errorCode, current + 1);
  }
  
  getStats(): Record<string, number> {
    return Object.fromEntries(this.errorCounts);
  }
  
  reset(): void {
    this.errorCounts.clear();
    this._lastReset = new Date();
  }
  
  shouldAlert(errorCode: string, threshold: number = 10): boolean {
    const count = this.errorCounts.get(errorCode) || 0;
    return count >= threshold;
  }
  
  get lastReset(): Date {
    return this._lastReset;
  }
}

export const errorTracker = new ErrorTracker();

/**
 * 錯誤回復策略
 */
export const retryWithBackoff = async (
  fn: () => Promise<any>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<any> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        logger.error(`Operation failed after ${maxRetries} attempts:`, lastError);
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      logger.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, lastError.message);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
};

/**
 * 健康檢查錯誤處理
 */
export const healthCheck = {
  database: async (): Promise<boolean> => {
    try {
      // 添加數據庫健康檢查邏輯
      return true;
    } catch (error) {
      logger.error('Database health check failed:', error);
      return false;
    }
  },
  
  redis: async (): Promise<boolean> => {
    try {
      // 添加 Redis 健康檢查邏輯
      return true;
    } catch (error) {
      logger.error('Redis health check failed:', error);
      return false;
    }
  },
  
  openai: async (): Promise<boolean> => {
    try {
      // 添加 OpenAI API 健康檢查邏輯
      return true;
    } catch (error) {
      logger.error('OpenAI API health check failed:', error);
      return false;
    }
  }
};