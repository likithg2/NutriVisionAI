// backend/src/utils/activityHelper.js
/**
 * makeActivityPayload
 * Create a standardized, display-ready activity object for storing in Activity collection.
 *
 * Input options:
 *   { type, message, meta, userId, userName, createdAt }
 *
 * Returns an object that includes:
 *   - type (keeps original)
 *   - message, meta (keeps original)
 *   - verb, emoji, brief, itemName, expiryDate, details
 *   - userId, userName
 *   - createdAt (if provided, else rely on sequelize timestamps)
 *
 * This is intentionally non-destructive and backwards-compatible.
 */

export function makeActivityPayload({
  type,
  message = '',
  meta = {},
  userId = null,
  userName = null,
  createdAt = undefined
} = {}) {
  const emojiMap = {
    'item:add': '🆕',
    'item:update': '✏️',
    'item:delete': '🗑️',
    'auth:login': '🔑',
    'auth:logout': '🚪',
    'auth:signup': '🎉',
    'mail:sent': '✉️',
    'mail:attempt': '✉️',
    'auth:reset': '🔒'
  }

  const verbMap = {
    'item:add': 'New item added',
    'item:update': 'Item updated',
    'item:delete': 'Item deleted',
    'auth:login': 'User logged in',
    'auth:logout': 'User logged out',
    'auth:signup': 'New user',
    'mail:sent': 'Email sent',
    'mail:attempt': 'Email attempt',
    'auth:reset': 'Password reset'
  }

  // canonical type string (keep original)
  const t = type

  // try to extract item name / expiry from meta
  const item = meta?.item || meta?.details?.item || {}
  const itemName = item?.name || meta?.itemName || null
  const expiryDateRaw = item?.expiryDate || meta?.expiryDate || null
  // ensure expiry date is an ISO string (or null)
  const expiryDate = expiryDateRaw ? new Date(expiryDateRaw).toISOString() : null

  // Build short human-friendly brief
  function buildBrief() {
    const base = verbMap[t] || message || t || 'Activity'
    if (t === 'mail:sent') {
      const to = Array.isArray(meta?.to) ? meta.to.join(', ') : (meta?.to || meta?.recipient || '')
      return to ? `${base} — ${meta?.subject || message} · sent to ${to}` : `${base} — ${meta?.subject || message}`
    }
    if (t === 'item:add') {
      return itemName ? `${base} — ${itemName}${expiryDate ? ` · Expires ${new Date(expiryDate).toLocaleDateString()}` : ''}` : base
    }
    if (t === 'item:update') {
      if (Array.isArray(meta?.changes) && meta.changes.length) {
        const small = meta.changes.slice(0, 3).map(c => `${c.field}:${c.from ?? ''}→${c.to ?? ''}`).join(', ')
        return itemName ? `${base} — ${itemName}${small ? ` · ${small}` : ''}` : `${base}${small ? ` · ${small}` : ''}`
      }
      return itemName ? `${base} — ${itemName}` : base
    }
    if (t === 'item:delete') {
      return itemName ? `${base} — ${itemName}${expiryDate ? ` · Expired ${new Date(expiryDate).toLocaleDateString()}` : ''}` : base
    }
    if (t && t.startsWith('auth:')) {
      return userName ? `${base} — ${userName}` : base
    }
    return message || base
  }

  const payload = {
    type: t,
    message: message || '',
    meta: meta || {},
    // display fields
    verb: verbMap[t] || (message || t),
    emoji: emojiMap[t] || 'ℹ️',
    brief: buildBrief(),
    itemName: itemName,
    expiryDate: expiryDate,
    details: meta || {},
    userId: userId || null,
    userName: userName || null
  }

  if (createdAt) payload.createdAt = createdAt

  return payload
}

