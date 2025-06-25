/**
 * AIO-Auditor v5.1 測試控制器
 * 提供測試執行和管理的 API 端點
 */

import { Request, Response, NextFunction } from 'express';
import { testingService } from '../services/testingService';
import { goldenTestSet } from '../tests/goldenTestSet';
import logger from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

class TestController {
  /**
   * 執行完整測試套件
   */
  async runFullTestSuite(_req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      logger.info('Starting full test suite execution via API');
      
      // 檢查是否在開發環境
      if (process.env.NODE_ENV === 'production') {
        throw new AppError('Test execution is only allowed in development environment', 403, 'TEST_DISABLED');
      }
      
      const testSuite = await testingService.runFullTestSuite();
      
      return res.json({
        success: true,
        data: testSuite,
        report: testingService.generateTestReport(testSuite)
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * 執行特定類別的測試
   */
  async runCategoryTests(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { category } = req.params;
      
      if (!['content_refinement', 'main_analysis'].includes(category)) {
        throw new AppError('Invalid category. Must be content_refinement or main_analysis', 400, 'VALIDATION_ERROR');
      }
      
      if (process.env.NODE_ENV === 'production') {
        throw new AppError('Test execution is only allowed in development environment', 403, 'TEST_DISABLED');
      }
      
      logger.info(`Starting ${category} test execution via API`);
      
      const results = await testingService.runCategoryTests(category as 'content_refinement' | 'main_analysis');
      
      const passed = results.filter(r => r.success).length;
      const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
      
      return res.json({
        success: true,
        data: {
          category,
          totalTests: results.length,
          passedTests: passed,
          failedTests: results.length - passed,
          averageScore: avgScore,
          results,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * 獲取黃金測試集信息
   */
  async getGoldenTestSet(_req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const statistics = goldenTestSet.getStatistics();
      const allTestCases = goldenTestSet.getAllTestCases();
      
      return res.json({
        success: true,
        data: {
          statistics,
          testCases: allTestCases.map(testCase => ({
            id: testCase.id,
            name: testCase.name,
            description: testCase.description,
            category: testCase.category,
            metadata: testCase.metadata,
            qualityMetrics: {
              minContentLength: testCase.qualityMetrics.minContentLength,
              requiredElementsCount: testCase.qualityMetrics.requiredElements.length,
              forbiddenElementsCount: testCase.qualityMetrics.forbiddenElements.length
            }
          }))
        }
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * 獲取特定測試案例詳情
   */
  async getTestCaseById(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { testId } = req.params;
      
      const testCase = goldenTestSet.getTestCaseById(testId);
      
      if (!testCase) {
        throw new AppError('Test case not found', 404, 'TEST_CASE_NOT_FOUND');
      }
      
      return res.json({
        success: true,
        data: testCase
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * 執行單個測試案例
   */
  async runSingleTest(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { testId } = req.params;
      
      if (process.env.NODE_ENV === 'production') {
        throw new AppError('Test execution is only allowed in development environment', 403, 'TEST_DISABLED');
      }
      
      const testCase = goldenTestSet.getTestCaseById(testId);
      
      if (!testCase) {
        throw new AppError('Test case not found', 404, 'TEST_CASE_NOT_FOUND');
      }
      
      logger.info(`Running single test: ${testCase.name}`);
      
      const result = await testingService.runSingleTest(testCase);
      
      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * 驗證 Prompt 品質
   */
  async validatePromptQuality(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { category, sampleSize = 3 } = req.body;
      
      if (!['content_refinement', 'main_analysis'].includes(category)) {
        throw new AppError('Invalid category. Must be content_refinement or main_analysis', 400, 'VALIDATION_ERROR');
      }
      
      if (process.env.NODE_ENV === 'production') {
        throw new AppError('Test execution is only allowed in development environment', 403, 'TEST_DISABLED');
      }
      
      logger.info(`Validating prompt quality for ${category} with ${sampleSize} samples`);
      
      const testCases = goldenTestSet.getTestCasesByCategory(category);
      const selectedTests = testCases.slice(0, Math.min(sampleSize, testCases.length));
      
      const results = [];
      for (const testCase of selectedTests) {
        const result = await testingService.runSingleTest(testCase);
        results.push(result);
        
        // 短暫延遲
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      const passed = results.filter(r => r.success).length;
      const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
      
      const qualityAssessment = {
        category,
        sampleSize: results.length,
        passRate: passed / results.length,
        averageScore: avgScore,
        recommendation: avgScore >= 0.8 ? 'Excellent' : avgScore >= 0.6 ? 'Good' : 'Needs Improvement',
        issues: results.filter(r => !r.success).map(r => ({
          testId: r.testCaseId,
          errors: r.errors,
          warnings: r.warnings
        }))
      };
      
      return res.json({
        success: true,
        data: {
          qualityAssessment,
          detailedResults: results,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * 比較不同 Prompt 版本的性能
   */
  async comparePromptVersions(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { category } = req.body;
      
      if (!['content_refinement', 'main_analysis'].includes(category)) {
        throw new AppError('Invalid category', 400, 'VALIDATION_ERROR');
      }
      
      if (process.env.NODE_ENV === 'production') {
        throw new AppError('Test execution is only allowed in development environment', 403, 'TEST_DISABLED');
      }
      
      // 這裡可以實現版本比較邏輯
      // 目前返回當前版本的結果
      const currentResults = await testingService.runCategoryTests(category);
      
      return res.json({
        success: true,
        data: {
          category,
          currentVersion: '2.0.0',
          results: currentResults,
          comparison: {
            note: 'Version comparison feature will be implemented when multiple versions are available'
          }
        }
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const testController = new TestController();