import { Request, Response, NextFunction } from 'express';
import { jobManager } from '../services/jobManager';
import { cacheService } from '../services/cacheService';
import logger from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { AnalysisRequest, StartAnalysisResponse } from '../types'; // Added StartAnalysisResponse
import { costTracker } from '../services/costTracker';
import { promptService } from '../services/promptService';
import { JobStatus } from '../services/queueService'; // Import JobStatus

class AnalysisController {
  async startAnalysis(req: Request, res: Response<StartAnalysisResponse | { error: string }>, next: NextFunction): Promise<any> {
    try {
      const analysisRequest: AnalysisRequest = req.body;
      
      // 驗證請求數據
      if (!analysisRequest.targetKeyword || !analysisRequest.userPageUrl) {
        throw new AppError('Target keyword and user page URL are required', 400, 'VALIDATION_ERROR');
      }

      // v5.1 新增：檢查每日成本限制
      const costCheck = costTracker.checkDailyCostLimit(
        parseFloat(process.env.DAILY_COST_LIMIT || '10.0')
      );
      
      if (costCheck.exceeded) {
        logger.warn(`Daily cost limit exceeded: ${costCheck.current.toFixed(4)} >= ${costCheck.limit}`);
        throw new AppError(
          `Daily API cost limit exceeded (${costCheck.limit}). Please try again tomorrow or contact support.`,
          429,
          'COST_LIMIT_EXCEEDED'
        );
      }
      
      // 檢查快取（可選擇性跳過）
      const forceRefresh = req.body.forceRefresh || false;
      const skipCache = process.env.NODE_ENV === 'development' || forceRefresh;
      const cacheKey = `analysis:${analysisRequest.targetKeyword}:${analysisRequest.userPageUrl}`;
      
      if (!skipCache) {
        const cachedResult = await cacheService.get(cacheKey);
        
        if (cachedResult) {
          logger.info(`Returning cached result for ${cacheKey}`);
          return res.json({
            jobId: `cached-${Date.now()}`,
            status: 'completed',
            message: 'Analysis job completed successfully from cache.',
          });
        }
      }
      
      // 創建新的分析任務
      const jobId = await jobManager.createAnalysisJob(analysisRequest);
      
      logger.info(`Analysis job ${jobId} created for keyword: ${analysisRequest.targetKeyword}`);
      
      return res.status(202).json({
        jobId,
        status: 'pending',
        message: 'Analysis job created successfully. Use /api/results/{jobId} to check status.'
      });
    } catch (error) {
      return next(error);
    }
  }
  
  async getAnalysisResult(req: Request, res: Response<JobStatus | { error: string }>, next: NextFunction): Promise<any> {
    try {
      const { jobId } = req.params;
      
      if (!jobId) {
        throw new AppError('Job ID is required', 400, 'VALIDATION_ERROR');
      }
      
      const jobStatus = await jobManager.getJobStatus(jobId);
      
      if (!jobStatus) {
        throw new AppError('Job not found', 404, 'JOB_NOT_FOUND');
      }
      
      // 構建回應格式
      const response: JobStatus = {
        id: jobStatus.id,
        status: jobStatus.status,
        progress: jobStatus.progress,
        createdAt: jobStatus.createdAt,
        startedAt: jobStatus.startedAt,
        completedAt: jobStatus.completedAt,
        data: jobStatus.data,
        error: jobStatus.error,
        warnings: jobStatus.warnings,
        targetKeyword: jobStatus.targetKeyword,
        userPageUrl: jobStatus.userPageUrl
      };
      
      // 根據狀態添加相應數據
      if (jobStatus.status === 'completed' || jobStatus.status === 'completed_with_errors') {
          // 儲存結果到快取（如果是成功完成的）
          if (jobStatus.data && jobStatus.targetKeyword && jobStatus.userPageUrl) {
            const cacheKey = `analysis:${jobStatus.targetKeyword}:${jobStatus.userPageUrl}`;
            await cacheService.set(cacheKey, JSON.stringify(jobStatus.data), 86400); // 24 小時
          }
      }
      
      return res.json(response);
    } catch (error) {
      return next(error);
    }
  }
  
  async getQueueStats(_req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const stats = await jobManager.getQueueStats();
      
      return res.json({
        queue: stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return next(error);
    }
  }
  
  async clearCache(_req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      // Clear all analysis cache
      await cacheService.clear('analysis:*');
      logger.info('Analysis cache cleared');
      
      return res.json({
        success: true,
        message: 'Cache cleared successfully'
      });
    } catch (error) {
      return next(error);
    }
  }
  
  async getCostStats(_req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const stats = costTracker.getCostStatistics();
      const dailyLimit = parseFloat(process.env.DAILY_COST_LIMIT || '10.0');
      const costCheck = costTracker.checkDailyCostLimit(dailyLimit);
      
      return res.json({
        ...stats,
        dailyLimit,
        dailyLimitExceeded: costCheck.exceeded,
        remainingDailyBudget: Math.max(0, dailyLimit - stats.todaysCost),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return next(error);
    }
  }
  
  async getPromptVersions(_req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const versions = promptService.getAvailableVersions();
      const currentVersions = {
        main_analysis: promptService.getCurrentPrompt('main_analysis')?.version
      };
      
      return res.json({
        availableVersions: versions,
        currentVersions,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return next(error);
    }
  }
  
  async switchPromptVersion(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { category, promptId } = req.body;
      
      if (!category || !promptId) {
        throw new AppError('Category and promptId are required', 400, 'VALIDATION_ERROR');
      }
      
      if (!['content_refinement', 'main_analysis'].includes(category)) {
        throw new AppError('Invalid category. Must be content_refinement or main_analysis', 400, 'VALIDATION_ERROR');
      }
      
      const success = promptService.switchPromptVersion(category, promptId);
      
      if (!success) {
        throw new AppError('Failed to switch prompt version', 400, 'PROMPT_SWITCH_ERROR');
      }
      
      logger.info(`Switched ${category} prompt to version: ${promptId}`);
      
      return res.json({
        success: true,
        message: `Successfully switched ${category} prompt to ${promptId}`,
        currentVersion: (promptService as any).getCurrentPrompt(category)?.version
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const analysisController = new AnalysisController();