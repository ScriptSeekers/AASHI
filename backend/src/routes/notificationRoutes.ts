import { Router } from 'express';
import { getNotifications, markNotificationAsRead } from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getNotifications);
router.patch('/:id/read', markNotificationAsRead);

export default router;
