import { Router } from 'express';
import { createRoom, joinRoom, getRoom, leaveRoom, invitePartner } from '../controllers/roomController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.post('/', createRoom);
router.post('/join', joinRoom);
router.post('/invite', invitePartner);
router.get('/:roomId', getRoom);
router.post('/:roomId/leave', leaveRoom);
router.post('/:roomId/invite', invitePartner);

export default router;
