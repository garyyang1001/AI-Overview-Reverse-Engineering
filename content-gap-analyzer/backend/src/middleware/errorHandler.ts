import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { errorTracker } from '../utils/errorUtils';

export class AppError extends Error {
  statusCode: number;
  code: string;
  
  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 統一錯誤處理中間件
 * 實現標準化的錯誤回應格式
 */
export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const errorCode = getErrorCode(error);
  
  // 記錄錯誤詳情
  logger.error('Unhandled error:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    code: errorCode,
    timestamp: new Date().toISOString()
  });
  
  // 追蹤錯誤統計
  errorTracker.track(errorCode);
  
  // 統一錯誤格式
  const errorResponse = {
    success: false,
    error: {
      code: errorCode,
      message: getErrorMessage(error),
      details: getErrorDetails(error),
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && { 
        stack: error.stack,
        originalError: error.name 
      })
    }
  };
  
  const statusCode = getStatusCode(error);
  res.status(statusCode).json(errorResponse);
};

/**
 * 獲取錯誤狀態碼
 */
function getStatusCode(error: Error | AppError): number {
  if (error instanceof AppError) {
    return error.statusCode;
  }
  
  switch (error.name) {
    case 'ValidationError':
    case 'CastError':
      return 400;
    case 'UnauthorizedError':
      return 401;
    case 'ForbiddenError':
      return 403;
    case 'NotFoundError':
      return 404;
    case 'ConflictError':
      return 409;
    case 'TooManyRequestsError':
      return 429;
    default:
      return 500;
  }
}

/**
 * 獲取錯誤代碼
 */
function getErrorCode(error: Error | AppError): string {
  if (error instanceof AppError) {
    return error.code;
  }
  
  switch (error.name) {
    case 'ValidationError':
      return 'VALIDATION_ERROR';
    case 'CastError':
      return 'INVALID_INPUT';
    case 'UnauthorizedError':
      return 'UNAUTHORIZED';
    case 'ForbiddenError':
      return 'FORBIDDEN';
    case 'NotFoundError':
      return 'NOT_FOUND';
    case 'ConflictError':
      return 'CONFLICT';
    case 'TooManyRequestsError':
      return 'RATE_LIMITED';
    case 'TimeoutError':
      return 'TIMEOUT';
    case 'NetworkError':
      return 'NETWORK_ERROR';
    default:
      return 'INTERNAL_ERROR';
  }
}

/**
 * 獲取用戶友好的錯誤訊息
 */
function getErrorMessage(error: Error | AppError): string {
  if (error instanceof AppError) {
    return error.message;
  }
  
  switch (error.name) {
    case 'ValidationError':
      return '請求數據格式不正確，請檢查輸入';
    case 'CastError':
      return '輸入參數格式無效';
    case 'UnauthorizedError':
      return '認證失敗，請重新登入';
    case 'ForbiddenError':
      return '權限不足，無法執行此操作';
    case 'NotFoundError':
      return '請求的資源不存在';
    case 'ConflictError':
      return '資源衝突，請重試';
    case 'TooManyRequestsError':
      return '請求過於頻繁，請稍後再試';
    case 'TimeoutError':
      return '請求超時，請重試';
    case 'NetworkError':
      return '網路連接失敗，請檢查網路狀態';
    default:
      return '系統發生內部錯誤，技術團隊已收到通知';
  }
}

/**
 * 獲取錯誤詳細信息
 */
function getErrorDetails(error: Error | AppError): any {
  const details: any = {};
  
  // 如果是 ValidationError，提供詳細的驗證錯誤信息
  if (error.name === 'ValidationError' && 'errors' in error) {
    details.validationErrors = error.errors;
  }
  
  // 如果是 CastError，提供類型轉換錯誤信息
  if (error.name === 'CastError' && 'path' in error && 'value' in error) {
    details.field = error.path;
    details.value = error.value;
  }
  
  // 如果是自定義的 AppError，可能包含額外的詳細信息
  if (error instanceof AppError && 'details' in error) {
    details.additional = error.details;
  }
  
  return Object.keys(details).length > 0 ? details : undefined;
}