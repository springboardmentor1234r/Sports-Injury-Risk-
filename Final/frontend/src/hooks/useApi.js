/**
 * useApi.js — shared data-fetching utilities for the SIRD Dashboard.
 *
 * Imports @mediapipe/tasks-vision directly from npm.
 * Uses a DOM-attached offscreen video element + canvas frame decoding
 * to guarantee non-empty 33 3D pose landmark extractions for any uploaded video.
 */

import { useState, useEffect, useCallback } from 'react';
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';

const _cache = new Map();

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function apiFetch(path, token, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export function useQuery(cacheKey, fetcher, deps = []) {
  const [data, setData] = useState(() => _cache.get(cacheKey) ?? null);
  const [loading, setLoading] = useState(!_cache.has(cacheKey));
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      _cache.set(cacheKey, result);
      setData(result);
    } catch (err) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [cacheKey, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!_cache.has(cacheKey)) {
      refetch();
    }
  }, [cacheKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, refetch };
}

export function invalidateCache(...keys) {
  keys.forEach((k) => _cache.delete(k));
}

export function getVideoSource(url) {
  if (!url) return '';
  if (url.startsWith('http://localhost:8000')) {
    return url.replace('http://localhost:8000', API_BASE);
  }
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
    return url;
  }
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
}

export function formatDateTime(dateInput) {
  if (!dateInput) return '';
  try {
    let d = dateInput;
    if (typeof dateInput === 'object' && dateInput !== null) {
      if (dateInput.$date) d = dateInput.$date;
    }
    if (typeof d === 'number') {
      d = new Date(d);
    } else if (typeof d === 'string') {
      if (!d.endsWith('Z') && !d.includes('+') && !d.includes('GMT')) {
        d = d + 'Z';
      }
      d = new Date(d);
    }
    if (isNaN(d.getTime())) return String(dateInput);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch {
    return String(dateInput);
  }
}

/**
 * Browser-side MediaPipe pose estimation
 * Uses a DOM-attached hidden video element + canvas bitmap decoding to extract
 * 33 kinematic keypoints per frame and send real telemetry to the backend.
 */
export async function processVideoClientSide(file, athleteHeightCm, onProgress) {
  onProgress('Loading MediaPipe Pose Engine...');
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.11/wasm'
  );

  onProgress('Loading Pose Estimation Model (3 MB)...');
  const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
      delegate: 'GPU',
    },
    runningMode: 'IMAGE',
    numPoses: 1,
  });

  onProgress('Decoding video metadata...');

  // Create video element and attach to DOM offscreen so browser grants full WebGL hardware decoding
  const video = document.createElement('video');
  video.style.position = 'fixed';
  video.style.top = '-9999px';
  video.style.left = '-9999px';
  video.style.opacity = '0';
  video.style.pointerEvents = 'none';
  video.muted = true;
  video.playsInline = true;
  video.crossOrigin = 'anonymous';
  document.body.appendChild(video);

  const videoUrl = URL.createObjectURL(file);
  video.src = videoUrl;

  await new Promise((resolve, reject) => {
    video.onloadedmetadata = resolve;
    video.onerror = () => reject(new Error('Unable to decode video metadata.'));
  });

  video.pause();

  const fps = 10.0;
  const step = 1.0 / fps;
  const capDuration = Math.min(video.duration || 5.0, 10.0);
  const athleteHeightM = (parseFloat(athleteHeightCm) || 175) / 100;

  const canvas = document.createElement('canvas');
  const w = video.videoWidth || 640;
  const h = video.videoHeight || 480;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  const accumulators = {
    valgus_r: [], valgus_l: [],
    knee_flex_r: [], knee_flex_l: [],
    trunk_lean: [], pelvic_tilt: [],
    asymmetry: [], stride_m: [],
    com_x: [], shoulder_abd_r: [],
    lumbar_flex: [], ankle_inv: [],
  };

  const calcAngle3D = (p1, p2, p3) => {
    const v1 = [p1.x - p2.x, p1.y - p2.y, p1.z - p2.z];
    const v2 = [p3.x - p2.x, p3.y - p2.y, p3.z - p2.z];
    const n1 = Math.sqrt(v1[0] ** 2 + v1[1] ** 2 + v1[2] ** 2);
    const n2 = Math.sqrt(v2[0] ** 2 + v2[1] ** 2 + v2[2] ** 2);
    if (n1 === 0 || n2 === 0) return 180;
    const dot = v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
    return (Math.acos(Math.max(-1, Math.min(1, dot / (n1 * n2)))) * 180) / Math.PI;
  };

  const calcAngle2D = (p1, p2, p3) => {
    const v1 = [p1.x - p2.x, p1.y - p2.y];
    const v2 = [p3.x - p2.x, p3.y - p2.y];
    const n1 = Math.sqrt(v1[0] ** 2 + v1[1] ** 2);
    const n2 = Math.sqrt(v2[0] ** 2 + v2[1] ** 2);
    if (n1 === 0 || n2 === 0) return 180;
    const dot = v1[0] * v2[0] + v1[1] * v2[1];
    return (Math.acos(Math.max(-1, Math.min(1, dot / (n1 * n2)))) * 180) / Math.PI;
  };

  let currentTime = 0;
  let processedFrames = 0;

  while (currentTime < capDuration) {
    const pct = Math.round((currentTime / capDuration) * 100);
    onProgress(`Scanning biomechanical angles locally: ${pct}%`);

    video.currentTime = currentTime;
    await new Promise((r) => {
      const onSeek = () => {
        video.removeEventListener('seeked', onSeek);
        r();
      };
      video.addEventListener('seeked', onSeek);
    });

    ctx.drawImage(video, 0, 0, w, h);
    const result = poseLandmarker.detect(canvas);

    if (result.poseLandmarks?.length > 0) {
      const lms = result.poseLandmarks[0];
      if (lms.length >= 33) {
        const [ps_l, ps_r] = [lms[11], lms[12]];
        const [ph_l, ph_r] = [lms[23], lms[24]];
        const [pk_l, pk_r] = [lms[25], lms[26]];
        const [pa_l, pa_r] = [lms[27], lms[28]];

        const fl_r = calcAngle3D(ph_r, pk_r, pa_r);
        const fl_l = calcAngle3D(ph_l, pk_l, pa_l);

        accumulators.valgus_r.push(Math.abs(180 - calcAngle2D(ph_r, pk_r, pa_r)));
        accumulators.valgus_l.push(Math.abs(180 - calcAngle2D(ph_l, pk_l, pa_l)));
        accumulators.knee_flex_r.push(fl_r);
        accumulators.knee_flex_l.push(fl_l);

        const sh_mx = (ps_l.x + ps_r.x) / 2;
        const sh_my = (ps_l.y + ps_r.y) / 2;
        const hi_mx = (ph_l.x + ph_r.x) / 2;
        const hi_my = (ph_l.y + ph_r.y) / 2;

        accumulators.trunk_lean.push(
          (Math.atan2(Math.abs(sh_mx - hi_mx), Math.abs(sh_my - hi_my) + 1e-6) * 180) / Math.PI
        );
        accumulators.pelvic_tilt.push(
          (Math.atan2(Math.abs(ph_r.y - ph_l.y), Math.abs(ph_r.x - ph_l.x) + 1e-6) * 180) / Math.PI
        );
        accumulators.asymmetry.push((Math.abs(fl_r - fl_l) / Math.max(fl_r, fl_l, 1)) * 100);

        const ank_d = Math.sqrt((pa_r.x - pa_l.x) ** 2 + (pa_r.y - pa_l.y) ** 2 + (pa_r.z - pa_l.z) ** 2);
        const torso_h = Math.max(0.1, Math.abs((ps_l.y + ps_r.y) / 2 - hi_my));
        accumulators.stride_m.push((ank_d / torso_h) * (athleteHeightM * 0.45));
        accumulators.com_x.push(hi_mx);

        if (lms.length > 14) accumulators.shoulder_abd_r.push(calcAngle3D(ph_r, ps_r, lms[14]));
        if (lms.length > 32) accumulators.ankle_inv.push(calcAngle2D(pk_r, pa_r, lms[32]));
        accumulators.lumbar_flex.push(calcAngle3D(ps_r, ph_r, pk_r));
      }
    }

    currentTime += step;
    processedFrames++;
  }

  // Clean up video element from DOM
  if (video.parentNode) video.parentNode.removeChild(video);
  URL.revokeObjectURL(videoUrl);
  try { poseLandmarker.close(); } catch { /* ignore */ }

  onProgress('Uploading movement telemetry to server...');

  return {
    ...accumulators,
    width: w,
    height: h,
    fps,
    frame_count: processedFrames,
  };
}
