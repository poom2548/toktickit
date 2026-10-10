import { Router } from 'express';
import { changeStatus, getAllowed, requesterResolvedIndication } from './ticket-workflow.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { changeStatusValidator, resolvedIndicationValidator } from './ticket-workflow.validation.js';

const router = Router();

router.use(requireAuth);

router.post('/:id/status', changeStatusValidator, changeStatus);
router.get('/:id/allowed-transitions', getAllowed);
router.post('/:id/requester-resolved-indication', resolvedIndicationValidator, requesterResolvedIndication);

export default router;
