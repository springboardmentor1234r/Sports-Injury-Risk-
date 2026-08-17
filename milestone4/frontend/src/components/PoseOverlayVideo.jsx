import React, { useRef, useEffect, useState } from 'react';

/**
 * PoseOverlayVideo
 * Plays a video and renders a real-time MediaPipe Pose skeleton overlay
 * (yellow bone connections + red joint nodes) on a canvas on top of it.
 */
export default function PoseOverlayVideo({ src, style = {}, className = '' }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const poseRef = useRef(null);
  const latestLandmarksRef = useRef(null);
  const lastPoseSendTimeRef = useRef(0);
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

  // Load MediaPipe Pose from CDN once
  useEffect(() => {
    isMountedRef.current = true;

    const initPose = async () => {
      try {
        if (!window.Pose) {
          await new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js';
            s.crossOrigin = 'anonymous';
            s.onload = resolve;
            s.onerror = reject;
            document.body.appendChild(s);
          });
        }

        if (!isMountedRef.current) return;

        // Close any existing pose instance to avoid WASM conflicts
        if (poseRef.current) {
          try { poseRef.current.close(); } catch (_) {}
          poseRef.current = null;
        }

        const pose = new window.Pose({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
        });

        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          minDetectionConfidence: 0.45,
          minTrackingConfidence: 0.45
        });

        pose.onResults((results) => {
          if (isMountedRef.current) {
            latestLandmarksRef.current = results.poseLandmarks || null;
          }
        });

        poseRef.current = pose;
        if (isMountedRef.current) setPoseReady(true);
      } catch (err) {
        console.error('PoseOverlayVideo: MediaPipe load error:', err);
        setLoadError(true);
      }
    };

    initPose();

    return () => {
      isMountedRef.current = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (poseRef.current) {
        try { poseRef.current.close(); } catch (_) {}
        poseRef.current = null;
      }
    };
  }, []);

  // Draw loop: runs when video plays, syncing canvas to video frames
  const drawLoop = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !isMountedRef.current) return;

    const ctx = canvas.getContext('2d');

    // Keep canvas size in sync with video
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
    }

    const w = canvas.width;
    const h = canvas.height;

    // Clear canvas (transparent - video element shows underneath)
    ctx.clearRect(0, 0, w, h);

    // Send frame to MediaPipe at ~20 FPS (every 50ms) to avoid overload
    const now = Date.now();
    if (poseRef.current && !video.paused && !video.ended && now - lastPoseSendTimeRef.current > 50) {
      lastPoseSendTimeRef.current = now;
      try {
        await poseRef.current.send({ image: video });
      } catch (_) { /* ignore transient errors */ }
    }

    const landmarks = latestLandmarksRef.current;

    if (landmarks && landmarks.length > 0) {
      // --- Draw Bone Connections (Yellow glowing lines) ---
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = '#eab308';
      ctx.shadowColor = '#fef08a';
      ctx.shadowBlur = 8;

      POSE_CONNECTIONS.forEach(([i, j]) => {
        const p1 = landmarks[i];
        const p2 = landmarks[j];
        if (
          p1 && p2 &&
          (p1.visibility === undefined || p1.visibility > 0.4) &&
          (p2.visibility === undefined || p2.visibility > 0.4)
        ) {
          ctx.beginPath();
          ctx.moveTo(p1.x * w, p1.y * h);
          ctx.lineTo(p2.x * w, p2.y * h);
          ctx.stroke();
        }
      });

      // --- Draw Joint Nodes (Red glowing circles) ---
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 10;
      landmarks.forEach((lm) => {
        if (lm && (lm.visibility === undefined || lm.visibility > 0.4)) {
          ctx.beginPath();
          ctx.arc(lm.x * w, lm.y * h, 5.5, 0, 2 * Math.PI);
          ctx.fillStyle = '#ef4444';
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#ffffff';
          ctx.stroke();
        }
      });

      ctx.shadowBlur = 0;
    }

    animFrameRef.current = requestAnimationFrame(drawLoop);
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
    // Clear the canvas when paused/ended
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    latestLandmarksRef.current = null;
  };

  // If MediaPipe can't load, just render a normal <video>
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
          ...style
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
      {/* Underlying video element — canvas is transparent and drawn on top */}
      <video
        ref={videoRef}
        src={src}
        controls
        crossOrigin="anonymous"
        onPlay={startLoop}
        onPause={stopLoop}
        onEnded={stopLoop}
        onSeeked={() => {
          // Re-draw a fresh frame after seek
          if (videoRef.current && !videoRef.current.paused) startLoop();
        }}
        style={{ width: '100%', display: 'block' }}
      />

      {/* Canvas overlay — pointer-events none so video controls still work */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: 'calc(100% - 40px)', /* leave space for native video controls bar */
          pointerEvents: 'none',
        }}
      />

      {/* Status badge */}
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
          ⏳ Loading pose model…
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
