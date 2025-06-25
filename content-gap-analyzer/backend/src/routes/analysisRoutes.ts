import { Router } from 'express';
import { analysisController } from '../controllers/analysisController';
import { validateAnalysisRequest } from '../middleware/validation';

const router = Router();

// v5.1 API 端點 - 標準化 RESTful 設計

// POST /api/analyze - 創建分析任務
router.post('/', validateAnalysisRequest, analysisController.startAnalysis);

// GET /api/results/{jobId} - 獲取任務結果（包含狀態）
router.get('/results/:jobId', analysisController.getAnalysisResult);

// GET /api/queue/stats - 獲取佇列統計信息（管理用）
router.get('/queue/stats', analysisController.getQueueStats);

// DELETE /api/cache - 清理快取（開發用）
router.delete('/cache', analysisController.clearCache);

// 向後兼容的舊端點（可選）
router.post('/start', validateAnalysisRequest, analysisController.startAnalysis);
router.get('/result/:jobId', analysisController.getAnalysisResult);

export default router;