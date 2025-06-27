import { Queue, Job, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import logger from '../utils/logger';
import { AnalysisRequest, AnalysisResult } from '../types';

// 定義任務數據類型
export interface AnalysisJobData extends AnalysisRequest {
  jobId: string;
  createdAt: string;
}

// 定義任務狀態類型
export interface JobStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'completed_with_errors';
  progress?: number;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  warnings?: Array<{
    code: string;
    message: string;
    details?: string;
  }>;
  data?: AnalysisResult;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  targetKeyword?: string; // Added for caching purposes
  userPageUrl?: string; // Added for caching purposes
}

class QueueService {
  private analysisQueue: Queue<AnalysisJobData>;
  private queueEvents: QueueEvents;
  private redisConnection: IORedis;

  constructor() {
    // 創建專用的 Redis 連接給 BullMQ
    this.redisConnection = new IORedis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    // 初始化分析任務佇列
    this.analysisQueue = new Queue<AnalysisJobData>('analysis', {
      connection: this.redisConnection,
      defaultJobOptions: {
        removeOnComplete: 10, // 保留最近 10 個完成的任務
        removeOnFail: 50,     // 保留最近 50 個失敗的任務
        attempts: 3,          // 重試 3 次
        backoff: {
          type: 'exponential',
          delay: 2000,        // 指數退避，起始延遲 2 秒
        },
      },
    });

    // 初始化佇列事件監聽 - BullMQ 需要獨立的連接
    this.queueEvents = new QueueEvents('analysis', {
      connection: new IORedis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
      }),
    });

    this.setupEventListeners();
  }

  /**
   * 設置佇列事件監聽
   */
  private setupEventListeners(): void {
    this.queueEvents.on('waiting', ({ jobId }) => {
      logger.info(`Job ${jobId} is waiting in queue`);
    });

    this.queueEvents.on('active', ({ jobId }) => {
      logger.info(`Job ${jobId} started processing`);
    });

    this.queueEvents.on('completed', ({ jobId }) => {
      logger.info(`Job ${jobId} completed successfully`);
    });

    this.queueEvents.on('failed', ({ jobId, failedReason }) => {
      logger.error(`Job ${jobId} failed: ${failedReason}`);
    });

    this.queueEvents.on('progress', ({ jobId, data }) => {
      logger.debug(`Job ${jobId} progress: ${data}%`);
    });
  }

  /**
   * 添加分析任務到佇列
   */
  async addAnalysisJob(jobData: AnalysisJobData): Promise<Job<AnalysisJobData>> {
    try {
      const job = await this.analysisQueue.add('analyze', jobData, {
        jobId: jobData.jobId,
        priority: 1, // 默認優先級
      });

      logger.info(`Analysis job ${jobData.jobId} added to queue`);
      return job;
    } catch (error) {
      logger.error('Failed to add job to queue:', error);
      throw error;
    }
  }

  /**
   * 獲取任務狀態
   */
  async getJobStatus(jobId: string): Promise<JobStatus | null> {
    try {
      const job = await this.analysisQueue.getJob(jobId);
      
      if (!job) {
        return null;
      }

      const state = await job.getState();
      const progress = job.progress as number;
      const result = job.returnvalue;
      const error = job.failedReason;

      const status: JobStatus = {
        id: job.id!,
        status: this.mapJobState(state),
        progress: progress || 0,
        createdAt: new Date(job.timestamp).toISOString(),
        startedAt: job.processedOn ? new Date(job.processedOn).toISOString() : undefined,
        completedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : undefined,
      };

      // 處理錯誤情況
      if (error) {
        status.error = {
          code: 'ANALYSIS_FAILED',
          message: '分析過程中發生錯誤',
          details: error,
        };
      }

      // 處理完成情況
      if (result) {
        status.data = result;
        
        // 檢查是否有警告
        if (result.warnings && result.warnings.length > 0) {
          status.status = 'completed_with_errors';
          status.warnings = result.warnings;
        }
      }

      return status;
    } catch (error) {
      logger.error(`Failed to get job status for ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * 更新任務進度
   */
  async updateJobProgress(jobId: string, progress: number): Promise<void> {
    try {
      const job = await this.analysisQueue.getJob(jobId);
      if (job) {
        await job.updateProgress(progress);
        logger.debug(`Updated job ${jobId} progress to ${progress}%`);
      }
    } catch (error) {
      logger.error(`Failed to update job progress for ${jobId}:`, error);
    }
  }

  /**
   * 映射 BullMQ 任務狀態到自定義狀態
   */
  private mapJobState(state: string): JobStatus['status'] {
    switch (state) {
      case 'waiting':
      case 'delayed':
        return 'pending';
      case 'active':
        return 'processing';
      case 'completed':
        return 'completed';
      case 'failed':
        return 'failed';
      default:
        return 'pending';
    }
  }

  /**
   * 獲取佇列統計信息
   */
  async getQueueStats() {
    try {
      const waiting = await this.analysisQueue.getWaiting();
      const active = await this.analysisQueue.getActive();
      const completed = await this.analysisQueue.getCompleted();
      const failed = await this.analysisQueue.getFailed();

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
      };
    } catch (error) {
      logger.error('Failed to get queue stats:', error);
      throw error;
    }
  }

  /**
   * 清理舊任務
   */
  async cleanOldJobs(): Promise<void> {
    try {
      // 清理 24 小時前的完成任務
      await this.analysisQueue.clean(24 * 60 * 60 * 1000, 10, 'completed');
      
      // 清理 7 天前的失敗任務
      await this.analysisQueue.clean(7 * 24 * 60 * 60 * 1000, 50, 'failed');
      
      logger.info('Cleaned old jobs from queue');
    } catch (error) {
      logger.error('Failed to clean old jobs:', error);
    }
  }

  /**
   * 優雅關閉佇列服務
   */
  async shutdown(): Promise<void> {
    try {
      await this.queueEvents.close();
      await this.analysisQueue.close();
      await this.redisConnection.quit();
      logger.info('Queue service shutdown completed');
    } catch (error) {
      logger.error('Error during queue service shutdown:', error);
    }
  }
}

// 導出單例實例
export const queueService = new QueueService();