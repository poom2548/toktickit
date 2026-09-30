import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const VALID_ROLES = ['REQUESTER', 'IT_STAFF', 'ADMINISTRATOR'] as const
type Role = typeof VALID_ROLES[number]

export async function listUsers(req: Request, res: Response): Promise<any> {
  const { search, role } = req.query as { search?: string; role?: string }

  // Validate role filter if provided
  if (role && !VALID_ROLES.includes(role as Role)) {
    return res.status(400).json({ error: `Invalid role filter. Valid roles: ${VALID_ROLES.join(', ')}.` })
  }

  try {
    const where: any = {}

    // Case-insensitive search by name OR email
    if (search && search.trim().length > 0) {
      where.OR = [
        { name:  { contains: search.trim(), mode: 'insensitive' } },
        { email: { contains: search.trim(), mode: 'insensitive' } },
      ]
    }

    // Optional role filter
    if (role) {
      where.role = role
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        requiresPasswordChange: true,
        createdAt: true,
      },
    })

    return res.status(200).json({ users })
  } catch (err) {
    console.error('List users error:', err)
    return res.status(500).json({ error: 'An unexpected error occurred.' })
  }
}

export async function createUser(req: Request, res: Response): Promise<any> {
  const { name, email, role, isActive = true, password } = req.body

  // Validate required fields
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(422).json({ error: 'Name is required.' })
  }
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(422).json({ error: 'A valid email address is required.' })
  }
  if (!role || !VALID_ROLES.includes(role as Role)) {
    return res.status(422).json({
      error: `Invalid role. Valid roles: ${VALID_ROLES.join(', ')}.`,
    })
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(422).json({ error: 'Initial password must be at least 8 characters.' })
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existing) {
      return res.status(409).json({ error: 'A user with this email address already exists.' })
    }

    const { hashPassword } = await import('../utils/password.js')
    const passwordHash = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role: role as Role,
        isActive: Boolean(isActive),
        passwordHash,
        requiresPasswordChange: true,
      },
      select: {
        id: true, name: true, email: true, role: true,
        isActive: true, requiresPasswordChange: true, createdAt: true,
      },
    })

    return res.status(201).json(user)
  } catch (err) {
    console.error('Create user error:', err)
    return res.status(500).json({ error: 'An unexpected error occurred.' })
  }
}

export async function editUser(req: Request, res: Response): Promise<any> {
  const { id: targetId } = req.params
  const requesterId = req.user!.id
  const { name, email, role, isActive } = req.body

  try {
    const targetUser = await prisma.user.findUnique({ where: { id: targetId } })
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found.' })
    }

    if (targetId === requesterId && isActive === false) {
      return res.status(403).json({
        error: 'You cannot deactivate your own account.',
      })
    }

    const isBecomingInactiveAdmin =
      targetUser.role === 'ADMINISTRATOR' &&
      (isActive === false || (role && role !== 'ADMINISTRATOR'))

    if (isBecomingInactiveAdmin) {
      const activeAdminCount = await prisma.user.count({
        where: { role: 'ADMINISTRATOR', isActive: true },
      })
      if (activeAdminCount <= 1) {
        return res.status(409).json({
          error: 'Cannot deactivate or change the role of the last active Administrator. At least one active Administrator must exist.',
        })
      }
    }

    if (role && !VALID_ROLES.includes(role as Role)) {
      return res.status(422).json({
        error: `Invalid role. Valid roles: ${VALID_ROLES.join(', ')}.`,
      })
    }

    if (email && email.toLowerCase() !== targetUser.email) {
      const conflict = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      })
      if (conflict) {
        return res.status(409).json({
          error: 'A user with this email address already exists.',
        })
      }
    }

    const updateData: any = {}
    if (name !== undefined)     updateData.name     = name.trim()
    if (email !== undefined)    updateData.email    = email.toLowerCase().trim()
    if (role !== undefined)     updateData.role     = role
    if (isActive !== undefined) updateData.isActive = Boolean(isActive)

    const updated = await prisma.user.update({
      where: { id: targetId },
      data: updateData,
      select: {
        id: true, name: true, email: true, role: true,
        isActive: true, requiresPasswordChange: true, updatedAt: true,
      },
    })

    return res.status(200).json(updated)
  } catch (err) {
    console.error('Edit user error:', err)
    return res.status(500).json({ error: 'An unexpected error occurred.' })
  }
}

export async function setUserPassword(req: Request, res: Response): Promise<any> {
  const { id: targetId } = req.params
  const { password } = req.body

  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(422).json({ error: 'New password must be at least 8 characters.' })
  }

  try {
    const targetUser = await prisma.user.findUnique({ where: { id: targetId } })
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found.' })
    }

    const { hashPassword } = await import('../utils/password.js')
    const passwordHash = await hashPassword(password)

    await prisma.user.update({
      where: { id: targetId },
      data: {
        passwordHash,
        requiresPasswordChange: true,
      },
    })

    return res.status(200).json({
      message: 'Password updated. The user must change their password at next login.',
    })
  } catch (err) {
    console.error('Set user password error:', err)
    return res.status(500).json({ error: 'An unexpected error occurred.' })
  }
}
