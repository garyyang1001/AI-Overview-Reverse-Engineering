/**
 * AIO-Auditor v5.1 測試路由
 * 提供測試執行和管理的 API 端點
 */

import { Router } from 'express';
import { testController } from '../controllers/testController';

const router = Router();

// 獲取黃金測試集信息
router.get('/golden-test-set', testController.getGoldenTestSet);

// 獲取特定測試案例詳情
router.get('/test-cases/:testId', testController.getTestCaseById);

// 執行完整測試套件
router.post('/run/full-suite', testController.runFullTestSuite);

// 執行特定類別的測試
router.post('/run/category/:category', testController.runCategoryTests);

// 執行單個測試案例
router.post('/run/single/:testId', testController.runSingleTest);

// 驗證 Prompt 品質
router.post('/validate/prompt-quality', testController.validatePromptQuality);

// 比較 Prompt 版本性能
router.post('/compare/prompt-versions', testController.comparePromptVersions);

// Test Crawl4AI
router.get('/crawl4ai', testController.testCrawl4AI);

export default router;