import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { verifyPassword, hashPassword, validatePasswordStrength } from '../utils/password'
import { signToken } from '../utils/token'
import { requireAuth } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

router.post('/login', async (req: Request, res: Response): Promise<any> => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' })
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } })

    const GENERIC_ERROR = 'Invalid email or password.'

    if (!user || !user.isActive) {
      await new Promise(resolve => setTimeout(resolve, 200))
      return res.status(401).json({ error: GENERIC_ERROR })
    }

    const passwordMatch = await verifyPassword(password, user.passwordHash)
    if (!passwordMatch) {
      return res.status(401).json({ error: GENERIC_ERROR })
    }

    const token = signToken({ userId: user.id, role: user.role })
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    })

    return res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      requiresPasswordChange: user.requiresPasswordChange,
    })
  } catch (err) {
    console.error('Login error:', err)
    return res.status(500).json({ error: 'An unexpected error occurred. Please try again.' })
  }
})

router.post('/logout', requireAuth, async (req: Request, res: Response): Promise<any> => {
  res.clearCookie('auth_token', { httpOnly: true, sameSite: 'strict' })
  return res.status(200).json({ message: 'Logged out successfully.' })
})

router.get('/me', requireAuth, async (req: Request, res: Response): Promise<any> => {
  return res.status(200).json({
    id: req.user!.id,
    name: req.user!.name,
    email: req.user!.email,
    role: req.user!.role,
    requiresPasswordChange: req.user!.requiresPasswordChange,
  })
})

router.post('/change-password', requireAuth, async (req: Request, res: Response): Promise<any> => {
  const { newPassword } = req.body

  const errors = validatePasswordStrength(newPassword || '')
  if (errors.length > 0) {
    return res.status(422).json({ error: 'Password does not meet requirements.', details: errors })
  }

  try {
    const newHash = await hashPassword(newPassword)

    await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        passwordHash: newHash,
        requiresPasswordChange: false,
      },
    })

    return res.status(200).json({ message: 'Password changed successfully.' })
  } catch (err) {
    console.error('Change password error:', err)
    return res.status(500).json({ error: 'An unexpected error occurred. Please try again.' })
  }
})

export default router
