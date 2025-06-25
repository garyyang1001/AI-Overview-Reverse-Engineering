/**
 * AIO-Auditor v5.1 錯誤處理類型定義
 * 實現分層錯誤傳播系統：[Playwright Error] → [Worker Classification] → [BullMQ Status] → [API Translation] → [Frontend Display]
 */

// Playwright 層級錯誤類型
export type PlaywrightErrorType = 
  | 'TimeoutError'
  | 'NavigationError' 
  | 'SelectorNotFound'
  | 'AntiScraping'
  | 'UnexpectedContent';

// Worker 層級錯誤分類
export type WorkerErrorType =
  | 'SCRAPING_FAILED'
  | 'CONTENT_REFINEMENT_FAILED'
  | 'AI_ANALYSIS_FAILED'
  | 'SERPAPI_FAILED'
  | 'VALIDATION_ERROR'
  | 'SYSTEM_ERROR';

// BullMQ 任務狀態
export type JobStatusType = 
  | 'pending'
  | 'processing' 
  | 'completed'
  | 'completed_with_errors'
  | 'failed';

// API 層級錯誤代碼
export type ApiErrorCode =
  | 'JOB_NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE';

// 前端顯示錯誤等級
export type FrontendErrorLevel = 'info' | 'warning' | 'error' | 'critical';

/**
 * 統一錯誤介面
 */
export interface AIOError {
  code: string;
  message: string;
  level: FrontendErrorLevel;
  details?: any;
  timestamp: string;
  jobId?: string;
  stage?: string;
}

/**
 * Playwright 錯誤詳情
 */
export interface PlaywrightErrorDetail {
  type: PlaywrightErrorType;
  url: string;
  message: string;
  httpStatus?: number;
  retryable: boolean;
  suggestedAction?: string;
}

/**
 * Worker 處理步驟錯誤
 */
export interface WorkerStepError {
  step: string;
  type: WorkerErrorType;
  message: string;
  playwrightErrors?: PlaywrightErrorDetail[];
  canContinue: boolean;
  fallbackUsed?: boolean;
}

/**
 * 任務完成狀態（含部分失敗）
 */
export interface JobCompletionStatus {
  status: JobStatusType;
  completedSteps: string[];
  failedSteps: string[];
  warnings: WorkerStepError[];
  errors: WorkerStepError[];
  qualityScore: number;
  fallbacksUsed: string[];
}

/**
 * 錯誤恢復策略
 */
export interface ErrorRecoveryStrategy {
  type: 'retry' | 'fallback' | 'skip' | 'abort';
  maxRetries?: number;
  retryDelay?: number;
  fallbackAction?: string;
  skipCondition?: string;
}

/**
 * 錯誤統計（用於監控）
 */
export interface ErrorStatistics {
  totalErrors: number;
  errorsByType: Record<WorkerErrorType, number>;
  errorsByStep: Record<string, number>;
  recoverySuccessRate: number;
  averageQualityScore: number;
  timestamp: string;
}