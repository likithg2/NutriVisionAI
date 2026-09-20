import express from 'express';
import { getDailyStats, logMeal, deleteMealLog } from '../controllers/calorieController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', getDailyStats);
router.post('/', logMeal);
router.delete('/:id', deleteMealLog);

export default router;
