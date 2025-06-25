import { v4 as uuidv4 } from 'uuid';
import { queueService, AnalysisJobData, JobStatus } from './queueService';
import { AnalysisRequest } from '../types';
import logger from '../utils/logger';

/**
 * 任務管理器 - 負責任務的創建、狀態查詢和生命週期管理
 */
class JobManager {
  
  /**
   * 創建新的分析任務
   */
  async createAnalysisJob(request: AnalysisRequest): Promise<string> {
    try {
      // 生成唯一任務 ID
      const jobId = uuidv4();
      
      // 驗證請求數據
      this.validateAnalysisRequest(request);
      
      // 構建任務數據
      const jobData: AnalysisJobData = {
        ...request,
        jobId,
        createdAt: new Date().toISOString(),
      };
      
      // 添加到佇列
      await queueService.addAnalysisJob(jobData);
      
      logger.info(`Created analysis job ${jobId} for keyword: ${request.targetKeyword}`);
      
      return jobId;
    } catch (error) {
      logger.error('Failed to create analysis job:', error);
      throw error;
    }
  }
  
  /**
   * 獲取任務狀態
   */
  async getJobStatus(jobId: string): Promise<JobStatus | null> {
    try {
      return await queueService.getJobStatus(jobId);
    } catch (error) {
      logger.error(`Failed to get status for job ${jobId}:`, error);
      throw error;
    }
  }
  
  /**
   * 更新任務進度
   */
  async updateJobProgress(jobId: string, progress: number, stage?: string): Promise<void> {
    try {
      await queueService.updateJobProgress(jobId, progress);
      
      if (stage) {
        logger.info(`Job ${jobId} - ${stage}: ${progress}%`);
      }
    } catch (error) {
      logger.error(`Failed to update progress for job ${jobId}:`, error);
    }
  }
  
  /**
   * 獲取佇列統計信息
   */
  async getQueueStats() {
    try {
      return await queueService.getQueueStats();
    } catch (error) {
      logger.error('Failed to get queue stats:', error);
      throw error;
    }
  }
  
  /**
   * 驗證分析請求
   */
  private validateAnalysisRequest(request: AnalysisRequest): void {
    // 驗證必要字段
    if (!request.targetKeyword || request.targetKeyword.trim().length === 0) {
      throw new Error('Target keyword is required');
    }
    
    if (!request.userPageUrl || !this.isValidUrl(request.userPageUrl)) {
      throw new Error('Valid user page URL is required');
    }
    
    // 驗證競爭者 URL（如果提供）
    if (request.competitorUrls && request.competitorUrls.length > 0) {
      for (const url of request.competitorUrls) {
        if (!this.isValidUrl(url)) {
          throw new Error(`Invalid competitor URL: ${url}`);
        }
      }
      
      // 限制競爭者 URL 數量
      if (request.competitorUrls.length > 20) {
        throw new Error('Too many competitor URLs (maximum 20 allowed)');
      }
    }
    
    // 驗證關鍵詞長度
    if (request.targetKeyword.length > 200) {
      throw new Error('Target keyword is too long (maximum 200 characters)');
    }
  }
  
  /**
   * 驗證 URL 格式
   */
  private isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }
  
  /**
   * 清理過期任務
   */
  async cleanupOldJobs(): Promise<void> {
    try {
      await queueService.cleanOldJobs();
      logger.info('Old jobs cleanup completed');
    } catch (error) {
      logger.error('Failed to cleanup old jobs:', error);
    }
  }
  
  /**
   * 獲取任務歷史記錄（用於調試）
   */
  async getJobHistory(limit: number = 10) {
    try {
      const stats = await this.getQueueStats();
      logger.info(`Queue stats: ${JSON.stringify(stats)}`);
      return stats;
    } catch (error) {
      logger.error('Failed to get job history:', error);
      throw error;
    }
  }
}

// 導出單例實例
export const jobManager = new JobManager();

// 定期清理任務（每小時執行一次）
setInterval(async () => {
  try {
    await jobManager.cleanupOldJobs();
  } catch (error) {
    logger.error('Scheduled cleanup failed:', error);
  }
}, 60 * 60 * 1000); // 1 小時