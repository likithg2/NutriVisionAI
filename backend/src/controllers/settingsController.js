// backend/src/controllers/settingsController.js
import fs from 'fs'
import path from 'path'
import User from '../models/User.js'
import Activity from '../models/Activity.js'
import { notifyUser } from '../utils/notify.js'
import { otpStore } from './authController.js'

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

    // Keep a record of what succeeded
    let emailSent = false;
    let pushSent = false;
    let emailError = null;
    let pushError = null;

    // Try to fetch full user (to get email, push subscription info etc.)
    let dbUser = null;
    try {
      dbUser = await User.findByPk(id, { attributes: { exclude: ['password'] } });
    } catch (e) {
      console.warn('testNotification: failed to load user from DB:', e?.message || e);
    }

    // Best-effort: try sending email if mailer exists and user has an email
    if (dbUser?.email) {
      try {
        // dynamic import so missing mailer util won't crash server
        const mailer = await import('../utils/mailer.js').catch(() => null);
        const sendEmail = mailer?.sendEmail ?? mailer?.default?.sendEmail;
        if (typeof sendEmail === 'function') {
          // Customize subject/body as you like (kept minimal & safe)
          const subject = 'SmartShelf — Test notification';
          const text = `This is a test notification triggered by user ${dbUser.name || dbUser.email}. If you received this, email sending works.`;
          // sendEmail should be implemented to accept (to, subject, text, html?) — adapt if your signature differs
          await sendEmail(dbUser.email, subject, text).catch((e) => { throw e; });
          emailSent = true;
        } else {
          // mailer not implemented; skip
          emailSent = false;
        }
      } catch (e) {
        emailError = e?.message || String(e);
        console.warn('testNotification: email send failed', emailError);
      }
    }

    // Best-effort: try sending push notification if push util exists
    try {
      const pushUtil = await import('../utils/push.js').catch(() => null);
      const sendPushToUser = pushUtil?.sendPushToUser ?? pushUtil?.default?.sendPushToUser;
      if (typeof sendPushToUser === 'function') {
        // Example payload; adapt to your push util expectations
        const payload = {
          title: 'SmartShelf — Test notification',
          body: `Hello ${dbUser?.name || 'user'}, this is a test notification.`,
          data: { test: true }
        };
        // sendPushToUser should accept (userId, payload) or similar — adapt if needed
        await sendPushToUser(id.toString(), payload).catch((e) => { throw e; });
        pushSent = true;
      } else {
        pushSent = false;
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
          emailSent,
          pushSent,
          emailError,
          pushError
        }
      });
    } catch (e) {
      // non-fatal
      console.warn('testNotification: activity logging failed', e?.message || e);
    }

    // Return a clear response the frontend can use
    return res.json({
      ok: true,
      emailSent,
      pushSent,
      message: emailSent || pushSent
        ? 'Test notification sent (best-effort).'
        : 'Test recorded (no email/push available).',
      details: { emailError, pushError }
    });
  } catch (err) {
    // unexpected error — forward to express error handler
    next(err);
  }
}

/**
 * DELETE /api/users/me
 * Deletes the user account and associated data
 */
export async function deleteAccount(req, res, next) {
  try {
    const id = req.user?.id || req.user?._id;
    if (!id) return res.status(401).json({ error: 'Unauthorized' });

    const { otp } = req.body;
    if (!otp) return res.status(400).json({ error: 'OTP is required to delete account' });

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const stored = otpStore.get(user.email.toLowerCase());
    if (!stored || stored.otp !== otp || Date.now() > stored.expiresAt) {
      return res.status(401).json({ error: 'Invalid or expired OTP' });
    }

    otpStore.delete(user.email.toLowerCase());

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
