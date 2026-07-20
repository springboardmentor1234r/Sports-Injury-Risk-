import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ensureFfmpegExists = () => {
  const ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';
  return ffmpegPath;
};

const extractFrames = async (videoPath, outputDir, frameIntervalSeconds = 0.5) => {
  ensureFfmpegExists();

  if (!fs.existsSync(videoPath)) {
    throw new Error('Video file not found');
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const framePattern = path.join(outputDir, 'frame-%03d.jpg');

  return new Promise((resolve, reject) => {
    execFile(
      ensureFfmpegExists(),
      [
        '-i',
        videoPath,
        '-vf',
        `fps=1/${frameIntervalSeconds}`,
        framePattern,
      ],
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Failed to extract frames: ${stderr || error.message}`));
          return;
        }

        const frameFiles = fs.readdirSync(outputDir)
          .filter((file) => file.endsWith('.jpg'))
          .sort()
          .map((file) => path.join(outputDir, file));

        resolve(frameFiles);
      }
    );
  });
};

export default extractFrames;
