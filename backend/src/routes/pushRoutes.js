// src/routes/pushRoutes.js
import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { addSubscription } from '../utils/push.js';

const router = Router();

/** Save a browser push subscription (in-memory for now) */
router.post('/subscribe', requireAuth, (req, res) => {
  try {
    const sub = req.body;
    if (!sub || !sub.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
      return res.status(400).json({ error: 'Invalid subscription' });
    }
    // Save subscription associated with the authenticated user
    addSubscription(sub, req.user?.id || null);
    return res.json({ ok: true });
  } catch (e) {
    console.error('[pushRoutes] subscribe error', e);
    return res.status(500).json({ error: 'Failed to save subscription' });
  }
});

export default router;
