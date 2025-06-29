import { Router } from 'express';
import { analysisController } from '../controllers/analysisController';
import { exportController } from '../controllers/exportController';
import { validateAnalysisRequest } from '../middleware/validation';
import { analysisRateLimiter, adminRateLimiter } from '../middleware/rateLimiter';
import { methodValidator, apiKeyAuth } from '../middleware/security';

const router = Router();

// v5.1 API 端點 - 標準化 RESTful 設計 + 安全強化

// POST /api/analyze - 創建分析任務（嚴格速率限制）
router.post('/analyze', 
  analysisRateLimiter,
  methodValidator(['POST']),
  validateAnalysisRequest, 
  analysisController.startAnalysis
);

// GET /api/results/{jobId} - 獲取任務結果（包含狀態）
router.get('/results/:jobId', 
  methodValidator(['GET']),
  analysisController.getAnalysisResult
);

// GET /api/queue/stats - 獲取佇列統計信息（管理用，需要 API Key）
router.get('/queue/stats', 
  adminRateLimiter,
  methodValidator(['GET']),
  apiKeyAuth,
  analysisController.getQueueStats
);

// GET /api/costs/daily - 獲取成本統計信息（v5.1 新增）
router.get('/costs/daily', 
  methodValidator(['GET']),
  analysisController.getCostStats
);

// GET /api/prompts - 獲取 Prompt 版本信息（v5.1 新增）
router.get('/prompts', 
  methodValidator(['GET']),
  analysisController.getPromptVersions
);

// POST /api/prompts/switch - 切換 Prompt 版本（v5.1 新增，需要 API Key）
router.post('/prompts/switch', 
  adminRateLimiter,
  methodValidator(['POST']),
  apiKeyAuth,
  analysisController.switchPromptVersion
);

// DELETE /api/cache - 清理快取（開發用，需要 API Key）
router.delete('/cache', 
  adminRateLimiter,
  methodValidator(['DELETE']),
  apiKeyAuth,
  analysisController.clearCache
);

// Export endpoints (v6.0 新增)
// GET /api/export/pdf/{jobId} - 匯出 PDF 報告
router.get('/export/pdf/:jobId',
  methodValidator(['GET']),
  exportController.exportPDF
);

// GET /api/export/html/{jobId} - 匯出 HTML 報告
router.get('/export/html/:jobId',
  methodValidator(['GET']),
  exportController.exportHTML
);

// 向後兼容的舊端點（帶有安全限制）
router.post('/start', 
  analysisRateLimiter,
  methodValidator(['POST']),
  validateAnalysisRequest, 
  analysisController.startAnalysis
);
router.get('/result/:jobId', 
  methodValidator(['GET']),
  analysisController.getAnalysisResult
);

export default router;