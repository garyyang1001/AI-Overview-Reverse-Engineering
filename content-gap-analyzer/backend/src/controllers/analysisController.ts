import { Request, Response, NextFunction } from 'express';
import { jobManager } from '../services/jobManager';
import { cacheService } from '../services/cacheService';
import logger from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { AnalysisRequest } from '../types';

class AnalysisController {
  async startAnalysis(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const analysisRequest: AnalysisRequest = req.body;
      
      // 驗證請求數據
      if (!analysisRequest.targetKeyword || !analysisRequest.userPageUrl) {
        throw new AppError('Target keyword and user page URL are required', 400, 'VALIDATION_ERROR');
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
            fromCache: true,
            data: JSON.parse(cachedResult)
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
  
  async getAnalysisResult(req: Request, res: Response, next: NextFunction): Promise<any> {
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
      const response: any = {
        jobId: jobStatus.id,
        status: jobStatus.status,
        progress: jobStatus.progress,
        createdAt: jobStatus.createdAt,
        startedAt: jobStatus.startedAt,
        completedAt: jobStatus.completedAt,
      };
      
      // 根據狀態添加相應數據
      switch (jobStatus.status) {
        case 'completed':
          response.data = jobStatus.data;
          
          // 儲存結果到快取（如果是成功完成的）
          if (jobStatus.data && jobStatus.data.targetKeyword && jobStatus.data.userPageUrl) {
            const cacheKey = `analysis:${jobStatus.data.targetKeyword}:${jobStatus.data.userPageUrl}`;
            await cacheService.set(cacheKey, JSON.stringify(jobStatus.data), 86400); // 24 小時
          }
          break;
          
        case 'completed_with_errors':
          response.data = jobStatus.data;
          response.warnings = jobStatus.warnings;
          break;
          
        case 'failed':
          response.error = jobStatus.error;
          break;
          
        case 'processing':
          response.message = '分析正在進行中，請稍後再次檢查狀態';
          break;
          
        case 'pending':
          response.message = '任務在佇列中等待處理';
          break;
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
}

export const analysisController = new AnalysisController();