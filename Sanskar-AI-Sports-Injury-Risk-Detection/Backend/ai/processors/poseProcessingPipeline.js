import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import jpeg from 'jpeg-js';
import extractFrames from '../services/videoFrameExtractor.js';
import detectPose from '../services/poseDetector.js';
import serializePoseLandmarks from '../utils/poseLandmarkSerializer.js';
import calculateJointAngles from '../utils/jointAngleCalculator.js';
import analyzeMovement, { calculateAnalysisQuality, roundJointAngles } from '../utils/movementAnalysis.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getFrameDimensions = (imageBuffer) => {
  const { width, height } = jpeg.decode(imageBuffer, { useTArray: true });
  return { width, height };
};

const cleanupExtractedFrames = (outputDir) => {
  if (!fs.existsSync(outputDir)) return;

  fs.readdirSync(outputDir)
    .filter((file) => file.endsWith('.jpg'))
    .forEach((file) => fs.unlinkSync(path.join(outputDir, file)));
};

const processVideoPose = async (videoPath) => {
  const outputDir = path.join(__dirname, '..', '..', 'uploads', 'pose-output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    const frameFiles = await extractFrames(videoPath, outputDir);
    const frameResults = [];

    for (const framePath of frameFiles) {
      const imageBuffer = fs.readFileSync(framePath);
      const { width, height } = getFrameDimensions(imageBuffer);
      const landmarks = await detectPose(imageBuffer);
      const serialized = serializePoseLandmarks(landmarks, width, height);
      const jointAngles = roundJointAngles(calculateJointAngles(landmarks));
      const movementAnalysis = analyzeMovement(jointAngles);
      const analysisQuality = calculateAnalysisQuality(landmarks);

      frameResults.push({
        framePath: path.basename(framePath),
        landmarks: serialized,
        jointAngles,
        movementAnalysis,
        analysisQuality,
      });
    }

    return {
      frameCount: frameResults.length,
      frames: frameResults,
    };
  } finally {
    cleanupExtractedFrames(outputDir);
  }
};

export default processVideoPose;
