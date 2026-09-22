// // import cron from 'node-cron'
// // import Item from '../models/Item.js'
// // import Notification from '../models/Notification.js'
// // import { sendEmail } from './mailer.js'
// // import { sendPushToAll } from './push.js'

// // export function initCronJobs() {
// //   // Runs every day at 9:00 AM
// //   cron.schedule('0 9 * * *', async () => {
// //     try {
// //       const now = new Date()
// //       const soonItems = await Item.find({ status: 'active' })
// //       for (const i of soonItems) {
// //         const diffDays = Math.ceil((new Date(i.expiryDate) - now) / (1000 * 60 * 60 * 24))
// //         if (diffDays <= 3 && diffDays >= 0) {
// //           const title = 'Daily reminder: expiring soon'
// //           const message = `${i.name} expires in ${diffDays} day(s).`
// //           await Notification.create({ userId: i.userId, itemId: i._id, title, message, type: 'email' })
// //           // You might need to fetch the user's email via populate; omitted for brevity
// //           sendPushToAll(title, message).catch(() => {})
// //         } else if (diffDays < 0 && i.status !== 'expired') {
// //           i.status = 'expired'
// //           await i.save()
// //         }
// //       }
// //       console.log('Cron job executed: expiry checks')
// //     } catch (err) {
// //       console.error('Cron error:', err.message)
// //     }
// //   })
// // }
// // src/utils/cronJobs.js
// import cron from 'node-cron';
// import Item from '../models/Item.js';
// import { sendPushToUser } from '../utils/push.js';
// import { sendEmail } from './mailer.js';
// import Notification from '../models/Notification.js';

// /**
//  * initCronJobs()
//  * - Uses CRON_SCHEDULE env var (optional)
//  * - Default: run daily at 09:00 (server timezone) => '0 9 * * *'
//  * - For testing set CRON_SCHEDULE='* * * * *' to run every minute.
//  */
// export function initCronJobs() {
//   const schedule = process.env.CRON_SCHEDULE || '0 9 * * *';
//   console.log('[cron] starting expiry cron with schedule:', schedule);

//   cron.schedule(schedule, async () => {
//     console.log('[cron] Checking expiring items...');
//     try {
//       const now = new Date();
//       const in7 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

//       // Find active items expiring within 7 days and not notified yet
//       const expiringItems = await Item.find({
//         status: 'active',
//         expiryDate: { $gte: now, $lte: in7 },
//         notified: { $ne: true }
//       }).lean();

//       console.log('[cron] found', expiringItems.length, 'expiring items');

//       for (const item of expiringItems) {
//         try {
//           const userId = item.userId;
//           const title = `Expiry alert: ${item.name}`;
//           const body = `${item.name} expires on ${new Date(item.expiryDate).toLocaleDateString()}`;

//           // Persist a Notification record for history (non-blocking)
//           await Notification.create({
//             userId,
//             itemId: item._id,
//             title,
//             message: body,
//             type: 'push'
//           }).catch(e => console.warn('[cron] warning notification save failed', e?.message || e));

//           // Send push to specific user
//           await sendPushToUser(userId, title, body).catch(e => {
//             console.error('[cron] push send error for item', item._id, e && e.statusCode || e);
//           });

//           // Optionally send email too (keep original behavior)
//           try {
//             const emailsent = await sendEmail(item.email || null, title, body).catch(() => {});
//             // ignore if email not configured
//           } catch {}

//           // Mark as notified so we don't spam users; update item (set notified true)
//           await Item.updateOne({ _id: item._id }, { $set: { notified: true, notifiedAt: new Date() } });
//           console.log('[cron] marked item notified', item._id);
//         } catch (inner) {
//           console.error('[cron] error processing item', item._id, inner);
//         }
//       }
//     } catch (err) {
//       console.error('[cron] failure', err);
//     }
//     console.log('[cron] Done.');
//   }, { timezone: process.env.CRON_TZ || 'UTC' });
// }
// src/utils/cronJobs.js
import cron from 'node-cron'
import Item from '../models/Item.js'
import User from '../models/User.js'
import { Op } from 'sequelize'
import { sendPushToUser } from '../utils/push.js'
import { sendEmail } from './mailer.js'
import Notification from '../models/Notification.js'
import { markExpired } from '../controllers/itemController.js'

/**
 * Create a notification record AND attempt to send push/email.
 * Returns true on success, false on failure.
 */
async function notifyUser(userId, title, body, type = 'system') {
  try {
    await Notification.create({
      userId,
      title,
      message: body,
      type,
      read: false,
    });
    // Best-effort push
    await sendPushToUser(userId, title, body).catch(e =>
      console.warn('[cron] push error', e?.message || e)
    );
    const user = await User.findByPk(userId);
    if (user && user.email) { await sendEmail(user.email, title, body).catch(e => console.warn('[cron] email error', e?.message || e)); }
    return true;
  } catch (err) {
    console.error('[cron] notifyUser failed:', err?.message || err);
    return false;
  }
}

/**
 * initCronJobs()
 * - Default schedule: 9:00 AM IST daily ('0 9 * * *')
 * - Override with CRON_SCHEDULE env var for testing ('* * * * *' = every minute)
 * - Also runs markExpired() once immediately on server startup.
 */
export function initCronJobs() {
  const schedule = process.env.CRON_SCHEDULE || '0 9 * * *'
  const tz = process.env.CRON_TZ || 'Asia/Kolkata'

  console.log('[cron] starting expiry cron with schedule:', schedule, 'tz:', tz)

  // MAIN CRON SCHEDULE
  cron.schedule(
    schedule,
    async () => {
      console.log('[cron] CRON tick - start:', new Date().toISOString())

      // STEP 1 — Mark items already expired
      try {
        console.log('[cron] Running markExpired()...')
        const res = await markExpired()
        const modifiedCount = (res?.modifiedCount ?? res?.nModified) ?? 0

        if (modifiedCount > 0) {
          console.log('[cron] markExpired updated items:', modifiedCount)
        } else {
          console.log('[cron] markExpired: no expired items')
        }
      } catch (err) {
        console.error('[cron] markExpired() failed:', err?.message || err)
      }
      // STEP 2 — Check for items expiring within 3 days (inclusive of today)
      try {
        console.log('[cron] Checking items expiring soon...')

        const now = new Date()
        const in3 = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)

        const expiringItems = await Item.findAll({
          where: {
            status: 'active',
            expiryDate: { [Op.lte]: in3 },
            [Op.or]: [{ notified: false }, { notified: null }]
          }
        })

        console.log('[cron] Found', expiringItems.length, 'expiring items')

        // STEP 3 — For each expiring item: send appropriate notification
        for (const item of expiringItems) {
          try {
            // Fetch user separately to avoid EagerLoadingError with aliases
            const user = await User.findByPk(item.userId);
            if (!user) continue;

            const prefs = user.notificationPrefs || {};
            const daysUntilExpiry = Math.ceil((new Date(item.expiryDate) - now) / (1000 * 60 * 60 * 24));
            
            // Determine notification type and message
            let title, body;
            if (daysUntilExpiry <= 0) {
              // Day of expiry or already expired
              if (prefs.dayOfExpiry === false) continue;
              title = `🚨 Expired Today: ${item.name}`;
              body = `${item.name} has expired today! Please check it and discard if needed.`;
            } else if (daysUntilExpiry === 1) {
              // 1 day left
              if (prefs.oneDayWarning === false) continue;
              title = `⚠️ Expires Tomorrow: ${item.name}`;
              body = `${item.name} expires tomorrow (${new Date(item.expiryDate).toLocaleDateString()}). Use it today!`;
            } else if (daysUntilExpiry <= 3) {
              // 2–3 days left
              if (prefs.threeDayWarning === false) continue;
              title = `📅 Expiring Soon: ${item.name}`;
              body = `${item.name} expires in ${daysUntilExpiry} days (${new Date(item.expiryDate).toLocaleDateString()}). Plan to use it!`;
            } else {
              // > 3 days — skip (shouldn't reach here)
              continue;
            }

            const notifiedOk = await notifyUser(user, title, body, 'system', prefs);
            
            if (notifiedOk) {
              await item.update({ notified: true, notifiedAt: new Date() })
              console.log('[cron] marked item notified', item.id)
            }
          } catch (inner) {
            console.error('[cron] error processing item', item.id, inner)
          }
        }
      } catch (err) {
        console.error('[cron] failure while checking expiring items', err)
      }

      console.log('[cron] CRON tick - done:', new Date().toISOString())
    },
    { timezone: tz }
  )

  // Immediate one-off run at server startup to fix already-past items
  ;(async () => {
    try {
      console.log('[cron] Initial markExpired() at startup:', new Date().toISOString())
      const res = await markExpired()
      const modifiedCount = (res?.modifiedCount ?? res?.nModified) ?? 0

      if (modifiedCount > 0) {
        console.log('[cron] initial markExpired updated items:', modifiedCount)
      } else {
        console.log('[cron] initial markExpired: no expired items')
      }
    } catch (err) {
      console.error('[cron] initial markExpired() failed:', err?.message || err)
    }
  })()

  console.log('[cron] Jobs scheduled:', schedule, 'tz:', tz)
}

/**
 * createNotification() — exported helper for controllers to call when
 * a new item is added or a meal is logged.
 */
export async function createNotification(userId, title, message, type = 'system') {
  const user = await User.findByPk(userId);
  if (!user) return false;
  return notifyUser(user, title, message, type, user.notificationPrefs || {});
}


