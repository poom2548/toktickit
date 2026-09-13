import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../utils/token'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Extend Express Request to carry the authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        name: string
        email: string
        role: 'REQUESTER' | 'IT_STAFF' | 'ADMINISTRATOR'
        requiresPasswordChange: boolean
        isActive: boolean
      }
    }
  }
}

/**
 * requireAuth — rejects unauthenticated requests with 401.
 * Attaches req.user for downstream handlers.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const token = req.cookies?.auth_token
    if (!token) {
      return res.status(401).json({ error: 'Authentication required.' })
    }
    const payload = verifyToken(token)

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, email: true, role: true, isActive: true, requiresPasswordChange: true },
    })

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Authentication required.' })
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as any,
      requiresPasswordChange: user.requiresPasswordChange,
      isActive: user.isActive,
    }
    next()
  } catch {
    return res.status(401).json({ error: 'Authentication required.' })
  }
}

/**
 * requireRole — rejects authenticated users who do not have one of the permitted roles.
 * Must be called AFTER requireAuth.
 */
export function requireRole(...roles: Array<'REQUESTER' | 'IT_STAFF' | 'ADMINISTRATOR'>) {
  return (req: Request, res: Response, next: NextFunction): any => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' })
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied.' })
    }
    next()
  }
}
