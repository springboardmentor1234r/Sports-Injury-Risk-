import path from 'path';
import fs from 'fs';
import { execFile } from 'child_process';
import { fileURLToPath } from 'url';
import processVideoPose from '../ai/processors/poseProcessingPipeline.js';
import Athlete from '../models/Athlete.js';
import Video from '../models/Video.js';
import AnalysisHistory from '../models/AnalysisHistory.js';
import { successResponse } from '../utils/apiResponse.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getFfprobePath = () => {
  return process.env.FFPROBE_PATH || 'ffprobe';
};

const getVideoDuration = (filePath) => {
  return new Promise((resolve, reject) => {
    execFile(
      getFfprobePath(),
      [
        '-v', 'error',
        '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        filePath
      ],
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Failed to read video duration: ${stderr || error.message}`));
          return;
        }
        resolve(parseFloat(stdout.trim()));
      }
    );
  });
};

export const analyzeVideoPose = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('Please upload a video file');
    }

    const videoPath = path.join(__dirname, '..', 'uploads', 'videos', req.file.filename);

    // 1. Validate File Size (Multer metadata)
    if (req.file.size > 10 * 1024 * 1024) {
      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
      }
      return res.status(400).json({
        success: false,
        message: 'Video size must not exceed 10 MB.',
      });
    }

    // 2. Validate Video Duration (FFprobe)
    let duration;
    try {
      duration = await getVideoDuration(videoPath);
    } catch (durationErr) {
      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
      }
      return res.status(400).json({
        success: false,
        message: 'Could not retrieve video duration',
      });
    }

    if (duration > 10) {
      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
      }
      return res.status(400).json({
        success: false,
        message: 'Video duration must not exceed 10 seconds.',
      });
    }

    const { athleteId } = req.body;
    if (!athleteId) {
      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
      }
      res.status(400);
      throw new Error('Athlete ID is required');
    }

    const athlete = await Athlete.findOne({ _id: athleteId, createdBy: req.user._id });
    if (!athlete) {
      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
      }
      res.status(404);
      throw new Error('Athlete not found');
    }

    const result = await processVideoPose(videoPath);
    const responsePayload = successResponse(result, 'Pose landmark extraction completed');
    const video = await Video.create({
      athleteId: athlete._id,
      uploadedBy: req.user._id,
      originalFileName: req.file.originalname,
      storedFileName: req.file.filename,
      filePath: `/uploads/videos/${req.file.filename}`,
      fileSize: req.file.size,
      processingStatus: 'Completed',
    });

    await AnalysisHistory.create({
      athleteId: athlete._id,
      uploadedBy: req.user._id,
      videoId: video._id,
      video: {
        originalFileName: video.originalFileName,
        storedFileName: video.storedFileName,
        filePath: video.filePath,
        mimeType: req.file.mimetype,
        fileSize: video.fileSize,
        uploadedAt: video.uploadDate,
      },
      rawResponse: responsePayload,
      riskLevel: result.riskPrediction.riskLevel,
      riskScore: result.riskPrediction.riskScore,
      frameCount: result.frameCount,
      reportGeneratedAt: result.analysisReport?.analysisMetadata?.generatedAt ?? null,
    });

    res.status(200).json(responsePayload);
  } catch (error) {
    next(error);
  }
};
