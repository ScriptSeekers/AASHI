import { Router } from 'express';
import { getPendingInvitations, acceptInvitation, declineInvitation } from '../controllers/invitationController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/pending', getPendingInvitations);
router.post('/:id/accept', acceptInvitation);
router.post('/:id/decline', declineInvitation);

export default router;
