// server/utils/push.js
import webpush from 'web-push';

const pub = process.env.WEB_PUSH_PUBLIC_VAPID_KEY;
const priv = process.env.WEB_PUSH_PRIVATE_VAPID_KEY;
const contact = process.env.WEB_PUSH_CONTACT || 'mailto:example@example.com';

if (pub && priv) {
  try {
    webpush.setVapidDetails(contact, pub, priv);
    console.log('[push] VAPID configured (public key available).');
  } catch (e) {
    console.error('[push] failed to set VAPID details', e);
  }
} else {
  console.warn('[push] VAPID keys not configured. Set WEB_PUSH_PUBLIC_VAPID_KEY and WEB_PUSH_PRIVATE_VAPID_KEY.');
}

// In-memory map for demo: endpoint -> { sub, userId, createdAt }
// IMPORTANT: replace with DB storage for production
const subscriptions = new Map();

/**
 * Add a push subscription; optionally pass userId to associate
 * sub: PushSubscription object
 * userId: string | ObjectId
 */
export function addSubscription(sub, userId = null) {
  if (!sub || !sub.endpoint) return false;
  subscriptions.set(sub.endpoint, { sub, userId, createdAt: Date.now() });
  console.log('[push] addSubscription:', userId || 'unknown-user', sub.endpoint);
  return true;
}

/** Remove subscription by endpoint */
export function removeSubscriptionByEndpoint(endpoint) {
  if (!endpoint) return false;
  const ok = subscriptions.delete(endpoint);
  if (ok) console.log('[push] removed subscription', endpoint);
  return ok;
}

/** Return all subscriptions (raw sub objects) */
export function listAllSubscriptions() {
  return Array.from(subscriptions.values()).map(x => x.sub);
}

/** List subscriptions for a specific userId */
export function listSubscriptionsForUser(userId) {
  return Array.from(subscriptions.values())
    .filter(x => String(x.userId) === String(userId))
    .map(x => x.sub);
}

/** Internal safe send that auto-removes expired subscriptions */
async function safeSendNotification(sub, payload) {
  if (!sub) return;
  try {
    const res = await webpush.sendNotification(sub, JSON.stringify(payload));
    console.log('[push] sent OK to', sub.endpoint);
    return res;
  } catch (err) {
    // Log statusCode if present
    const sc = err && err.statusCode;
    console.error('[push] sendNotification error for endpoint:', sub.endpoint, sc || err);
    if (sc === 410 || sc === 404) {
      // Gone or Not Found -> remove subscription
      removeSubscriptionByEndpoint(sub.endpoint);
      console.log('[push] subscription removed due to endpoint gone:', sub.endpoint);
    }
    throw err;
  }
}

/** Send to a single user (all subscriptions for that user) */
export async function sendPushToUser(userId, title = 'Notification', body = '') {
  if (!pub || !priv) {
    console.warn('[push] VAPID keys not configured, abort sendPushToUser');
    return;
  }
  const payload = { title, body };
  const subs = listSubscriptionsForUser(userId);
  if (!subs.length) {
    console.log('[push] no subscriptions for user', userId);
    return;
  }
  await Promise.all(subs.map(s => safeSendNotification(s, payload).catch(() => {})));
}

/** Broadcast to all known subscriptions (use carefully) */
export async function sendPushToAll(title = 'Notification', body = '') {
  if (!pub || !priv) {
    console.warn('[push] VAPID keys not configured, abort sendPushToAll');
    return;
  }
  const payload = { title, body };
  const subs = listAllSubscriptions();
  await Promise.all(subs.map(s => safeSendNotification(s, payload).catch(() => {})));
}
