import { Router } from 'express';
import { analysisController } from '../controllers/analysisController';
import { validateAnalysisRequest } from '../middleware/validation';

const router = Router();

// v5.1 API 端點 - 標準化 RESTful 設計

// POST /api/analyze - 創建分析任務
router.post('/analyze', validateAnalysisRequest, analysisController.startAnalysis);

// GET /api/results/{jobId} - 獲取任務結果（包含狀態）
router.get('/results/:jobId', analysisController.getAnalysisResult);

// GET /api/queue/stats - 獲取佇列統計信息（管理用）
router.get('/queue/stats', analysisController.getQueueStats);

// GET /api/costs/daily - 獲取成本統計信息（v5.1 新增）
router.get('/costs/daily', analysisController.getCostStats);

// GET /api/prompts - 獲取 Prompt 版本信息（v5.1 新增）
router.get('/prompts', analysisController.getPromptVersions);

// POST /api/prompts/switch - 切換 Prompt 版本（v5.1 新增）
router.post('/prompts/switch', analysisController.switchPromptVersion);

// DELETE /api/cache - 清理快取（開發用）
router.delete('/cache', analysisController.clearCache);

// 向後兼容的舊端點（可選）
router.post('/start', validateAnalysisRequest, analysisController.startAnalysis);
router.get('/result/:jobId', analysisController.getAnalysisResult);

export default router;