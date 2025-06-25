import { Router } from 'express';
import { analysisController } from '../controllers/analysisController';
import { validateAnalysisRequest } from '../middleware/validation';

const router = Router();

// Start a new analysis
router.post('/start', validateAnalysisRequest, analysisController.startAnalysis);

// Get analysis status
router.get('/status/:analysisId', analysisController.getAnalysisStatus);

// Get analysis result
router.get('/result/:analysisId', analysisController.getAnalysisResult);

// Clear cache (development only)
router.delete('/cache', analysisController.clearCache);

export default router;