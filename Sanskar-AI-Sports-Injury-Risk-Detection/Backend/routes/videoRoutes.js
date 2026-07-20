import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { protect } from '../middleware/authMiddleware.js';
import { uploadVideo, getVideosByAthlete, deleteVideo } from '../controllers/videoController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads', 'videos'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const extension = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${extension}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /mp4|mov|avi|webm/i;
  const extension = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.test(extension)) {
    cb(null, true);
  } else {
    cb(new Error('Only MP4, MOV, AVI, and WEBM video files are allowed'));
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
  fileFilter,
});

const router = express.Router();

router.post('/', protect, upload.single('video'), uploadVideo);
router.get('/athlete/:athleteId', protect, getVideosByAthlete);
router.delete('/:id', protect, deleteVideo);

export default router;
