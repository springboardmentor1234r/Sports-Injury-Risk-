import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { protect } from '../middleware/authMiddleware.js';
import { analyzeVideoPose } from '../controllers/aiController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, '..', 'uploads', 'videos'),
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const extension = path.extname(file.originalname);
      cb(null, `${uniqueSuffix}${extension}`);
    },
  }),
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
});

const router = express.Router();

router.post('/pose', protect, upload.single('video'), analyzeVideoPose);

export default router;
