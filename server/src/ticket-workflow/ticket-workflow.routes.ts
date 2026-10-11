import { Router } from 'express';
import { changeStatus, getAllowed, requesterResolvedIndication, authorizeTicketAccess } from './ticket-workflow.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { changeStatusValidator, resolvedIndicationValidator } from './ticket-workflow.validation.js';

const router = Router();

router.use(requireAuth);

router.post('/:id/status', authorizeTicketAccess, changeStatusValidator, changeStatus);
router.get('/:id/allowed-transitions', authorizeTicketAccess, getAllowed);
router.post('/:id/requester-resolved-indication', authorizeTicketAccess, resolvedIndicationValidator, requesterResolvedIndication);

export default router;
