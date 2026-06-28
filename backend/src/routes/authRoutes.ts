import { Router } from 'express';
import { 
  register, 
  verifyEmail, 
  login, 
  googleLogin, 
  forgotPassword, 
  resetPassword, 
  getProfile 
} from '../controllers/authController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', register);
router.get('/verify-email', verifyEmail);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/profile', authenticateToken as any, getProfile);

export default router;
