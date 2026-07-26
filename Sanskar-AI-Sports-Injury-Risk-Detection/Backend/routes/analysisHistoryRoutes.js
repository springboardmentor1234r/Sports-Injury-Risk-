import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  deleteAnalysisHistory,
  getAnalysisHistory,
  getAnalysisHistoryById,
} from '../controllers/analysisHistoryController.js';

const router = express.Router();

router.use(protect);
router.get('/', getAnalysisHistory);
router.get('/:id', getAnalysisHistoryById);
router.delete('/:id', deleteAnalysisHistory);

export default router;

