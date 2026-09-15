import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { getStaffTickets } from '../controllers/staff.controller.js'
import {
  getStaffTicketDetail,
  updateTicketOwner,
  updateTicketPriority,
  updateTicketStatus,
} from '../controllers/staffDetail.controller.js'

const router = Router()

// All /staff routes require IT_STAFF or ADMINISTRATOR
router.use(requireAuth, requireRole('IT_STAFF', 'ADMINISTRATOR'))

router.get('/tickets', getStaffTickets)

// Ticket Detail routes
router.get('/tickets/:id', getStaffTicketDetail)
router.patch('/tickets/:id/owner', updateTicketOwner)
router.patch('/tickets/:id/priority', updateTicketPriority)
router.patch('/tickets/:id/status', updateTicketStatus)

export default router
