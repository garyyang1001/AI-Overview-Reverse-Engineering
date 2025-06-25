import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { analysisService } from '../services/analysisService';
import { cacheService } from '../services/cacheService';
import logger from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { AnalysisRequest } from '../types';

class AnalysisController {
  async startAnalysis(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const analysisRequest: AnalysisRequest = req.body;
      const analysisId = randomUUID();
      
      // Check cache first (skip in development mode or if force refresh requested)
      const forceRefresh = req.body.forceRefresh || false;
      const skipCache = process.env.NODE_ENV === 'development' || forceRefresh;
      const cacheKey = `analysis:${analysisRequest.targetKeyword}:${analysisRequest.userPageUrl}`;
      
      if (!skipCache) {
        const cachedResult = await cacheService.get(cacheKey);
        
        if (cachedResult) {
          logger.info(`Returning cached result for ${cacheKey}`);
          return res.json({
            analysisId,
            status: 'completed',
            fromCache: true,
            result: JSON.parse(cachedResult)
          });
        }
      } else {
        logger.info('Skipping cache due to development mode or force refresh');
      }
      
      // Start async analysis
      analysisService.performAnalysis(analysisId, analysisRequest)
        .then(result => {
          logger.info(`Analysis completed: ${analysisId}`);
          // Cache the result
          if (!skipCache) {
            cacheService.set(cacheKey, JSON.stringify(result), 86400); // 24 hours
          }
        })
        .catch(error => {
          logger.error(`Analysis failed: ${analysisId}`, error);
        });
      
      return res.status(202).json({
        analysisId,
        status: 'processing',
        message: 'Analysis started. Check status endpoint for updates.'
      });
    } catch (error) {
      return next(error);
    }
  }
  
  async getAnalysisStatus(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { analysisId } = req.params;
      const status = await analysisService.getAnalysisStatus(analysisId);
      
      if (!status) {
        throw new AppError('Analysis not found', 404, 'NOT_FOUND');
      }
      
      return res.json(status);
    } catch (error) {
      return next(error);
    }
  }
  
  async getAnalysisResult(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { analysisId } = req.params;
      const result = await analysisService.getAnalysisResult(analysisId);
      
      if (!result) {
        throw new AppError('Analysis result not found', 404, 'NOT_FOUND');
      }
      
      return res.json(result);
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