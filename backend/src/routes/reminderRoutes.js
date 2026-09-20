// backend/src/routes/reminderRoutes.js
import { Router } from 'express'
import { requireAuth } from '../middleware/authMiddleware.js'
import { getUpcomingReminders } from '../controllers/reminderController.js'

const router = Router()

router.get('/', requireAuth, getUpcomingReminders)

export default router

