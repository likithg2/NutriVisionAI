// import { Router } from 'express'
// import { categorySummary, expiryStats } from '../controllers/analyticsController.js'
// import { requireAuth } from '../middleware/authMiddleware.js'

// const router = Router()
// router.get('/category-summary', requireAuth, categorySummary)
// router.get('/expiry-stats', requireAuth, expiryStats)
// export default router
// src/routes/analyticsRoutes.js
import { Router } from 'express'
import { requireAuth } from '../middleware/authMiddleware.js'
import { dashboardAnalytics, categorySummary, expiryStats } from '../controllers/analyticsController.js'

const router = Router()

router.get('/category-summary', requireAuth, categorySummary)
router.get('/expiry-stats', requireAuth, expiryStats)
router.get('/dashboard', requireAuth, dashboardAnalytics)

export default router
