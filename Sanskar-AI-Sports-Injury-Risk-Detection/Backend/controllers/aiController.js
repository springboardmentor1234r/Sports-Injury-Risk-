import path from 'path';
import { fileURLToPath } from 'url';
import processVideoPose from '../ai/processors/poseProcessingPipeline.js';
import Athlete from '../models/Athlete.js';
import Video from '../models/Video.js';
import AnalysisHistory from '../models/AnalysisHistory.js';
import { successResponse } from '../utils/apiResponse.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const analyzeVideoPose = async (req, res, next) => {
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

    const videoPath = path.join(__dirname, '..', 'uploads', 'videos', req.file.filename);
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
