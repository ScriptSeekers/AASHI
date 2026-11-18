import { Router } from 'express';
import { getMyStatistics, getRoomStatistics } from '../controllers/statsController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/me', getMyStatistics);
router.get('/room/:roomId', getRoomStatistics);

export default router;
