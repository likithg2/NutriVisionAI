// import jwt from 'jsonwebtoken'

// export function requireAuth(req, res, next) {
//   const auth = req.headers.authorization || ''
//   const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
//   if (!token) return res.status(401).json({ error: 'No token' })
//   try {
//     const payload = jwt.verify(token, process.env.JWT_SECRET)
//     req.user = { id: payload.id, email: payload.email }
//     next()
//   } catch {
//     return res.status(401).json({ error: 'Invalid token' })
//   }
// }
import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'No token' });

    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ error: 'Server misconfigured: JWT secret missing' });

    const payload = jwt.verify(token, secret);
    // Expect your token to include { id, email }
    req.user = { id: payload.id, email: payload.email };
    return next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
