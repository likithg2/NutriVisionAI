import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { sendEmail } from './mailer.js';
import { sendPushToUser } from './push.js';

/**
 * Always return the correct user's email – even if req.user.email is missing.
 */
export async function getRecipientEmail(req) {
  if (req.user?.email) return req.user.email;

  const user = await User.findByPk(req.user.id, { attributes: ['email'] });
  return user?.email || null;
}

/**
 * Robustly dispatch notifications to a user based on their preferences
 * @param {string} userId - UUID of the user
 * @param {string} title - Notification title
 * @param {string} message - Notification body/message
 * @param {string} type - Notification type (e.g. 'push', 'email', 'alert')
 */
export async function notifyUser(userId, title, message, type = 'push') {
  try {
    const user = await User.findByPk(userId);
    if (!user) return false;

    // Save to database
    await Notification.create({
      userId,
      title,
      message,
      type,
    });

    const prefs = user.notificationPrefs || {};
    // Default to true if not explicitly set to false
    const emailEnabled = prefs.emailExpiry !== false && prefs.emailEnabled !== false;
    const pushEnabled = prefs.pushExpiry !== false && prefs.pushEnabled !== false;

    // Send push
    if (pushEnabled) {
      sendPushToUser(userId, title, message).catch(e => {
        console.error(`[notifyUser] push error for user ${userId}:`, e?.message || e);
      });
    }

    // Send email
    if (emailEnabled && user.email) {
      sendEmail(user.email, title, message).catch(e => {
        console.error(`[notifyUser] email error for user ${userId}:`, e?.message || e);
      });
    }

    return true;
  } catch (err) {
    if (err?.name !== 'SequelizeUniqueConstraintError') {
      console.error(`[notifyUser] global error:`, err?.message || err);
    }
    return false;
  }
}
