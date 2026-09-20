// // backend/src/routes/settingsRoutes.js
// import { Router } from 'express'
// import multer from 'multer'
// import path from 'path'
// import { fileURLToPath } from 'url'
// import fs from 'fs'

// import {
//   getMe,
//   updateMe,
//   changePassword,
//   uploadAvatar,
//   removeAvatar,
//   revokeSessions,
//   testNotification
// } from '../controllers/settingsController.js'
// import ensureAuth from '../middleware/ensureAuth.js' // ensure this path is correct

// const router = Router()

// // multer storage
// const __filename = fileURLToPath(import.meta.url)
// const __dirname = path.dirname(__filename)
// const uploadDir = path.resolve(process.cwd(), 'public', 'uploads', 'avatars')

// // ensure directory exists
// if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, uploadDir),
//   filename: (req, file, cb) => {
//     const ext = path.extname(file.originalname) || '.png'
//     const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`
//     cb(null, name)
//   }
// })

// const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } }) // 2MB

// // GET /api/users/me
// router.get('/me', ensureAuth, getMe)

// // PUT /api/users/me
// router.put('/me', ensureAuth, updateMe)

// // PUT /api/users/me/password
// router.put('/me/password', ensureAuth, changePassword)

// // POST /api/users/me/avatar
// router.post('/me/avatar', ensureAuth, upload.single('avatar'), uploadAvatar)

// // DELETE /api/users/me/avatar
// router.delete('/me/avatar', ensureAuth, removeAvatar)

// // POST /api/users/me/revoke-sessions
// router.post('/me/revoke-sessions', ensureAuth, revokeSessions)

// // POST /api/users/me/test  (test notification)
// router.post('/me/test', ensureAuth, testNotification)

// export default router




// backend/src/routes/settingsRoutes.js
import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

import {
  getMe,
  updateMe,
  changePassword,
  uploadAvatar,
  removeAvatar,
  revokeSessions,
  testNotification,
  deleteAccount
} from '../controllers/settingsController.js'
import ensureAuth from '../middleware/ensureAuth.js' // ensure this path is correct

const router = Router()

// multer storage
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadDir = path.resolve(process.cwd(), 'public', 'uploads', 'avatars')

// ensure directory exists
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png'
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`
    cb(null, name)
  }
})

const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } }) // 2MB

// GET /api/users/me
router.get('/me', ensureAuth, getMe)

// DELETE /api/users/me
router.delete('/me', ensureAuth, deleteAccount)

// PUT /api/users/me
router.put('/me', ensureAuth, updateMe)

// PUT /api/users/me/password
router.put('/me/password', ensureAuth, changePassword)

// POST /api/users/me/avatar
router.post('/me/avatar', ensureAuth, upload.single('avatar'), uploadAvatar)

// DELETE /api/users/me/avatar
router.delete('/me/avatar', ensureAuth, removeAvatar)

// POST /api/users/me/revoke-sessions
router.post('/me/revoke-sessions', ensureAuth, revokeSessions)

// POST /api/users/me/test  (test notification)
router.post('/me/test', ensureAuth, testNotification)

export default router
