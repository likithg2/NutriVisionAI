// backend/src/controllers/settingsController.js
import fs from 'fs'
import path from 'path'
import User from '../models/User.js'
import Activity from '../models/Activity.js'
import { notifyUser } from '../utils/notify.js'

/**
 * GET /api/users/me
 */
export async function getMe(req, res, next) {
  try {
    const id = req.user?.id || req.user?._id
    if (!id) return res.status(401).json({ error: 'Unauthorized' })
    const u = await User.findByPk(id, { attributes: { exclude: ['password'] } })
    if (!u) return res.status(404).json({ error: 'User not found' })
    res.json(u)
  } catch (err) {
    next(err)
  }
}

/**
 * PUT /api/users/me
 * Accepts: { name, theme, accent, layoutDensity, notificationPrefs, twoFactorEnabled }
 */
export async function updateMe(req, res, next) {
  try {
    const id = req.user?.id || req.user?._id
    if (!id) return res.status(401).json({ error: 'Unauthorized' })

    // whitelist fields that can be updated
    const {
      name,
      theme,
      accent,
      layoutDensity,
      notificationPrefs,
      twoFactorEnabled,
      age,
      height,
      weight,
      gender,
      goal,
      activityLevel,
      district
    } = req.body

    const update = {}
    if (name !== undefined) update.name = String(name).trim()
    if (theme !== undefined) update.theme = theme
    if (accent !== undefined) update.accent = accent
    if (layoutDensity !== undefined) update.layoutDensity = layoutDensity
    if (notificationPrefs !== undefined) update.notificationPrefs = notificationPrefs
    if (twoFactorEnabled !== undefined) update.twoFactorEnabled = Boolean(twoFactorEnabled)
    if (age !== undefined) update.age = age === "" ? null : Number(age)
    if (height !== undefined) update.height = height === "" ? null : Number(height)
    if (weight !== undefined) update.weight = weight === "" ? null : Number(weight)
    if (gender !== undefined) update.gender = gender
    if (goal !== undefined) update.goal = goal
    if (activityLevel !== undefined) update.activityLevel = activityLevel
    if (district !== undefined) update.district = String(district).trim()

    await User.update(update, { where: { id } })
    const user = await User.findByPk(id, { attributes: { exclude: ['password'] } })

    // log activity for profile change
    try {
      const changedKeys = Object.keys(update);
      if (changedKeys.length > 0) {
        await Activity.create({
          userId: id.toString(),
          userName: user.name,
          type: 'auth:update_profile',
          message: `Profile updated`,
          meta: { changed: changedKeys }
        })
        
        await notifyUser(
          id.toString(), 
          "Profile Updated", 
          "Your NutriVision profile details were recently updated.", 
          "alert"
        )
      }
    } catch (e) { /* ignore logging errors */ }

    res.json(user)
  } catch (err) {
    next(err)
  }
}

/**
 * PUT /api/users/me/password
 * Body: { currentPassword, newPassword }
 */
export async function changePassword(req, res, next) {
  try {
    const id = req.user?.id || req.user?._id
    if (!id) return res.status(401).json({ error: 'Unauthorized' })
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Missing fields' })

    const user = await User.findByPk(id)
    if (!user) return res.status(404).json({ error: 'User not found' })
    const ok = await user.comparePassword(currentPassword)
    if (!ok) return res.status(400).json({ error: 'Current password is incorrect' })

    user.password = newPassword
    await user.save()

    try {
      await Activity.create({
        userId: id.toString(),
        userName: user.name,
        type: 'auth:password_change',
        message: 'Password changed'
      })
      
      await notifyUser(
        id.toString(), 
        "Security Alert", 
        "Your password was just changed. If you did not do this, please contact support immediately.", 
        "alert"
      )
    } catch (e) {}

    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/users/me/avatar
 * multer should populate req.file
 */
export async function uploadAvatar(req, res, next) {
  try {
    const id = req.user?.id || req.user?._id
    if (!id) return res.status(401).json({ error: 'Unauthorized' })

    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

    // generate accessible URL path (adjust if your static folder / base differs)
    const avatarUrl = `/uploads/avatars/${req.file.filename}`

    await User.update({ avatarUrl }, { where: { id } })
    const user = await User.findByPk(id, { attributes: { exclude: ['password'] } })

    try {
      await Activity.create({
        userId: id.toString(),
        userName: user.name,
        type: 'auth:avatar_upload',
        message: 'Avatar uploaded',
        meta: { avatarUrl }
      })
      
      await notifyUser(
        id.toString(), 
        "Profile Updated", 
        "Your profile picture was successfully updated.", 
        "alert"
      )
    } catch (e) {}

    res.json({ success: true, avatarUrl })
  } catch (err) {
    next(err)
  }
}

/**
 * DELETE /api/users/me/avatar
 */
export async function removeAvatar(req, res, next) {
  try {
    const id = req.user?.id || req.user?._id
    if (!id) return res.status(401).json({ error: 'Unauthorized' })
    const user = await User.findByPk(id)
    if (!user) return res.status(404).json({ error: 'User not found' })
    const avatarUrl = user.avatarUrl
    user.avatarUrl = null
    await user.save()
    // also delete file on disk if it exists AND you stored it locally
    if (avatarUrl && avatarUrl.startsWith('/uploads/avatars/')) {
      const filepath = path.resolve(process.cwd(), 'public', avatarUrl.replace(/^\//, ''))
      fs.unlink(filepath, (err) => { /* ignore fs errors */ })
    }
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/users/me/revoke-sessions
 * Simple approach: set sessionsRevokedAt on user
 */
export async function revokeSessions(req, res, next) {
  try {
    const id = req.user?.id || req.user?._id
    if (!id) return res.status(401).json({ error: 'Unauthorized' })
    const now = new Date()
    await User.update({ sessionsRevokedAt: now }, { where: { id } })

    try {
      await Activity.create({
        userId: id.toString(),
        userName: req.user?.name || null,
        type: 'auth:revoke_sessions',
        message: 'Revoked sessions',
        meta: { revokedAt: now }
      })
    } catch (e) {}
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/users/me/test
 * Simulated test action: creates an Activity entry and tries to send email/push (best-effort).
 * Returns: { ok: true, emailSent: boolean, pushSent: boolean, message: string }
 */
export async function testNotification(req, res, next) {
  try {
    const id = req.user?.id || req.user?._id;
    if (!id) return res.status(401).json({ error: 'Unauthorized' });

    let pushSent = false;
    let pushError = null;

    let dbUser = null;
    try {
      dbUser = await User.findByPk(id, { attributes: { exclude: ['password'] } });
    } catch (e) {
      console.warn('testNotification: failed to load user from DB:', e?.message || e);
    }

    // Best-effort: try sending push notification if push util exists
    try {
      const pushUtil = await import('../utils/push.js').catch(() => null);
      const sendPushToUser = pushUtil?.sendPushToUser ?? pushUtil?.default?.sendPushToUser;
      if (typeof sendPushToUser === 'function') {
        const payload = {
          title: 'SmartShelf — Test notification',
          body: `Hello ${dbUser?.name || 'user'}, this is a test notification.`,
          data: { test: true }
        };
        await sendPushToUser(id.toString(), payload).catch((e) => { throw e; });
        pushSent = true;
      }
    } catch (e) {
      pushError = e?.message || String(e);
      console.warn('testNotification: push send failed', pushError);
    }

    // Log Activity (best-effort)
    try {
      await Activity.create({
        userId: id.toString(),
        userName: req.user?.name || dbUser?.name || null,
        type: 'notification:test',
        message: 'Test notification triggered',
        meta: {
          test: true,
          triggeredAt: new Date(),
          pushSent,
          pushError
        }
      });
    } catch (e) {
      console.warn('testNotification: activity logging failed', e?.message || e);
    }

    return res.json({
      ok: true,
      pushSent,
      message: pushSent
        ? 'Test push notification sent (best-effort).'
        : 'Test recorded (no push active).',
      details: { pushError }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/users/me
 * Deletes the authenticated user account and associated data
 */
export async function deleteAccount(req, res, next) {
  try {
    const id = req.user?.id || req.user?._id;
    if (!id) return res.status(401).json({ error: 'Unauthorized' });

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Delete related records manually to prevent FK constraint errors
    try {
      const Item = (await import('../models/Item.js')).default;
      const Notification = (await import('../models/Notification.js')).default;
      const Activity = (await import('../models/Activity.js')).default;
      const MealLog = (await import('../models/MealLog.js')).default;

      if (Item) await Item.destroy({ where: { userId: id } });
      if (Notification) await Notification.destroy({ where: { userId: id } });
      if (Activity) await Activity.destroy({ where: { userId: id } });
      if (MealLog) await MealLog.destroy({ where: { userId: id } });
    } catch (e) {
      console.error('[deleteAccount] error cleaning up related records', e);
    }

    await user.destroy();
    
    res.json({ success: true, message: 'Account deleted' });
  } catch (err) {
    next(err);
  }
}
