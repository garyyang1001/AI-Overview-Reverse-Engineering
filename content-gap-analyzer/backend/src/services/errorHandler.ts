/**
 * AIO-Auditor v5.1 分層錯誤處理服務
 * 實現錯誤分類、恢復策略和傳播機制
 */

import logger from '../utils/logger';
import { 
  AIOError, 
  PlaywrightErrorType, 
  PlaywrightErrorDetail, 
  WorkerErrorType, 
  WorkerStepError, 
  FrontendErrorLevel,
  ErrorRecoveryStrategy,
  JobCompletionStatus,
  JobStatusType
} from '../types/errors';

class ErrorHandlerService {
  
  /**
   * 將 Playwright 錯誤轉換為 Worker 錯誤
   */
  classifyPlaywrightError(
    playwrightError: PlaywrightErrorType, 
    url: string, 
    details: string,
    httpStatus?: number
  ): PlaywrightErrorDetail {
    const errorDetail: PlaywrightErrorDetail = {
      type: playwrightError,
      url,
      message: details,
      httpStatus,
      retryable: this.isRetryableError(playwrightError),
      suggestedAction: this.getSuggestedAction(playwrightError)
    };

    logger.warn(`Playwright error classified: ${playwrightError} for ${url}`, errorDetail);
    return errorDetail;
  }

  /**
   * 判斷錯誤是否可重試
   */
  private isRetryableError(errorType: PlaywrightErrorType): boolean {
    switch (errorType) {
      case 'TimeoutError':
      case 'NavigationError':
        return true;
      case 'AntiScraping':
      case 'SelectorNotFound':
      case 'UnexpectedContent':
        return false;
      default:
        return false;
    }
  }

  /**
   * 獲取建議的錯誤處理動作
   */
  private getSuggestedAction(errorType: PlaywrightErrorType): string {
    switch (errorType) {
      case 'TimeoutError':
        return '增加超時時間或檢查網路連接';
      case 'NavigationError':
        return '檢查 URL 有效性和網站可訪問性';
      case 'AntiScraping':
        return '該網站使用反爬蟲機制，建議手動檢查內容';
      case 'SelectorNotFound':
        return '網頁結構可能已更改，無法提取有效內容';
      case 'UnexpectedContent':
        return '網頁返回非預期內容類型';
      default:
        return '聯繫技術支援';
    }
  }

  /**
   * 創建 Worker 步驟錯誤
   */
  createWorkerStepError(
    step: string,
    type: WorkerErrorType,
    message: string,
    playwrightErrors: PlaywrightErrorDetail[] = [],
    canContinue: boolean = true
  ): WorkerStepError {
    const stepError: WorkerStepError = {
      step,
      type,
      message,
      playwrightErrors,
      canContinue
    };

    logger.error(`Worker step error: ${step} - ${type}`, stepError);
    return stepError;
  }

  /**
   * 評估任務完成品質
   */
  evaluateJobCompletion(
    completedSteps: string[],
    errors: WorkerStepError[],
    warnings: WorkerStepError[] = []
  ): JobCompletionStatus {
    // const totalSteps = ['serpapi', 'user_scraping', 'competitor_scraping', 'content_refinement', 'ai_analysis'];
    const failedSteps = errors.map(e => e.step);
    const fallbacksUsed = errors.filter(e => e.fallbackUsed).map(e => e.step);

    // 計算品質評分
    let qualityScore = 100;
    
    // 每個失敗步驟扣分
    qualityScore -= failedSteps.length * 20;
    
    // 警告扣輕微分數
    qualityScore -= warnings.length * 5;
    
    // 使用 fallback 扣分
    qualityScore -= fallbacksUsed.length * 10;
    
    qualityScore = Math.max(0, qualityScore);

    // 確定最終狀態
    let status: JobStatusType;
    
    if (failedSteps.includes('serpapi') || failedSteps.includes('user_scraping')) {
      // 關鍵步驟失敗
      status = 'failed';
    } else if (errors.length > 0 || warnings.length > 0) {
      // 有錯誤但可繼續
      status = 'completed_with_errors';
    } else {
      // 完全成功
      status = 'completed';
    }

    const completionStatus: JobCompletionStatus = {
      status,
      completedSteps,
      failedSteps,
      warnings,
      errors,
      qualityScore,
      fallbacksUsed
    };

    logger.info(`Job completion evaluated: ${status} (quality: ${qualityScore})`, completionStatus);
    return completionStatus;
  }

  /**
   * 獲取錯誤恢復策略
   */
  getRecoveryStrategy(error: WorkerStepError): ErrorRecoveryStrategy {
    switch (error.type) {
      case 'SCRAPING_FAILED':
        if (error.playwrightErrors?.some(e => e.retryable)) {
          return {
            type: 'retry',
            maxRetries: 2,
            retryDelay: 5000
          };
        } else {
          return {
            type: 'skip',
            skipCondition: 'Use available competitor data'
          };
        }

      case 'CONTENT_REFINEMENT_FAILED':
        return {
          type: 'fallback',
          fallbackAction: 'Use original content without refinement'
        };

      case 'AI_ANALYSIS_FAILED':
        return {
          type: 'fallback',
          fallbackAction: 'Generate basic analysis template'
        };

      case 'SERPAPI_FAILED':
        return {
          type: 'retry',
          maxRetries: 3,
          retryDelay: 2000
        };

      default:
        return { type: 'abort' };
    }
  }

  /**
   * 轉換為前端友好的錯誤格式
   */
  translateToFrontendError(
    error: WorkerStepError,
    jobId: string
  ): AIOError {
    return {
      code: this.getErrorCode(error.type),
      message: this.getFriendlyMessage(error),
      level: this.getErrorLevel(error.type),
      details: {
        step: error.step,
        playwrightErrors: error.playwrightErrors,
        canContinue: error.canContinue
      },
      timestamp: new Date().toISOString(),
      jobId,
      stage: error.step
    };
  }

  /**
   * 獲取前端錯誤代碼
   */
  private getErrorCode(type: WorkerErrorType): string {
    const codeMap: Record<WorkerErrorType, string> = {
      'SCRAPING_FAILED': 'SCRAPE_ERROR',
      'CONTENT_REFINEMENT_FAILED': 'PROCESSING_ERROR',
      'AI_ANALYSIS_FAILED': 'ANALYSIS_ERROR',
      'SERPAPI_FAILED': 'DATA_FETCH_ERROR',
      'VALIDATION_ERROR': 'INPUT_ERROR',
      'SYSTEM_ERROR': 'SYSTEM_ERROR'
    };
    return codeMap[type] || 'UNKNOWN_ERROR';
  }

  /**
   * 獲取用戶友好的錯誤訊息
   */
  private getFriendlyMessage(error: WorkerStepError): string {
    switch (error.type) {
      case 'SCRAPING_FAILED':
        return '部分網頁內容獲取失敗，但分析將繼續進行';
      case 'CONTENT_REFINEMENT_FAILED':
        return '內容精煉過程遇到問題，將使用原始內容進行分析';
      case 'AI_ANALYSIS_FAILED':
        return 'AI 分析服務暫時不可用，請稍後重試';
      case 'SERPAPI_FAILED':
        return '搜索數據獲取失敗，請檢查關鍵字或稍後重試';
      case 'VALIDATION_ERROR':
        return '輸入數據格式不正確，請檢查後重新提交';
      case 'SYSTEM_ERROR':
        return '系統遇到內部錯誤，技術團隊已收到通知';
      default:
        return '處理過程中遇到未知錯誤';
    }
  }

  /**
   * 獲取錯誤等級
   */
  private getErrorLevel(type: WorkerErrorType): FrontendErrorLevel {
    switch (type) {
      case 'VALIDATION_ERROR':
        return 'warning';
      case 'SCRAPING_FAILED':
      case 'CONTENT_REFINEMENT_FAILED':
        return 'info';
      case 'AI_ANALYSIS_FAILED':
      case 'SERPAPI_FAILED':
        return 'error';
      case 'SYSTEM_ERROR':
        return 'critical';
      default:
        return 'error';
    }
  }

  /**
   * 記錄錯誤統計（用於監控和改進）
   */
  logErrorStatistics(errors: WorkerStepError[]): void {
    const stats = {
      totalErrors: errors.length,
      errorsByType: this.groupErrorsByType(errors),
      errorsByStep: this.groupErrorsByStep(errors),
      timestamp: new Date().toISOString()
    };

    logger.info('Error statistics:', stats);
    
    // 這裡可以添加發送到監控系統的邏輯
    // 例如：await monitoringService.sendErrorStats(stats);
  }

  /**
   * 按類型分組錯誤
   */
  private groupErrorsByType(errors: WorkerStepError[]): Record<WorkerErrorType, number> {
    return errors.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {} as Record<WorkerErrorType, number>);
  }

  /**
   * 按步驟分組錯誤
   */
  private groupErrorsByStep(errors: WorkerStepError[]): Record<string, number> {
    return errors.reduce((acc, error) => {
      acc[error.step] = (acc[error.step] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}

// 導出單例實例
export const errorHandler = new ErrorHandlerService();