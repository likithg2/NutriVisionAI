import { Op, fn, col, literal } from 'sequelize'
import Item from '../models/Item.js'

/** simple category summary */
export async function categorySummary(req, res, next) {
  try {
    const userId = req.user.id
    const result = await Item.findAll({
      where: { userId },
      attributes: [
        'category',
        [fn('COUNT', col('*')), 'count']
      ],
      group: ['category'],
      order: [['category', 'ASC']]
    })
    return res.json(result)
  } catch (err) {
    return next(err)
  }
}

/** simple expiry stats */
export async function expiryStats(req, res, next) {
  try {
    const userId = req.user.id
    const now = new Date()

    const allItems = await Item.findAll({ where: { userId } })
    
    let expiringSoon = 0;
    let expired = 0;
    let consumed = 0;
    
    for (const it of allItems) {
      const exp = it.expiryDate ? new Date(it.expiryDate) : null
      const daysLeft = exp ? Math.ceil((exp - now) / (1000 * 60 * 60 * 24)) : null
      
      if (it.status === 'consumed') consumed++
      else if (it.status === 'expired') expired++
      
      if (daysLeft !== null && daysLeft >= 0 && daysLeft <= 7 && it.status !== 'consumed') {
        expiringSoon++
      }
    }
    
    return res.json({ expiringSoon, expired, consumed })
  } catch (err) {
    return next(err)
  }
}

/**
 * dashboardAnalytics
 * returns the full payload used by the frontend analytics page
 */
export async function dashboardAnalytics(req, res, next) {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' })
    const userId = req.user.id
    const now = new Date()

    // 1) category counts
    const categoryCounts = await Item.findAll({
      where: { userId },
      attributes: ['category', [fn('COUNT', col('*')), 'count']],
      group: ['category'],
      order: [['category', 'ASC']]
    })

    // 2) lightweight item fetch
    const all = await Item.findAll({
      where: { userId },
      attributes: ['id', 'name', 'category', 'status', 'expiryDate', 'estimatedCost', 'createdAt']
    })

    // 3) status metrics
    let active = 0, expired = 0, consumed = 0, expiringSoon = 0
    for (const it of all) {
      const exp = it.expiryDate ? new Date(it.expiryDate) : null
      const daysLeft = exp ? Math.ceil((exp - now) / (1000 * 60 * 60 * 24)) : null

      if (it.status === 'consumed') consumed++
      else if (it.status === 'expired') expired++
      else active++

      if (daysLeft !== null && daysLeft >= 0 && daysLeft <= 7 && it.status !== 'consumed') expiringSoon++
    }

    // 4) high/low value
    const costItems = all.filter(i => i && typeof i.estimatedCost === 'number' && !Number.isNaN(i.estimatedCost))
    const topHighValue = [...costItems].sort((a, b) => b.estimatedCost - a.estimatedCost).slice(0, 10)
    const topLowValue  = [...costItems].sort((a, b) => a.estimatedCost - b.estimatedCost).slice(0, 10)

    // 5) upcoming expirations
    const upcomingExpirations = [...all]
      .filter(i => i.expiryDate && new Date(i.expiryDate) >= now && i.status !== 'consumed')
      .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
      .slice(0, 10)
      .map(it => ({ _id: it.id, name: it.name, category: it.category, expiryDate: it.expiryDate }))

    // 6) time series last 15 days (UTC stable)
    // using memory because sqlite doesn't have same date parsing easily as PG/mysql
    const days = 15
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    const startUTC = new Date(Date.UTC(todayUTC.getUTCFullYear(), todayUTC.getUTCMonth(), todayUTC.getUTCDate() - (days - 1)))
    
    const byDayMap = {}
    for (let i = 0; i < days; i++) {
      const d = new Date(Date.UTC(startUTC.getUTCFullYear(), startUTC.getUTCMonth(), startUTC.getUTCDate() + i))
      byDayMap[d.toISOString().slice(0, 10)] = { added: 0, expiring: 0 }
    }
    
    for (const it of all) {
      if (it.createdAt && it.createdAt >= startUTC) {
         const d = new Date(Date.UTC(it.createdAt.getUTCFullYear(), it.createdAt.getUTCMonth(), it.createdAt.getUTCDate()))
         const iso = d.toISOString().slice(0,10)
         if (byDayMap[iso]) byDayMap[iso].added++
      }
      
      if (it.expiryDate && it.expiryDate >= startUTC && it.expiryDate <= now) {
         const d = new Date(Date.UTC(it.expiryDate.getUTCFullYear(), it.expiryDate.getUTCMonth(), it.expiryDate.getUTCDate()))
         const iso = d.toISOString().slice(0,10)
         if (byDayMap[iso]) byDayMap[iso].expiring++
      }
    }
    
    const byDay = Object.keys(byDayMap).sort().map(date => ({
      date,
      added: byDayMap[date].added,
      expiring: byDayMap[date].expiring
    }))

    return res.json({
      categoryCounts,
      statusCounts: { active, expiringSoon, expired, consumed },
      topHighValue,
      topLowValue,
      upcomingExpirations,
      timeSeries: { byDay }
    })
  } catch (err) {
    return next(err)
  }
}
