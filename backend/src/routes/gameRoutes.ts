import { Router } from 'express';
import { getGameCatalog, getGameById, startGameSession, getGameSession } from '../controllers/gameController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getGameCatalog);
router.get('/:gameId', getGameById);
router.post('/:gameId/start', startGameSession);
router.get('/sessions/:sessionId', getGameSession);

export default router;
