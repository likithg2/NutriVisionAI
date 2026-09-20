// backend/src/routes/authRoutes.js
import { Router } from 'express'
import { signup, login, logout, forgotPassword, resetPassword, requestOtp, loginOtp } from '../controllers/authController.js'

const router = Router()
router.post('/signup', signup)
router.post('/login', login)
router.post('/logout', logout)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)
router.post('/request-otp', requestOtp)
router.post('/login-otp', loginOtp)

export default router
