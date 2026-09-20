import { Op } from 'sequelize'
import Item from '../models/Item.js'

export async function getUpcomingReminders(req, res, next) {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' })

    const userId = req.user.id
    const now = new Date()
    const windowDays = Number(process.env.REMINDER_WINDOW_DAYS || 7)
    const inWindow = new Date(Date.now() + windowDays * 24 * 60 * 60 * 1000)

    const items = await Item.findAll({
      where: {
        userId,
        status: { [Op.ne]: 'consumed' },
        [Op.or]: [
          { reminderTime: { [Op.not]: null } },
          { expiryDate: { [Op.between]: [now, inWindow] } }
        ]
      },
      order: [
        ['reminderTime', 'ASC'],
        ['expiryDate', 'ASC']
      ]
    })

    const reminders = items.map(it => {
      const dateObj = it.reminderTime ? new Date(it.reminderTime) : (it.expiryDate ? new Date(it.expiryDate) : null)
      return {
        _id: it.id,
        itemId: it.id,
        name: it.name || 'Item',
        category: it.category || 'other',
        date: dateObj ? dateObj.toISOString() : null,
        title: it.name || 'Item'
      }
    })

    return res.json(reminders)
  } catch (err) {
    return next(err)
  }
}
