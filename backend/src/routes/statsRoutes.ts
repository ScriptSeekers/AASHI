import { Router } from 'express';
import { 
  getMyStatistics, 
  getRoomStatistics, 
  clearAllGameHistory, 
  deleteGameHistoryItem 
} from '../controllers/statsController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/me', getMyStatistics);
router.get('/room/:roomId', getRoomStatistics);
router.delete('/history', clearAllGameHistory);
router.post('/history/clear', clearAllGameHistory);
router.delete('/history/:id', deleteGameHistoryItem);
router.post('/history/:id/delete', deleteGameHistoryItem);

export default router;
