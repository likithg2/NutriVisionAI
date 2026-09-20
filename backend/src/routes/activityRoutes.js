// // backend/src/routes/activityRoutes.js
// import { Router } from 'express'
// import { createActivity, listActivities } from '../controllers/activityController.js'

// const router = Router()

// // POST /api/activity  → create (frontend may call this)
// router.post('/', createActivity)

// // GET  /api/activity?limit=50&userId=... → list
// router.get('/', listActivities)

// export default router


// backend/src/routes/activityRoutes.js
import { Router } from 'express'
import { createActivity, listActivities } from '../controllers/activityController.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = Router()

// POST /api/activity  → create (frontend may call this)
router.post('/', requireAuth, createActivity)

// GET  /api/activity?limit=50&type=item:add → list (always scoped to authenticated user)
router.get('/', requireAuth, listActivities)

export default router

