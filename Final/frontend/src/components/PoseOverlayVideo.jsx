import React, { useRef, useEffect, useState } from 'react';

/**
 * PoseOverlayVideo
 * Plays a video and renders a real-time MediaPipe Pose skeleton overlay
 * (yellow bone connections + red joint nodes) on a transparent canvas on top of it.
 */
export default function PoseOverlayVideo({ src, style = {}, className = '' }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const landmarkerRef = useRef(null);
  const isMountedRef = useRef(true);
  const lastTimeRef = useRef(0);

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
        const visionModule = await import(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.11/vision_bundle.mjs'
        );
        const { FilesetResolver, PoseLandmarker } = visionModule;

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
          runningMode: 'VIDEO',
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

  const drawLoop = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !isMountedRef.current) return;

    const ctx = canvas.getContext('2d');
    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;

    if (canvas.width !== vw || canvas.height !== vh) {
      canvas.width = vw;
      canvas.height = vh;
    }

    ctx.clearRect(0, 0, vw, vh);

    const now = Date.now();
    if (
      landmarkerRef.current &&
      !video.paused &&
      !video.ended &&
      now - lastTimeRef.current > 40
    ) {
      lastTimeRef.current = now;
      try {
        const timestampMs = Math.round(video.currentTime * 1000);
        const result = landmarkerRef.current.detectForVideo(video, timestampMs);

        if (result.poseLandmarks?.length > 0) {
          const lms = result.poseLandmarks[0];

          // Draw yellow/gold skeleton lines
          ctx.lineWidth = Math.max(3, Math.round(vw / 180));
          ctx.strokeStyle = '#facc15';
          ctx.shadowColor = '#fef08a';
          ctx.shadowBlur = 6;

          POSE_CONNECTIONS.forEach(([i, j]) => {
            const p1 = lms[i];
            const p2 = lms[j];
            if (
              p1 && p2 &&
              (p1.visibility === undefined || p1.visibility > 0.3) &&
              (p2.visibility === undefined || p2.visibility > 0.3)
            ) {
              ctx.beginPath();
              ctx.moveTo(p1.x * vw, p1.y * vh);
              ctx.lineTo(p2.x * vw, p2.y * vh);
              ctx.stroke();
            }
          });

          // Draw bright red joint dots
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 8;
          const radius = Math.max(4, Math.round(vw / 140));

          lms.forEach((lm) => {
            if (lm && (lm.visibility === undefined || lm.visibility > 0.3)) {
              ctx.beginPath();
              ctx.arc(lm.x * vw, lm.y * vh, radius, 0, 2 * Math.PI);
              ctx.fillStyle = '#ef4444';
              ctx.fill();
              ctx.lineWidth = 1.5;
              ctx.strokeStyle = '#ffffff';
              ctx.stroke();
            }
          });

          ctx.shadowBlur = 0;
        }
      } catch (_) {
        /* ignore frame detection error */
      }
    }

    if (!video.paused && !video.ended) {
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
        onSeeked={drawLoop}
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
          🟢 Pose tracking overlay active
        </div>
      )}
    </div>
  );
}
