import { Router } from 'express';
import {
  getPartnerStatus,
  invitePartnerDirect,
  getPendingInvitations,
  acceptInvitation,
  declineInvitation,
  cancelInvitation
} from '../controllers/invitationController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/partner-status', getPartnerStatus);
router.post('/invite-partner', invitePartnerDirect);
router.get('/pending', getPendingInvitations);
router.post('/:id/accept', acceptInvitation);
router.post('/:id/decline', declineInvitation);
router.post('/:id/cancel', cancelInvitation);

export default router;
