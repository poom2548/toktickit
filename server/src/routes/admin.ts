import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { requireRole } from '../middleware/auth.js'
import {
  listUsers,
  createUser,
  editUser,
  setUserPassword,
} from '../controllers/adminUsers.controller.js'

const router = Router()

// All admin routes require authentication AND Administrator role
router.use(requireAuth)
router.use(requireRole('ADMINISTRATOR'))

router.get('/', listUsers)
router.post('/', createUser)
router.patch('/:id', editUser)
router.patch('/:id/password', setUserPassword)

export default router
