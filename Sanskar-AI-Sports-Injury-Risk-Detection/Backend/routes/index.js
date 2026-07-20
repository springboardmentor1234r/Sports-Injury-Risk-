import express from 'express';
import authRoutes from './authRoutes.js';
import athleteRoutes from './athleteRoutes.js';
import videoRoutes from './videoRoutes.js';
import aiRoutes from './aiRoutes.js';

const router = express.Router();

// Mount Auth routes
router.use('/auth', authRoutes);
router.use('/athletes', athleteRoutes);
router.use('/videos', videoRoutes);
router.use('/ai', aiRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    message: 'AI Sports Injury Risk Detection API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
