import { Router } from 'express';
import { 
  getSessions, 
  getSessionById, 
  createSession, 
  sendMessage, 
  deleteSession 
} from '../controllers/chatController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Apply auth middleware to all chat routes
router.use(authenticateToken as any);

router.get('/sessions', getSessions);
router.get('/sessions/:id', getSessionById);
router.post('/sessions', createSession);
router.post('/sessions/:id/message', sendMessage);
router.delete('/sessions/:id', deleteSession);

export default router;
