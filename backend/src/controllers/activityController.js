import Activity from '../models/Activity.js'
import { makeActivityPayload } from '../utils/activityHelper.js'

export async function createActivity(req, res, next) {
  try {
    const authUserId = req.user?.id;
    if (!authUserId) return res.status(401).json({ error: 'Unauthorized' });

    const { type, message, meta, createdAt } = req.body;
    if (!type || !message) return res.status(400).json({ error: 'Missing fields: type and message required' });

    const userName = req.user?.name || req.body.userName || req.user?.email || null;

    const payload = makeActivityPayload({
      type,
      message,
      meta,
      userId: authUserId,
      userName,
      createdAt
    });

    const a = await Activity.create(payload);
    res.json({ success: true, activity: a });
  } catch (err) {
    next(err);
  }
}

export async function listActivities(req, res, next) {
  try {
    const limit = Math.min(200, parseInt(req.query.limit || '50', 10) || 50);

    const authUserId = req.user?.id;
    if (!authUserId) return res.status(401).json({ error: 'Unauthorized' });

    const filter = { userId: String(authUserId) };

    if (req.query.type) {
      filter.type = req.query.type;
    }

    const items = await Activity.findAll({
      where: filter,
      order: [['createdAt', 'DESC']],
      limit
    });
    res.json(items);
  } catch (err) {
    next(err);
  }
}
