import * as tf from '@tensorflow/tfjs';
// The package root eagerly loads the browser MediaPipe adapter in v2.1.3.
// Import the verified TFJS BlazePose implementation directly so Node never
// constructs MediaPipe's browser-only Pose class.
import { load as loadBlazePoseTfjs } from '@tensorflow-models/pose-detection/dist/blazepose_tfjs/detector.js';
import jpeg from 'jpeg-js';
import { PNG } from 'pngjs';

const LANDMARK_COUNT = 33;
let detectorPromise = null;

const createEmptyLandmarks = () => Array.from({ length: LANDMARK_COUNT }, () => ({
  x: 0,
  y: 0,
  z: 0,
  visibility: 0,
}));

const getDetector = async () => {
  if (!detectorPromise) {
    detectorPromise = (async () => {
      // The CPU backend is available in Node through @tensorflow/tfjs and
      // avoids WebGL, DOM, and browser MediaPipe dependencies.
      await tf.setBackend('cpu');
      await tf.ready();

      return loadBlazePoseTfjs({
        modelType: 'full',
        enableSegmentation: false,
        enableSmoothing: false,
      });
    })().catch((error) => {
      // Allow a later request to retry model initialization.
      detectorPromise = null;
      throw error;
    });
  }

  return detectorPromise;
};

const rgbTensor = (rgbaPixels, width, height) => {
  const pixels = new Uint8Array(width * height * 3);

  for (let sourceIndex = 0, targetIndex = 0; sourceIndex < rgbaPixels.length; sourceIndex += 4, targetIndex += 3) {
    pixels[targetIndex] = rgbaPixels[sourceIndex];
    pixels[targetIndex + 1] = rgbaPixels[sourceIndex + 1];
    pixels[targetIndex + 2] = rgbaPixels[sourceIndex + 2];
  }

  return tf.tensor3d(pixels, [height, width, 3], 'int32');
};

const decodeImageToTensor = (imageBuffer) => {
  const signature = imageBuffer.subarray(0, 8);
  const isPng = signature[0] === 0x89 && signature[1] === 0x50 && signature[2] === 0x4e && signature[3] === 0x47;
  const isJpg = signature[0] === 0xff && signature[1] === 0xd8;

  if (isPng) {
    const { data, width, height } = PNG.sync.read(imageBuffer);
    return rgbTensor(data, width, height);
  }

  if (isJpg) {
    const decoded = jpeg.decode(imageBuffer, { useTArray: true });
    if (!decoded?.data) return null;

    const { data, width, height } = decoded;
    const pixels = data instanceof Buffer ? data : new Uint8Array(data);

    if (pixels.length === width * height * 4) {
      return rgbTensor(pixels, width, height);
    }

    if (pixels.length === width * height * 3) {
      return tf.tensor3d(pixels, [height, width, 3], 'int32');
    }
  }

  return null;
};

const normalizeLandmarks = (pose) => {
  const keypoints = pose?.keypoints ?? [];
  const keypoints3D = pose?.keypoints3D ?? [];

  const landmarks = Array.from({ length: LANDMARK_COUNT }, (_, index) => {
    const point = keypoints[index];
    const point3D = keypoints3D[index];

    return {
      x: Number(point?.x ?? 0),
      y: Number(point?.y ?? 0),
      z: Number(point3D?.z ?? point?.z ?? 0),
      visibility: Number(point?.score ?? point?.visibility ?? 0),
    };
  });

  return landmarks;
};

const detectPose = async (imageBuffer) => {
  let tensor = null;

  try {
    const detector = await getDetector();
    tensor = decodeImageToTensor(imageBuffer);

    if (!tensor) {
      return createEmptyLandmarks();
    }

    const poses = await detector.estimatePoses(tensor, { flipHorizontal: false });
    return poses?.length ? normalizeLandmarks(poses[0]) : createEmptyLandmarks();
  } catch (error) {
    console.warn('Pose detection failed:', error.message);
    return createEmptyLandmarks();
  } finally {
    // One tensor is allocated per frame; always release it after async inference.
    tensor?.dispose();
  }
};

export default detectPose;
