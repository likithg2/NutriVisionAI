import { Op } from 'sequelize'
import Item from '../models/Item.js'
import Notification from '../models/Notification.js'
import { sendEmail } from '../utils/mailer.js'
import { sendPushToUser } from '../utils/push.js'
import { getRecipientEmail } from '../utils/notify.js'
import Activity from '../models/Activity.js'
import { makeActivityPayload } from '../utils/activityHelper.js'
import { regenerateKitchenRecipes } from './aiController.js'
import { createNotification } from '../utils/cronJobs.js'

const daysBetween = (a, b) => Math.ceil((b - a) / (1000 * 60 * 60 * 24))

const ALLOWED = new Set(['grocery', 'medicine', 'cosmetic', 'beverage', 'other'])
const normalizeCategory = (c) => {
  const v = (c || '').toString().trim().toLowerCase()
  if (!v) return 'grocery'
  const map = { groceries: 'grocery', medicines: 'medicine', cosmetics: 'cosmetic', beverages: 'beverage', others: 'other' }
  const m = map[v]
  if (m) return m
  return ALLOWED.has(v) ? v : 'grocery'
}

const toDate = (v) => {
  if (v === undefined || v === null || v === '') return undefined
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? undefined : d
}
const toNum = (v) => {
  if (v === '' || v === null || v === undefined) return undefined
  const n = Number(v)
  return Number.isNaN(n) ? undefined : n
}

export async function addItem(req, res, next) {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' })

    const name = (req.body?.name || '').toString().trim()
    const category = normalizeCategory(req.body?.category)
    const expiryDate = toDate(req.body?.expiryDate)

    if (!name) return res.status(400).json({ error: 'Name is required' })
    if (!expiryDate) return res.status(400).json({ error: 'Valid expiryDate is required (YYYY-MM-DD)' })

    const payload = {
      userId: req.user.id,
      name,
      category,
      dosage: req.body?.dosage,
      expiryDate,
      reminderTime: toDate(req.body?.reminderTime),
      barcode: (req.body?.barcode || '').toString().trim() || undefined,
      estimatedCost: toNum(req.body?.estimatedCost),
      brand: (req.body?.brand || '').toString().trim() || undefined,
      quantity: toNum(req.body?.quantity),
      unit: req.body?.unit || 'pcs',
      location: req.body?.location || 'pantry',
      notes: (req.body?.notes || '').toString().trim() || undefined,
      purchaseDate: toDate(req.body?.purchaseDate),
      openedAt: toDate(req.body?.openedAt),
      mealType: (req.body?.mealType || '').toString().trim() || undefined,
      calories: toNum(req.body?.calories),
      protein: toNum(req.body?.protein),
      carbs: toNum(req.body?.carbs),
      fat: toNum(req.body?.fat),
      fiber: toNum(req.body?.fiber),
      status: req.body?.status || 'active',
      consumedAt: toDate(req.body?.consumedAt)
    }

    const item = await Item.create(payload)

    // Log activity: compose standardized payload and persist (non-fatal)
    try {
      const activityPayload = makeActivityPayload({
        type: 'item:add',
        message: `${item.name} added`,
        meta: { item: item },
        userId: req.user.id,
        userName: req.user.name
      })
      await Activity.create(activityPayload)
    } catch (e) {
      console.warn('Activity logging failed (addItem):', e?.message || e)
    }

    // Notify user: new item added (in-app + email + push)
    try {
      await createNotification(
        req.user.id.toString(),
        `✅ New Item Added: ${item.name}`,
        `${item.name} (${item.category}) has been added to your SmartShelf. Expires: ${new Date(item.expiryDate).toLocaleDateString()}.`,
        'system'
      )
    } catch (e) {
      console.warn('[itemController] new-item notification failed:', e?.message || e)
    }

    // auto-notify if expiring within 3 days (per-user push)
    const d = daysBetween(new Date(), item.expiryDate)
    if (d <= 3 && d >= 0) {
      const email = await getRecipientEmail(req).catch(() => null)
      const title = 'Expiring Soon'
      const msg = `${item.name} expires in ${d} day(s).`

      // idempotent create: check first
      try {
        const exists = await Notification.findOne({
          where: {
            userId: req.user.id,
            itemId: item.id,
            type: 'push',
            title
          }
        })

        if (!exists) {
          try {
            await Notification.create({ userId: req.user.id, itemId: item.id, title, message: msg, type: 'push' })
          } catch (e) {
            console.warn('[itemController] notification save failed', e?.message || e)
          }
        }
      } catch (e) {
        console.warn('[itemController] notification existence check failed', e?.message || e)
      }

      // Send push first; only mark notified after push succeeded
      try {
        await sendPushToUser(req.user.id, title, msg)
        await Item.update({ notified: true, notifiedAt: new Date() }, { where: { id: item.id } })
      } catch (e) {
        console.error('[itemController] sendPushToUser failed', e && e.statusCode || e)
      }

      if (email) {
        const daysUntilExpiry = Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
        const htmlBody = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #FF6B4A; text-align: center;">NutriVision Expiry Alert</h2>
            <p style="font-size: 16px; color: #333;">Hello,</p>
            <p style="font-size: 16px; color: #333;">You just added an item that is already expiring soon.</p>
            
            <div style="background: #fdf8f3; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #E5533D;">${item.name}</h3>
              <ul style="list-style: none; padding: 0; margin: 0;">
                <li style="margin-bottom: 8px;"><strong>Category:</strong> ${item.category || 'Grocery'}</li>
                <li style="margin-bottom: 8px;"><strong>Quantity:</strong> ${item.quantity || 1} ${item.unit || 'pcs'}</li>
                <li style="margin-bottom: 8px;"><strong>Location:</strong> ${item.location || 'Pantry'}</li>
                <li style="margin-bottom: 8px;"><strong>Expires:</strong> ${new Date(item.expiryDate).toLocaleDateString()} <span style="color: #E5533D; font-weight: bold;">(in ${daysUntilExpiry} days)</span></li>
              </ul>
            </div>
            
            <p style="font-size: 14px; color: #666;">Don't let it go to waste! Check your NutriVision app's Smart Kitchen to find a great recipe using this item.</p>
            <br/>
            <p style="font-size: 12px; color: #999; text-align: center;">You can turn off these notifications in your NutriVision Settings.</p>
          </div>
        `;
        sendEmail(email, title, msg, htmlBody).catch((e) => console.error('[itemController] sendEmail failed', e))
      }
    }

    // Trigger background generation for recipes without blocking
    regenerateKitchenRecipes(req.user.id).catch(e => console.error('[itemController] background recipe generation failed', e))

    return res.status(201).json(item)
  } catch (err) {
    if (err?.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: err.message })
    }
    return next(err)
  }
}

export async function getItems(req, res, next) {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' })

    const {
      category,
      status,
      q,
      minCost,
      maxCost,
      sort = 'expiryDate',
      order = 'asc',
      page = 1,
      limit = 20
    } = req.query

    const find = { userId: req.user.id }

    if (category) find.category = normalizeCategory(category)
    if (status) find.status = status

    if (minCost || maxCost) {
      find.estimatedCost = {}
      if (minCost) find.estimatedCost[Op.gte] = Number(minCost)
      if (maxCost) find.estimatedCost[Op.lte] = Number(maxCost)
    }

    if (q) {
      const qStr = String(q).trim()
      find[Op.or] = [
        { name: { [Op.like]: `%${qStr}%` } },
        { brand: { [Op.like]: `%${qStr}%` } },
        { barcode: { [Op.like]: `%${qStr}%` } }
      ]
    }

    const sortMap = { expiryDate: 'expiryDate', createdAt: 'createdAt', estimatedCost: 'estimatedCost', name: 'name' }
    const sortField = sortMap[sort] || 'expiryDate'
    const sortDir = order === 'desc' ? 'DESC' : 'ASC'

    const pageNum = Math.max(Number(page), 1)
    const perPage = Math.min(Math.max(Number(limit), 1), 100)
    const skip = (pageNum - 1) * perPage

    const items = await Item.findAll({
      where: find,
      order: [[sortField, sortDir]],
      offset: skip,
      limit: perPage
    })
    const total = await Item.count({ where: find })

    return res.json({ items, total, page: pageNum, pages: Math.ceil(total / perPage) })
  } catch (err) {
    return next(err)
  }
}

export async function markExpired(req, res, next) {
  try {
    const now = new Date()

    const baseFilter = (req && req.user && req.user.id)
      ? { userId: req.user.id }
      : {}

    const filter = {
      ...baseFilter,
      expiryDate: { [Op.lte]: now },
      status: { [Op.notIn]: ['expired', 'consumed'] }
    }

    // Fetch items BEFORE updating so we have names + userIds for notifications
    const itemsToExpire = await Item.findAll({ where: filter })

    const update = {
      status: 'expired',
      updatedAt: new Date()
    }

    const [modifiedCount] = await Item.update(update, { where: filter })

    // Send individual notifications for each newly-expired item
    if (modifiedCount > 0) {
      const { notifyUser: sendNotif } = await import('../utils/notify.js')
      for (const item of itemsToExpire) {
        try {
          await sendNotif(
            item.userId.toString(),
            `🚨 Item Expired: ${item.name}`,
            `${item.name} has expired (expiry: ${new Date(item.expiryDate).toLocaleDateString()}). Please check and discard if needed.`,
            'alert'
          )
        } catch (e) {
          console.warn('[markExpired] notification failed for item', item.id, e?.message || e)
        }
      }
    }

    try {
      if (modifiedCount > 0) {
        const msg = `Auto-mark expired: ${modifiedCount} item(s) (expiryDate <= ${now.toISOString()})`
        await Activity.create({
          userId: (req && req.user && req.user.id) ? req.user.id : null,
          type: 'system:expire',
          message: msg,
          meta: { modifiedCount }
        })
      }
    } catch (e) {
      console.warn('Failed to log markExpired activity:', e?.message || e)
    }

    if (req && req.method) {
      if (req.user && req.user.id && modifiedCount > 0) {
        regenerateKitchenRecipes(req.user.id).catch(e => console.error('[itemController] background recipe generation failed', e))
      }
      return res.json({ ok: true, modifiedCount })
    }
    return { modifiedCount }
  } catch (err) {
    if (next) return next(err)
    throw err
  }
}


export async function updateItem(req, res, next) {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' })
    const id = req.params.id

    const update = {
      ...(req.body?.name !== undefined ? { name: String(req.body.name).trim() } : {}),
      ...(req.body?.category !== undefined ? { category: normalizeCategory(req.body.category) } : {}),
      ...(req.body?.dosage !== undefined ? { dosage: req.body.dosage } : {}),
      ...(req.body?.expiryDate !== undefined ? { expiryDate: toDate(req.body.expiryDate) } : {}),
      ...(req.body?.reminderTime !== undefined ? { reminderTime: toDate(req.body.reminderTime) } : {}),
      ...(req.body?.barcode !== undefined ? { barcode: (req.body?.barcode || '').toString().trim() || undefined } : {}),
      ...(req.body?.estimatedCost !== undefined ? { estimatedCost: toNum(req.body?.estimatedCost) } : {}),
      ...(req.body?.brand !== undefined ? { brand: (req.body?.brand || '').toString().trim() || undefined } : {}),
      ...(req.body?.quantity !== undefined ? { quantity: toNum(req.body?.quantity) } : {}),
      ...(req.body?.unit !== undefined ? { unit: req.body.unit } : {}),
      ...(req.body?.location !== undefined ? { location: req.body.location } : {}),
      ...(req.body?.notes !== undefined ? { notes: (req.body?.notes || '').toString().trim() || undefined } : {}),
      ...(req.body?.purchaseDate !== undefined ? { purchaseDate: toDate(req.body?.purchaseDate) } : {}),
      ...(req.body?.openedAt !== undefined ? { openedAt: toDate(req.body.openedAt) } : {}),
      ...(req.body?.status !== undefined ? { status: req.body.status } : {}),
      ...(req.body?.consumedAt !== undefined ? { consumedAt: toDate(req.body.consumedAt) } : {}),
      ...(req.body?.mealType !== undefined ? { mealType: (req.body?.mealType || '').toString().trim() || undefined } : {}),
      ...(req.body?.calories !== undefined ? { calories: toNum(req.body?.calories) } : {}),
      ...(req.body?.protein !== undefined ? { protein: toNum(req.body?.protein) } : {}),
      ...(req.body?.carbs !== undefined ? { carbs: toNum(req.body?.carbs) } : {}),
      ...(req.body?.fat !== undefined ? { fat: toNum(req.body?.fat) } : {}),
      ...(req.body?.fiber !== undefined ? { fiber: toNum(req.body?.fiber) } : {})
    }

    if (update.status === 'consumed' && update.consumedAt === undefined) {
      update.consumedAt = new Date()
    }

    const item = await Item.findOne({ where: { id, userId: req.user.id } })
    if (!item) return res.status(404).json({ error: 'Item not found' })

    await item.update(update)

    try {
      let activityMsg = `${item.name} updated`
      let activityType = 'item:update'
      
      if (req.body?.status === 'consumed') {
        activityMsg = `${item.name} was used completely`
        activityType = 'item:consume'
      } else if (req.body?.status === 'expired') {
        activityMsg = `${item.name} has expired`
        activityType = 'item:expire'
      } else if (req.body?.quantity !== undefined && req.body.quantity < item.quantity) {
        const usedAmount = item.quantity - req.body.quantity;
        activityMsg = `${item.name} was partially used (${usedAmount} ${item.unit || 'units'})`
        activityType = 'item:partial_use'
      }

      const activityPayload = makeActivityPayload({
        type: activityType,
        message: activityMsg,
        meta: { itemId: item.id, item: item, changes: req.body?.changes || undefined },
        userId: req.user.id,
        userName: req.user.name
      })
      await Activity.create(activityPayload)
    } catch (e) {
      console.warn('Activity logging failed (updateItem):', e?.message || e)
    }

    const d = daysBetween(new Date(), new Date(item.expiryDate))
    if (d <= 3 && d >= 0) {
      const email = await getRecipientEmail(req).catch(() => null)
      const title = 'Item Expiring Soon (Updated)'
      const msg = `${item.name} expires in ${d} day(s).`

      try {
        const exists = await Notification.findOne({
          where: {
            userId: req.user.id,
            itemId: item.id,
            type: 'push',
            title
          }
        })

        if (!exists) {
          try {
            await Notification.create({ userId: req.user.id, itemId: item.id, title, message: msg, type: 'push' })
          } catch (e) {
             console.warn('[itemController] notification save failed', e?.message || e)
          }
        }
      } catch (e) {
        console.warn('[itemController] notification existence check failed', e?.message || e)
      }

      try {
        await sendPushToUser(req.user.id, title, msg)
        await Item.update({ notified: true, notifiedAt: new Date() }, { where: { id: item.id } })
      } catch (e) {
        console.error('[itemController] sendPushToUser failed', e && e.statusCode || e)
      }

      if (email) {
        const daysUntilExpiry = Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
        const htmlBody = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #FF6B4A; text-align: center;">NutriVision Expiry Alert</h2>
            <p style="font-size: 16px; color: #333;">Hello,</p>
            <p style="font-size: 16px; color: #333;">An item in your inventory was recently updated and is expiring soon.</p>
            
            <div style="background: #fdf8f3; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #E5533D;">${item.name}</h3>
              <ul style="list-style: none; padding: 0; margin: 0;">
                <li style="margin-bottom: 8px;"><strong>Category:</strong> ${item.category || 'Grocery'}</li>
                <li style="margin-bottom: 8px;"><strong>Quantity:</strong> ${item.quantity || 1} ${item.unit || 'pcs'}</li>
                <li style="margin-bottom: 8px;"><strong>Location:</strong> ${item.location || 'Pantry'}</li>
                <li style="margin-bottom: 8px;"><strong>Expires:</strong> ${new Date(item.expiryDate).toLocaleDateString()} <span style="color: #E5533D; font-weight: bold;">(in ${daysUntilExpiry} days)</span></li>
              </ul>
            </div>
            
            <p style="font-size: 14px; color: #666;">Don't let it go to waste! Check your NutriVision app's Smart Kitchen to find a great recipe using this item.</p>
            <br/>
            <p style="font-size: 12px; color: #999; text-align: center;">You can turn off these notifications in your NutriVision Settings.</p>
          </div>
        `;
        sendEmail(email, title, msg, htmlBody).catch((e) => console.error('[itemController] sendEmail failed', e))
      }
    }

    // Trigger background generation for recipes without blocking
    regenerateKitchenRecipes(req.user.id).catch(e => console.error('[itemController] background recipe generation failed', e))

    return res.json(item)
  } catch (err) {
    if (err?.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: err.message })
    }
    return next(err)
  }
}

export async function deleteItem(req, res, next) {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' })
    const item = await Item.findOne({ where: { id: req.params.id, userId: req.user.id } })
    if (item) {
      await item.destroy()
      try {
        const activityPayload = makeActivityPayload({
          type: 'item:delete',
          message: `${item.name} removed`,
          meta: { itemId: item.id, itemName: item.name, expiryDate: item.expiryDate },
          userId: req.user.id,
          userName: req.user.name
        })
        await Activity.create(activityPayload)
      } catch (e) {
        console.warn('Activity logging failed (deleteItem):', e?.message || e)
      }
      // Trigger background generation for recipes without blocking
      regenerateKitchenRecipes(req.user.id).catch(e => console.error('[itemController] background recipe generation failed', e))
    }
    return res.json({ deleted: !!item })
  } catch (err) {
    return next(err)
  }
}

export default {
  addItem,
  getItems,
  updateItem,
  deleteItem,
  markExpired
}
