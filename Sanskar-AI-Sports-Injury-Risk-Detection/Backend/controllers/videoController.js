import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Video from '../models/Video.js';
import Athlete from '../models/Athlete.js';
import { successResponse } from '../utils/apiResponse.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '..', 'uploads', 'videos');

const ensureUploadDir = () => {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
};

export const uploadVideo = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('Please upload a video file');
    }

    const { athleteId } = req.body;

    if (!athleteId) {
      res.status(400);
      throw new Error('Athlete ID is required');
    }

    const athlete = await Athlete.findOne({ _id: athleteId, createdBy: req.user._id });
    if (!athlete) {
      res.status(404);
      throw new Error('Athlete not found');
    }

    ensureUploadDir();

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const extension = path.extname(req.file.originalname);
    const storedFileName = `${uniqueSuffix}${extension}`;
    const filePath = path.join(uploadDir, storedFileName);

    fs.renameSync(req.file.path, filePath);

    const video = await Video.create({
      athleteId,
      uploadedBy: req.user._id,
      originalFileName: req.file.originalname,
      storedFileName,
      filePath: `/uploads/videos/${storedFileName}`,
      fileSize: req.file.size,
    });

    res.status(201).json(successResponse(video, 'Video uploaded successfully'));
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

export const getVideosByAthlete = async (req, res, next) => {
  try {
    const { athleteId } = req.params;

    const athlete = await Athlete.findOne({ _id: athleteId, createdBy: req.user._id });
    if (!athlete) {
      res.status(404);
      throw new Error('Athlete not found');
    }

    const videos = await Video.find({ athleteId, uploadedBy: req.user._id }).sort({ uploadDate: -1 });

    res.status(200).json(successResponse(videos));
  } catch (error) {
    next(error);
  }
};

export const deleteVideo = async (req, res, next) => {
  try {
    const video = await Video.findOne({ _id: req.params.id, uploadedBy: req.user._id });

    if (!video) {
      res.status(404);
      throw new Error('Video not found');
    }

    const fullPath = path.join(__dirname, '..', video.filePath.replace(/^\//, ''));
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    await Video.deleteOne({ _id: req.params.id, uploadedBy: req.user._id });

    res.status(200).json(successResponse(null, 'Video deleted successfully'));
  } catch (error) {
    next(error);
  }
};
