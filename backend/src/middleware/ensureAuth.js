// // backend/src/middleware/ensureAuth.js
// import jwt from 'jsonwebtoken'
// import User from '../models/User.js'

// /**
//  * ensureAuth middleware (ESM)
//  * - expects Authorization: Bearer <token> OR cookie token (optional)
//  * - verifies JWT and attaches req.user = { id, name, email, iat, exp }
//  * - returns 401 if missing/invalid
//  */
// export default async function ensureAuth(req, res, next) {
//   try {
//     const auth = req.headers?.authorization || ''
//     const cookieToken = req.cookies?.token // if you use cookies + cookie-parser
//     let token = null

//     if (auth && auth.startsWith('Bearer ')) {
//       token = auth.slice(7).trim()
//     } else if (cookieToken) {
//       token = cookieToken
//     }

//     if (!token) {
//       return res.status(401).json({ error: 'Unauthorized' })
//     }

//     let payload
//     try {
//       payload = jwt.verify(token, process.env.JWT_SECRET)
//     } catch (err) {
//       return res.status(401).json({ error: 'Invalid or expired token' })
//     }

//     // Attach minimal user info to req.user. Optionally fetch user from DB.
//     // If you want full user record uncomment DB fetch below.
//     req.user = {
//       id: payload.id || payload._id || payload.sub,
//       email: payload.email,
//       name: payload.name
//     }

//     // Optional: fetch fresh user document if you rely on DB fields like sessionsRevokedAt
//     try {
//       if (req.user.id) {
//         const dbUser = await User.findById(req.user.id).select('-password -__v')
//         if (dbUser) {
//           // If you implemented sessionsRevokedAt, check token iat against it:
//           if (dbUser.sessionsRevokedAt && payload.iat) {
//             const tokenIatMs = payload.iat * 1000
//             if (tokenIatMs < new Date(dbUser.sessionsRevokedAt).getTime()) {
//               return res.status(401).json({ error: 'Token revoked' })
//             }
//           }
//           // attach fresh fields
//           req.user = {
//             id: dbUser._id.toString(),
//             email: dbUser.email,
//             name: dbUser.name,
//             avatarUrl: dbUser.avatarUrl,
//             roles: dbUser.roles // optional
//           }
//         }
//       }
//     } catch (e) {
//       // non-fatal DB fetch errors - continue with token payload
//       console.warn('ensureAuth: failed to refresh user from DB', e?.message || e)
//     }

//     return next()
//   } catch (err) {
//     console.error('ensureAuth error', err)
//     return res.status(500).json({ error: 'Auth failure' })
//   }
// }
// backend/src/middleware/ensureAuth.js
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

/**
 * ensureAuth middleware (ESM)
 * - expects Authorization: Bearer <token> OR cookie token (optional)
 * - verifies JWT and attaches req.user = { id, name, email, iat, exp, avatarUrl, roles }
 * - returns 401 if missing/invalid or if token was revoked by sessionsRevokedAt
 */
export default async function ensureAuth(req, res, next) {
  try {
    const auth = req.headers?.authorization || ''
    const cookieToken = req.cookies?.token // if you use cookies + cookie-parser
    let token = null

    if (auth && auth.startsWith('Bearer ')) {
      token = auth.slice(7).trim()
    } else if (cookieToken) {
      token = cookieToken
    }

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    let payload
    try {
      // This will throw if invalid/expired
      payload = jwt.verify(token, process.env.JWT_SECRET)
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    // Attach minimal info right away (from token). Keep iat/exp if present.
    const tokenUserId = payload.id || payload._id || payload.sub
    const tokenIat = payload.iat // seconds since epoch
    const tokenExp = payload.exp

    // set a minimal req.user based on token; we'll refresh from DB below
    req.user = {
      id: tokenUserId,
      email: payload.email,
      name: payload.name,
      iat: tokenIat,
      exp: tokenExp
    }

    // Optional: fetch fresh user document (to get sessionsRevokedAt, avatarUrl, roles, etc.)
    if (tokenUserId) {
      try {
        const dbUser = await User.findById(tokenUserId).select('-password -__v')
        if (!dbUser) {
          // token refers to a non-existent user
          return res.status(401).json({ error: 'Unauthorized' })
        }

        // If sessionsRevokedAt exists, compare token issuance time and reject if token pre-dates revocation
        if (dbUser.sessionsRevokedAt && tokenIat) {
          const revokedAtMs = new Date(dbUser.sessionsRevokedAt).getTime()
          const tokenIatMs = tokenIat * 1000
          if (tokenIatMs < revokedAtMs) {
            return res.status(401).json({ error: 'Token revoked' })
          }
        }

        // Attach fresh fields
        req.user = {
          id: dbUser._id.toString(),
          email: dbUser.email,
          name: dbUser.name,
          avatarUrl: dbUser.avatarUrl,
          roles: dbUser.roles,
          iat: tokenIat,
          exp: tokenExp
        }
      } catch (e) {
        // non-fatal DB fetch error — warn and continue with token payload user
        console.warn('ensureAuth: failed to refresh user from DB', e?.message || e)
      }
    }

    return next()
  } catch (err) {
    console.error('ensureAuth error', err)
    return res.status(500).json({ error: 'Auth failure' })
  }
}
