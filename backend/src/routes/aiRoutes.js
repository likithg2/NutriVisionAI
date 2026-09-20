// src/routes/aiRoutes.js
import { Router } from 'express';
import { chat, kitchenRecipe, shoppingRecommendations, dashboardSuggestions } from '../controllers/aiController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// POST /api/chat
router.post('/', requireAuth, chat);

// POST /api/chat/kitchen
router.post('/kitchen', requireAuth, kitchenRecipe);

// POST /api/chat/recommendations
router.post('/recommendations', requireAuth, shoppingRecommendations);

// GET /api/chat/dashboard-suggestions
router.get('/dashboard-suggestions', requireAuth, dashboardSuggestions);

export default router;
