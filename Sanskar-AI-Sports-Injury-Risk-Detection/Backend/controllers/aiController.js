import path from 'path';
import { fileURLToPath } from 'url';
import processVideoPose from '../ai/processors/poseProcessingPipeline.js';
import { successResponse } from '../utils/apiResponse.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const analyzeVideoPose = async (req, res, next) => {
  try {
    console.log(req.file); // maine lagaya h chat gpt ke kahne pr
    if (!req.file) {
      res.status(400);
      throw new Error('Please upload a video file');
    }

    const videoPath = path.join(__dirname, '..', 'uploads', 'videos', req.file.filename);
    const result = await processVideoPose(videoPath);

    res.status(200).json(successResponse(result, 'Pose landmark extraction completed'));
  } catch (error) {
    next(error);
  }
};
