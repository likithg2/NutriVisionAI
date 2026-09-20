



import { Router } from 'express';
import {
  list,
  getAll,
  markRead,
  markMany,
  removeOne,
  stats,
  getPrefs,
  updatePrefs,
  sendTest
} from '../controllers/notificationController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import Notification from '../models/Notification.js';
import { addSubscription } from '../utils/push.js';

const router = Router();

/** Save a browser push subscription (in-memory for now) */
router.post('/subscribe', requireAuth, (req, res) => {
  try {
    addSubscription(req.body); // raw PushSubscription JSON
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: 'Invalid subscription' });
  }
});

/** New, powerful list endpoint (filters + pagination) */
router.get('/', requireAuth, list);

/** Legacy endpoints kept for compatibility */
router.get('/get-all', requireAuth, getAll);
router.post('/mark-read', requireAuth, markRead);

/** Added: unread count for the bell */
router.get('/unread-count', requireAuth, async (req, res, next) => {
  try {
    const count = await Notification.count({ where: { userId: req.user.id, read: false } });
    res.json({ count });
  } catch (err) {
    next(err);
  }
});

/** New: bulk mark read/unread */
router.patch('/mark', requireAuth, markMany);

/** New: delete one notification */
router.delete('/:id', requireAuth, removeOne);

/** New: stats (total + unread) */
router.get('/stats', requireAuth, stats);

/** New: preferences get/update */
router.get('/prefs', requireAuth, getPrefs);
router.put('/prefs', requireAuth, updatePrefs);

/** Optional */
router.post('/send-test', requireAuth, sendTest);

export default router;
