// backend/src/controllers/authController.js
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import Activity from '../models/Activity.js'
import { makeActivityPayload } from '../utils/activityHelper.js'
import { Op } from 'sequelize'

// signToken used for auth tokens
const signToken = (user) =>
  jwt.sign({ id: user.id, email: user.email, name: user.name }, process.env.JWT_SECRET, { expiresIn: '7d' })

export async function signup(req, res, next) {
  try {
    const { name, email, password, phone, age, height, weight, gender, goal, activityLevel, district } = req.body
    if (!name || !email || !password) return res.status(400).json({ error: 'Missing required fields' })

    const exists = await User.findOne({ where: { [Op.or]: [{ email }, phone ? { phone } : null].filter(Boolean) } })
    if (exists) return res.status(400).json({ error: 'Email or phone already used' })
    
    const user = await User.create({ name, email, password, phone, age, height, weight, gender, goal, activityLevel, district })
    const token = signToken(user)

    // log activity (standardized)
    try {
      const payload = makeActivityPayload({
        type: 'auth:signup',
        message: `User signed up (${user.email})`,
        meta: { email: user.email },
        userId: user.id,
        userName: user.name
      })
      await Activity.create(payload)
    } catch (e) { /* ignore logging errors */ }

    res.json({ message: 'Signup successful', token, user })
  } catch (err) {
    next(err)
  }
}

export async function login(req, res, next) {
  try {
    const { identifier, password } = req.body // identifier can be email or phone
    const emailStr = req.body.email; // fallback for backwards compatibility
    const lookupId = identifier || emailStr;

    const user = await User.findOne({ 
      where: { 
        [Op.or]: [{ email: lookupId.toLowerCase() }, { phone: lookupId }] 
      } 
    })
    
    if (!user) return res.status(404).json({ error: 'Account does not exist' })
    const ok = await user.comparePassword(password)
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })
    const token = signToken(user)

    // log activity
    try {
      const payload = makeActivityPayload({
        type: 'auth:login',
        message: `User logged in (${user.email})`,
        meta: { email: user.email },
        userId: user.id,
        userName: user.name
      })
      await Activity.create(payload)
    } catch (e) { /* ignore */ }

    res.json({ message: 'Login successful', token, user })
  } catch (err) {
    next(err)
  }
}

export async function logout(req, res) {
  try {
    const { userId, userName } = req.body || {}
    if (userId) {
      try {
        const payload = makeActivityPayload({
          type: 'auth:logout',
          message: `User logged out (${userName || userId})`,
          meta: { userId, userName },
          userId,
          userName: userName || 'Unknown'
        })
        await Activity.create(payload)
      } catch (e) { /* ignore */ }
    }
  } catch (e) { /* ignore */ }
  res.json({ message: 'Logged out' })
}

export async function forgotPassword(req, res, next) {
  try {
    const { identifier } = req.body
    const lookupId = identifier || req.body.email
    if (!lookupId) return res.status(400).json({ error: 'Email or phone required' })

    const user = await User.findOne({ 
      where: { 
        [Op.or]: [{ email: lookupId.toLowerCase() }, { phone: lookupId }] 
      } 
    })
    if (!user) return res.status(404).json({ error: 'Account does not exist' })

    return res.json({ success: true, message: 'Account found. You can now reset your password.' })
  } catch (err) {
    next(err)
  }
}

/**
 * resetPassword(req): expects { identifier, password }
 */
export async function resetPassword(req, res, next) {
  try {
    const { identifier, password } = req.body
    
    if (!identifier || !password) return res.status(400).json({ error: 'Missing identifier or password' })

    const user = await User.findOne({ 
      where: { 
        [Op.or]: [{ email: identifier.toLowerCase() }, { phone: identifier }] 
      } 
    })
    if (!user) return res.status(404).json({ error: 'User not found' })

    user.password = password
    await user.save()

    try {
      const payload = makeActivityPayload({
        type: 'auth:reset',
        message: `Password reset for ${user.email}`,
        meta: { userId: user.id },
        userId: user.id,
        userName: user.name
      })
      await Activity.create(payload)
    } catch (e) {}

    res.json({ success: true, message: 'Password updated successfully' })
  } catch (err) {
    next(err)
  }
}
