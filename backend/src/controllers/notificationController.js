import { Op } from 'sequelize';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { sendEmail } from '../utils/mailer.js';
import { sendPushToAll } from '../utils/push.js';

function toInt(v, def, min = 1, max = 100) {
  const n = Number.parseInt(v, 10);
  if (Number.isNaN(n)) return def;
  return Math.min(Math.max(n, min), max);
}

export async function list(req, res, next) {
  try {
    const {
      q = '',
      type = '',
      status = 'all',
      from = '',
      to = '',
      sort = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    const find = { userId: req.user.id };

    if (q) {
      const qStr = String(q).trim();
      find[Op.or] = [
        { title: { [Op.like]: `%${qStr}%` } },
        { message: { [Op.like]: `%${qStr}%` } }
      ];
    }

    if (type && ['email', 'push', 'system'].includes(type)) {
      find.type = type;
    }

    if (status === 'read') find.read = true;
    else if (status === 'unread') find.read = false;

    if (from || to) {
      find.createdAt = {};
      if (from && !Number.isNaN(new Date(from).getTime())) find.createdAt[Op.gte] = new Date(from);
      if (to && !Number.isNaN(new Date(to).getTime())) find.createdAt[Op.lte] = new Date(to);
    }

    const pageNum = toInt(page, 1, 1, 100000);
    const perPage = toInt(limit, 20, 1, 100);
    const skip = (pageNum - 1) * perPage;

    const sortField = ['createdAt', 'title', 'type', 'read'].includes(sort) ? sort : 'createdAt';
    const sortDir = order === 'asc' ? 'ASC' : 'DESC';

    const rows = await Notification.findAll({
      where: find,
      order: [[sortField, sortDir]],
      offset: skip,
      limit: perPage
    });
    const total = await Notification.count({ where: find });

    res.json({
      items: rows,
      total,
      page: pageNum,
      pages: Math.ceil(total / perPage)
    });
  } catch (err) {
    next(err);
  }
}

export async function getAll(req, res, next) {
  try {
    const list = await Notification.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(list);
  } catch (err) {
    next(err);
  }
}

export async function markRead(req, res, next) {
  try {
    const { id } = req.body;
    await Notification.update({ read: true }, { where: { id, userId: req.user.id } });
    const updated = await Notification.findOne({ where: { id, userId: req.user.id } });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function markMany(req, res, next) {
  try {
    const { ids = [], read = true } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids[] required' });
    }
    const [updatedCount] = await Notification.update(
      { read: !!read },
      { where: { id: { [Op.in]: ids }, userId: req.user.id } }
    );
    res.json({ updated: updatedCount, read: !!read });
  } catch (err) {
    next(err);
  }
}

export async function removeOne(req, res, next) {
  try {
    const { id } = req.params;
    const deletedCount = await Notification.destroy({ where: { id, userId: req.user.id } });
    res.json({ deleted: deletedCount > 0 });
  } catch (err) {
    next(err);
  }
}

export async function stats(req, res, next) {
  try {
    const total = await Notification.count({ where: { userId: req.user.id } });
    const unread = await Notification.count({ where: { userId: req.user.id, read: false } });
    res.json({ total, unread });
  } catch (err) {
    next(err);
  }
}

export async function getPrefs(req, res, next) {
  try {
    const user = await User.findByPk(req.user.id, { attributes: ['notificationPrefs'] });
    res.json(
      user?.notificationPrefs || {
        emailEnabled: true,
        expiringSoon: true,
        expired: true,
        digestDaily: false,
        digestWeekly: true
      }
    );
  } catch (err) {
    next(err);
  }
}

export async function updatePrefs(req, res, next) {
  try {
    const {
      emailEnabled = true,
      expiringSoon = true,
      expired = true,
      digestDaily = false,
      digestWeekly = true
    } = req.body || {};

    await User.update({
      notificationPrefs: {
        emailEnabled: !!emailEnabled,
        expiringSoon: !!expiringSoon,
        expired: !!expired,
        digestDaily: !!digestDaily,
        digestWeekly: !!digestWeekly
      }
    }, { where: { id: req.user.id } });

    const user = await User.findByPk(req.user.id, { attributes: ['notificationPrefs'] });
    res.json(user.notificationPrefs);
  } catch (err) {
    next(err);
  }
}

export async function sendTest(req, res, next) {
  try {
    const htmlBody = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #FF6B4A; text-align: center;">NutriVision Test Notification</h2>
        <p style="font-size: 16px; color: #333;">Hello,</p>
        <p style="font-size: 16px; color: #333;">This is a test email to confirm your notification settings are working correctly.</p>
        <div style="background: #fdf8f3; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF6B4A;">
          <p style="margin: 0; color: #E5533D;"><strong>Test Successful!</strong> 🎉</p>
        </div>
      </div>
    `;
    await sendEmail(req.user.email, 'Test Notification', 'This is a test email.', htmlBody);
    await sendPushToAll('Test Push', 'This is a test push message.');
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
