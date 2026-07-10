import express from 'express';
import authRoutes from './authRoutes.js';
import athleteRoutes from './athleteRoutes.js';

const router = express.Router();

// Mount Auth routes
router.use('/auth', authRoutes);
router.use('/athletes', athleteRoutes);

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
