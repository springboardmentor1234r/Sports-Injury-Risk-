import express from 'express';
import {
  registerUser,
  loginUser,
  getMe,
  requestPasswordReset,
  verifyResetOtp,
  resetPassword,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', requestPasswordReset);
router.post('/verify-reset-otp', verifyResetOtp);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', protect, getMe);

export default router;
