import type { Request, Response, NextFunction } from 'express'
import { adminAuth } from '../firebase-admin.js'

declare global {
  namespace Express {
    interface Request {
      trainerId: string
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing auth token' })
    return
  }
  try {
    const token = header.slice(7)
    const decoded = await adminAuth.verifyIdToken(token)
    req.trainerId = decoded.uid
    next()
  } catch {
    res.status(401).json({ error: 'Invalid auth token' })
  }
}
