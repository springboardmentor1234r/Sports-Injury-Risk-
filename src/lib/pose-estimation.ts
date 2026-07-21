/**
 * Pose estimation engine (Milestone 2).
 *
 * Runs MediaPipe's BlazePose model client-side, in the browser, via WASM —
 * there's no video-processing backend service. This is a deliberate
 * architecture choice: the app deploys to Cloudflare Workers, which can't
 * run a GPU-backed CV pipeline, so inference happens on the device of
 * whoever clicks "Run analysis" instead.
 *
 * IMPORTANT LIMITATION: this only works on videos the browser can actually
 * decode pixel data from — a direct, CORS-accessible video file (.mp4,
 * .webm, .mov, etc). It does NOT work on embedded players like YouTube or
 * Vimeo links, or on Google Drive "preview" links: those render inside a
 * cross-origin iframe that JavaScript in this app is not allowed to read
 * pixels from, by browser design (not a bug we can route around). See
 * `isDirectVideoUrl` — the UI uses it to decide whether to offer analysis
 * at all for a given submission.
 */

import type { PoseFrame } from "./biomechanics";

// Direct video file extensions we can actually decode and sample frames from.
const DIRECT_VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".m4v", ".ogv"];

export function isDirectVideoUrl(url: string): boolean {
  try {
    const path = new URL(url).pathname.toLowerCase();
    return DIRECT_VIDEO_EXTENSIONS.some((ext) => path.endsWith(ext));
  } catch {
    return false;
  }
}

const TASKS_VISION_VERSION = "0.10.35";
const WASM_BASE_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VISION_VERSION}/wasm`;
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

// Analysis is capped so a browser tab never gets stuck grinding through an
// hour-long video: only the first MAX_ANALYZED_SECONDS are sampled, at
// SAMPLE_INTERVAL_MS between frames.
const SAMPLE_INTERVAL_MS = 200;
const MAX_ANALYZED_SECONDS = 30;

let landmarkerPromise: Promise<import("@mediapipe/tasks-vision").PoseLandmarker> | null = null;

async function getLandmarker() {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision");
      const vision = await FilesetResolver.forVisionTasks(WASM_BASE_URL);
      return PoseLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
        runningMode: "VIDEO",
        numPoses: 1,
      });
    })().catch((err) => {
      // Don't leave a rejected promise cached — otherwise one transient
      // load failure (network blip, blocked CDN request, GPU init issue)
      // permanently breaks every analysis until a page reload.
      landmarkerPromise = null;
      throw err;
    });
  }
  return landmarkerPromise;
}

export class PoseEstimationError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "PoseEstimationError";
  }
}

function waitForVideoReady(video: HTMLVideoElement): Promise<void> {
  return new Promise((resolve, reject) => {
    if (video.readyState >= 2) return resolve();
    const onLoaded = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      const mediaError = video.error;
      // MediaError codes: 1=ABORTED 2=NETWORK 3=DECODE 4=SRC_NOT_SUPPORTED
      const codeHints: Record<number, string> = {
        1: "Load was aborted.",
        2: "A network error occurred while fetching the video — this is the typical signature of a missing CORS header (Access-Control-Allow-Origin) on the file's response.",
        3: "The browser fetched the file but couldn't decode it — the container/codec combination isn't supported (e.g. an unsupported VP9/AV1 profile inside the webm).",
        4: "The browser doesn't support this source — often a wrong Content-Type header (not video/webm or video/mp4) or an unsupported codec.",
      };
      const hint = mediaError ? codeHints[mediaError.code] ?? mediaError.message : undefined;
      reject(
        new PoseEstimationError(
          `Couldn't load this video in the browser${hint ? `: ${hint}` : ". It may not be a direct, CORS-accessible video file."}`,
          mediaError,
        ),
      );
    };
    const cleanup = () => {
      video.removeEventListener("loadeddata", onLoaded);
      video.removeEventListener("error", onError);
    };
    video.addEventListener("loadeddata", onLoaded);
    video.addEventListener("error", onError);
  });
}

function seekTo(video: HTMLVideoElement, timeSeconds: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const onSeeked = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new PoseEstimationError("Video seek failed during analysis."));
    };
    const cleanup = () => {
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
    };
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onError);
    video.currentTime = timeSeconds;
  });
}

export type PoseEstimationProgress = { processedFrames: number; totalFrames: number };

/**
 * Creates a hidden, muted <video> element pointed at `videoUrl`, samples it
 * every SAMPLE_INTERVAL_MS, and returns one pose frame per sample. Cleans
 * up the video element itself when done.
 */
export async function estimatePoseFromVideoUrl(
  videoUrl: string,
  onProgress?: (p: PoseEstimationProgress) => void,
): Promise<PoseFrame[]> {
  if (typeof window === "undefined") {
    throw new PoseEstimationError("Pose estimation only runs in the browser.");
  }
  if (!isDirectVideoUrl(videoUrl)) {
    throw new PoseEstimationError(
      "This submission is a link to an embedded player (YouTube, Vimeo, Drive preview, etc.), not a direct video file. Browsers can't read pixel data out of another site's embedded player, so automatic pose analysis isn't possible for it — a direct .mp4/.webm/.mov link is needed instead.",
    );
  }

  const landmarker = await getLandmarker().catch((err) => {
    throw new PoseEstimationError(
      "Couldn't load the pose estimation model. Check your internet connection and try again.",
      err,
    );
  });

  const video = document.createElement("video");
  video.crossOrigin = "anonymous";
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = videoUrl;
  // Keep it out of layout but still decodable — MediaPipe needs a real
  // rendered <video> element, not just an in-memory buffer.
  video.style.position = "fixed";
  video.style.left = "-9999px";
  video.style.width = "1px";
  video.style.height = "1px";
  document.body.appendChild(video);

  try {
    await waitForVideoReady(video);

    const duration = Math.min(video.duration || 0, MAX_ANALYZED_SECONDS);
    if (!Number.isFinite(duration) || duration <= 0) {
      throw new PoseEstimationError("This video has no readable duration.");
    }

    const totalFrames = Math.max(1, Math.floor((duration * 1000) / SAMPLE_INTERVAL_MS));
    const frames: PoseFrame[] = [];

    for (let i = 0; i < totalFrames; i++) {
      const tSeconds = (i * SAMPLE_INTERVAL_MS) / 1000;
      await seekTo(video, tSeconds);

      const result = landmarker.detectForVideo(video, i * SAMPLE_INTERVAL_MS + 1);
      const landmarks = result.landmarks?.[0];
      if (landmarks) {
        frames.push({
          t: i * SAMPLE_INTERVAL_MS,
          landmarks: landmarks.map((l) => ({ x: l.x, y: l.y, z: l.z, visibility: l.visibility })),
        });
      }

      onProgress?.({ processedFrames: i + 1, totalFrames });
    }

    if (frames.length === 0) {
      throw new PoseEstimationError(
        "No person was detected in this video. Make sure the athlete is clearly visible and try again.",
      );
    }

    return frames;
  } finally {
    video.pause();
    video.removeAttribute("src");
    video.load();
    document.body.removeChild(video);
  }
}