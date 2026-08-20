import React, { useRef, useEffect, useState } from 'react';
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';

/**
 * PoseOverlayVideo
 * Plays a video and renders a real-time MediaPipe Pose skeleton overlay
 * (glowing yellow bone connections + red joint nodes) on a transparent canvas
 * perfectly aligned over the video frames, accounting for aspect ratio & pillarboxing.
 */
export default function PoseOverlayVideo({ src, style = {}, className = '' }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const landmarkerRef = useRef(null);
  const isMountedRef = useRef(true);

  const [poseReady, setPoseReady] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Standard MediaPipe Pose 33-Landmark Bone Connections
  const POSE_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8], [9, 10],
    [11, 12],
    [11, 13], [13, 15], [15, 17], [15, 19], [15, 21],
    [12, 14], [14, 16], [16, 18], [16, 20], [16, 22],
    [11, 23], [12, 24], [23, 24],
    [23, 25], [25, 27], [27, 29], [27, 31],
    [24, 26], [26, 28], [28, 30], [28, 32]
  ];

  useEffect(() => {
    isMountedRef.current = true;

    const initPose = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.11/wasm'
        );

        if (!isMountedRef.current) return;

        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU',
          },
          runningMode: 'IMAGE',
          numPoses: 1,
        });

        if (!isMountedRef.current) {
          try { landmarker.close(); } catch (_) {}
          return;
        }

        landmarkerRef.current = landmarker;
        setPoseReady(true);
      } catch (err) {
        console.error('PoseOverlayVideo: Error loading PoseLandmarker:', err);
        setLoadError(true);
      }
    };

    initPose();

    return () => {
      isMountedRef.current = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (landmarkerRef.current) {
        try { landmarkerRef.current.close(); } catch (_) {}
        landmarkerRef.current = null;
      }
    };
  }, []);

  /**
   * Computes the exact rendered rectangle of the video frame inside the <video> element,
   * accounting for letterboxing (top/bottom black bars) or pillarboxing (left/right black bars).
   */
  const getRenderedVideoRect = (video) => {
    const videoWidth = video.videoWidth || 640;
    const videoHeight = video.videoHeight || 480;
    const containerWidth = video.clientWidth || 640;
    const containerHeight = video.clientHeight || 480;

    const videoAspect = videoWidth / videoHeight;
    const containerAspect = containerWidth / containerHeight;

    let renderWidth, renderHeight;

    if (containerAspect > videoAspect) {
      // Pillarboxed (black bars on left & right, e.g. 9:16 portrait video)
      renderHeight = containerHeight;
      renderWidth = containerHeight * videoAspect;
    } else {
      // Letterboxed (black bars on top & bottom, e.g. 16:9 landscape video)
      renderWidth = containerWidth;
      renderHeight = containerWidth / videoAspect;
    }

    const left = (containerWidth - renderWidth) / 2;
    const top = (containerHeight - renderHeight) / 2;

    return { left, top, width: renderWidth, height: renderHeight };
  };

  const processFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !isMountedRef.current || !landmarkerRef.current) return;

    const cw = video.clientWidth || 640;
    const ch = video.clientHeight || 480;

    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, cw, ch);

    if (video.readyState < 2) return; // Need at least HAVE_CURRENT_DATA

    try {
      const result = landmarkerRef.current.detect(video);

      if (result.poseLandmarks?.length > 0) {
        const lms = result.poseLandmarks[0];
        const rect = getRenderedVideoRect(video);

        // Helper to convert normalized (0..1) coords to canvas px coords
        const getX = (lm) => rect.left + lm.x * rect.width;
        const getY = (lm) => rect.top + lm.y * rect.height;

        // Draw yellow/gold skeleton bone lines
        ctx.lineWidth = Math.max(3, Math.round(rect.width / 140));
        ctx.strokeStyle = '#facc15';
        ctx.shadowColor = '#fef08a';
        ctx.shadowBlur = 8;

        POSE_CONNECTIONS.forEach(([i, j]) => {
          const p1 = lms[i];
          const p2 = lms[j];
          if (
            p1 && p2 &&
            (p1.visibility === undefined || p1.visibility > 0.2) &&
            (p2.visibility === undefined || p2.visibility > 0.2)
          ) {
            ctx.beginPath();
            ctx.moveTo(getX(p1), getY(p1));
            ctx.lineTo(getX(p2), getY(p2));
            ctx.stroke();
          }
        });

        // Draw bright red joint nodes
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 10;
        const radius = Math.max(4.5, Math.round(rect.width / 110));

        lms.forEach((lm) => {
          if (lm && (lm.visibility === undefined || lm.visibility > 0.2)) {
            const px = getX(lm);
            const py = getY(lm);

            ctx.beginPath();
            ctx.arc(px, py, radius, 0, 2 * Math.PI);
            ctx.fillStyle = '#ef4444';
            ctx.fill();
            ctx.lineWidth = 1.8;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();
          }
        });

        ctx.shadowBlur = 0;
      }
    } catch (err) {
      console.warn('PoseOverlayVideo detect error:', err);
    }
  };

  const drawLoop = () => {
    processFrame();
    const video = videoRef.current;
    if (video && !video.paused && !video.ended) {
      animFrameRef.current = requestAnimationFrame(drawLoop);
    }
  };

  const startLoop = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(drawLoop);
  };

  const stopLoop = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    processFrame();
  };

  if (loadError) {
    return (
      <video
        src={src}
        controls
        crossOrigin="anonymous"
        style={{
          width: '100%',
          maxWidth: '720px',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          backgroundColor: '#000',
          display: 'block',
          ...style,
        }}
        className={className}
      />
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-block',
        width: '100%',
        maxWidth: style.maxWidth || '720px',
        borderRadius: style.borderRadius || '8px',
        overflow: 'hidden',
        backgroundColor: '#000',
        border: style.border || '1px solid var(--border-color)',
      }}
      className={className}
    >
      <video
        ref={videoRef}
        src={src}
        controls
        crossOrigin="anonymous"
        onPlay={startLoop}
        onPause={stopLoop}
        onEnded={stopLoop}
        onLoadedData={processFrame}
        onSeeked={processFrame}
        onTimeUpdate={() => {
          if (videoRef.current && videoRef.current.paused) processFrame();
        }}
        style={{ width: '100%', display: 'block' }}
      />

      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      />

      {!poseReady && (
        <div style={{
          position: 'absolute',
          top: 8,
          right: 8,
          background: 'rgba(0,0,0,0.65)',
          color: '#eab308',
          fontSize: '0.72rem',
          padding: '3px 8px',
          borderRadius: '4px',
          pointerEvents: 'none',
          fontWeight: 600,
        }}>
          ⏳ Loading pose tracking…
        </div>
      )}

      {poseReady && (
        <div style={{
          position: 'absolute',
          top: 8,
          right: 8,
          background: 'rgba(0,0,0,0.55)',
          color: '#4ade80',
          fontSize: '0.72rem',
          padding: '3px 8px',
          borderRadius: '4px',
          pointerEvents: 'none',
          fontWeight: 600,
        }}>
          🟢 Pose tracking active
        </div>
      )}
    </div>
  );
}
