import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { getStaffTickets } from '../controllers/staff.controller.js'

const router = Router()

// All /staff routes require IT_STAFF or ADMINISTRATOR
router.use(requireAuth, requireRole('IT_STAFF', 'ADMINISTRATOR'))

router.get('/tickets', getStaffTickets)

export default router
