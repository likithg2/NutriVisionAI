// backend/src/controllers/authController.js
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { sendEmail } from '../utils/mailer.js'
import crypto from 'crypto'
import Activity from '../models/Activity.js'
import { makeActivityPayload } from '../utils/activityHelper.js'
import { Op } from 'sequelize'

// signToken used for auth tokens
const signToken = (user) =>
  jwt.sign({ id: user.id, email: user.email, name: user.name }, process.env.JWT_SECRET, { expiresIn: '7d' })

// In-memory OTP store (email/phone -> { otp, expiresAt })
export const otpStore = new Map()

// Helper to generate a 6-digit numeric OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString()

export async function signup(req, res, next) {
  try {
    const { name, email, password, phone, age, height, weight, gender, goal, activityLevel, district, otp } = req.body
    if (!name || !email || !password || !otp) return res.status(400).json({ error: 'Missing required fields' })
    
    // Verify OTP
    const stored = otpStore.get(email.toLowerCase())
    if (!stored || stored.otp !== otp || Date.now() > stored.expiresAt) {
      return res.status(400).json({ error: 'Invalid or expired OTP' })
    }

    const exists = await User.findOne({ where: { [Op.or]: [{ email }, phone ? { phone } : null].filter(Boolean) } })
    if (exists) return res.status(400).json({ error: 'Email or phone already used' })
    
    const user = await User.create({ name, email, password, phone, age, height, weight, gender, goal, activityLevel, district })
    otpStore.delete(email.toLowerCase()) // clear OTP after successful use
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

/**
 * requestOtp(req): Generate a 6-digit OTP and send it via email.
 */
export async function requestOtp(req, res, next) {
  try {
    const { identifier, action } = req.body // identifier = email or phone
    if (!identifier) return res.status(400).json({ error: 'Email or phone required' })

    let targetEmail = identifier.toLowerCase();
    
    // For actions other than signup, lookup the user to find their registered email
    if (action !== 'signup') {
      const user = await User.findOne({ 
        where: { 
          [Op.or]: [{ email: identifier.toLowerCase() }, { phone: identifier }] 
        } 
      })
      
      if (!user) {
        return res.status(404).json({ error: 'Account does not exist' })
      }
      targetEmail = user.email;
    }

    const otp = generateOTP()
    const expiresAt = Date.now() + 1000 * 60 * 10 // 10 minutes expiry
    
    otpStore.set(targetEmail, { otp, expiresAt })

    let subject = 'Your NutriVision OTP';
    let message = `Your one-time password is: ${otp}\n\nIt will expire in 10 minutes.`;

    if (action === 'reset') {
      subject = 'Reset your NutriVision password';
      message = `Use this OTP to reset your password: ${otp}\n\nIt will expire in 10 minutes.`;
    } else if (action === 'delete') {
      subject = 'Confirm your NutriVision Account Deletion';
      message = `You have requested to delete your NutriVisionAi account.\n\nUse this OTP to confirm deletion: ${otp}\n\nIf you did not request this, please ignore this email.`;
    }

    try {
      await sendEmail(targetEmail, subject, message)
    } catch (e) {
      console.error('Failed to send OTP email:', e);
    }

    return res.json({ message: 'OTP sent to your email.' })
  } catch (err) {
    next(err)
  }
}

/**
 * loginOtp(req): Login via OTP without a password
 */
export async function loginOtp(req, res, next) {
  try {
    const { identifier, otp } = req.body
    if (!identifier || !otp) return res.status(400).json({ error: 'Missing identifier or OTP' })

    const user = await User.findOne({ 
      where: { 
        [Op.or]: [{ email: identifier.toLowerCase() }, { phone: identifier }] 
      } 
    })
    
    if (!user) return res.status(404).json({ error: 'Account does not exist' })
    
    const stored = otpStore.get(user.email.toLowerCase())
    if (!stored || stored.otp !== otp || Date.now() > stored.expiresAt) {
      return res.status(401).json({ error: 'Invalid or expired OTP' })
    }

    // Success
    otpStore.delete(user.email.toLowerCase())
    const token = signToken(user)

    // log activity
    try {
      const payload = makeActivityPayload({
        type: 'auth:login_otp',
        message: `User logged in with OTP (${user.email})`,
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

export async function forgotPassword(req, res, next) {
  // Legacy handler just routes to requestOtp logic for simplicity
  req.body.action = 'reset';
  req.body.identifier = req.body.email || req.body.identifier;
  return requestOtp(req, res, next);
}

/**
 * resetPassword(req): expects { identifier, otp, password }
 */
export async function resetPassword(req, res, next) {
  try {
    const { identifier, token, otp, password } = req.body // accepting token for backwards compatibility
    const code = otp || token;
    
    if (!identifier || !code || !password) return res.status(400).json({ error: 'Missing identifier, OTP, or password' })

    const user = await User.findOne({ 
      where: { 
        [Op.or]: [{ email: identifier.toLowerCase() }, { phone: identifier }] 
      } 
    })
    if (!user) return res.status(404).json({ error: 'User not found' })

    const stored = otpStore.get(user.email.toLowerCase())
    if (!stored || stored.otp !== code || Date.now() > stored.expiresAt) {
      return res.status(400).json({ error: 'Invalid or expired OTP' })
    }

    user.password = password
    await user.save()
    otpStore.delete(user.email.toLowerCase())

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

    res.json({ success: true, message: 'Password updated' })
  } catch (err) {
    next(err)
  }
}
