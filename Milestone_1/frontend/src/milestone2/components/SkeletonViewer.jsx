import React, { useRef, useEffect } from 'react';

const SKELETON_CONNECTIONS = [
  // Head to shoulders
  { from: 'NOSE', to: 'LEFT_SHOULDER' },
  { from: 'NOSE', to: 'RIGHT_SHOULDER' },
  { from: 'LEFT_EAR', to: 'LEFT_SHOULDER' },
  { from: 'RIGHT_EAR', to: 'RIGHT_SHOULDER' },
  // Shoulders & Torso
  { from: 'LEFT_SHOULDER', to: 'RIGHT_SHOULDER' },
  { from: 'LEFT_HIP', to: 'RIGHT_HIP' },
  { from: 'LEFT_SHOULDER', to: 'LEFT_HIP' },
  { from: 'RIGHT_SHOULDER', to: 'RIGHT_HIP' },
  // Left arm
  { from: 'LEFT_SHOULDER', to: 'LEFT_ELBOW' },
  { from: 'LEFT_ELBOW', to: 'LEFT_WRIST' },
  { from: 'LEFT_WRIST', to: 'LEFT_INDEX' },
  // Right arm
  { from: 'RIGHT_SHOULDER', to: 'RIGHT_ELBOW' },
  { from: 'RIGHT_ELBOW', to: 'RIGHT_WRIST' },
  { from: 'RIGHT_WRIST', to: 'RIGHT_INDEX' },
  // Left leg
  { from: 'LEFT_HIP', to: 'LEFT_KNEE' },
  { from: 'LEFT_KNEE', to: 'LEFT_ANKLE' },
  { from: 'LEFT_ANKLE', to: 'LEFT_HEEL' },
  { from: 'LEFT_ANKLE', to: 'LEFT_FOOT_INDEX' },
  // Right leg
  { from: 'RIGHT_HIP', to: 'RIGHT_KNEE' },
  { from: 'RIGHT_KNEE', to: 'RIGHT_ANKLE' },
  { from: 'RIGHT_ANKLE', to: 'RIGHT_HEEL' },
  { from: 'RIGHT_ANKLE', to: 'RIGHT_FOOT_INDEX' }
];

export const SkeletonViewer = ({ 
  videoUrl, 
  landmarks, 
  currentFrame, 
  onFrameUpdate,
  totalFrames,
  videoFps,
  velocities = {},
  motionTrails = {},
  selectedJoint = 'LEFT_ANKLE'
}) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const propsRef = useRef({ landmarks, currentFrame, onFrameUpdate, totalFrames, videoFps, velocities, motionTrails, selectedJoint });

  useEffect(() => {
    propsRef.current = { landmarks, currentFrame, onFrameUpdate, totalFrames, videoFps, velocities, motionTrails, selectedJoint };
  }, [landmarks, currentFrame, onFrameUpdate, totalFrames, videoFps, velocities, motionTrails, selectedJoint]);

  const updateCanvasDimensions = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
    }
  };

  const isVisible = (lm) => lm && (lm.visibility === undefined || lm.visibility > 0.05);

  const drawFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      requestRef.current = requestAnimationFrame(drawFrame);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      requestRef.current = requestAnimationFrame(drawFrame);
      return;
    }

    const { 
      landmarks: currentLandmarks, 
      onFrameUpdate: handleFrameUpdate, 
      totalFrames: totalF, 
      videoFps: rawFps, 
      velocities: vels, 
      motionTrails: trails, 
      selectedJoint: selJoint 
    } = propsRef.current;
    const fps = rawFps || 25;

    // Ensure canvas dimensions are set
    if (canvas.width === 300 || canvas.width === 0) {
      if (video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      } else {
        canvas.width = 640;
        canvas.height = 480;
      }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    try {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    } catch (e) {
      // video not yet loaded
    }

    if (!video.paused && fps > 0) {
      const computedFrame = Math.floor(video.currentTime * fps);
      if (computedFrame < totalF && handleFrameUpdate) {
        handleFrameUpdate(computedFrame);
      }
    }

    if (currentLandmarks && currentLandmarks.length > 0) {
      const landmarkMap = {};
      currentLandmarks.forEach((lm) => {
        landmarkMap[lm.name] = lm;
      });

      // 1. Draw connections
      ctx.lineWidth = Math.max(3, Math.round(canvas.width / 200));
      SKELETON_CONNECTIONS.forEach((conn) => {
        const p1 = landmarkMap[conn.from];
        const p2 = landmarkMap[conn.to];
        
        if (isVisible(p1) && isVisible(p2)) {
          ctx.beginPath();
          ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
          ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
          ctx.strokeStyle = '#00a3ff'; // Neon blue
          ctx.shadowColor = '#00a3ff';
          ctx.shadowBlur = 4;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      });

      // 2. Draw motion trails (historical points for selected joint)
      const activeTrail = trails[selJoint] || [];
      if (activeTrail.length > 0) {
        ctx.beginPath();
        ctx.strokeStyle = '#00e676'; // Neon green
        ctx.lineWidth = 2;
        activeTrail.forEach((pt, idx) => {
          const tx = pt[0] * canvas.width;
          const ty = pt[1] * canvas.height;
          if (idx === 0) ctx.moveTo(tx, ty);
          else ctx.lineTo(tx, ty);
        });
        ctx.stroke();
      }

      // 3. Draw joint dots & speed text labels
      currentLandmarks.forEach((lm) => {
        if (isVisible(lm)) {
          const x = lm.x * canvas.width;
          const y = lm.y * canvas.height;
          const size = Math.max(4, Math.round(canvas.width / 120));

          // Draw dot
          ctx.beginPath();
          ctx.arc(x, y, size, 0, 2 * Math.PI);
          ctx.fillStyle = lm.name === selJoint ? '#ff1744' : '#00e676';
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = '#ffffff';
          ctx.stroke();

          // Render speed text overlays next to shoulders/wrists/ankles
          if (['LEFT_WRIST', 'RIGHT_WRIST', 'LEFT_ANKLE', 'RIGHT_ANKLE'].includes(lm.name)) {
            const vel = vels[lm.name] || 0.0;
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${Math.max(9, Math.round(canvas.width / 60))}px monospace`;
            
            // Background shadow card for text legibility
            const text = `${vel.toFixed(1)} u/s`;
            const textWidth = ctx.measureText(text).width;
            ctx.fillStyle = 'rgba(15, 16, 21, 0.85)';
            ctx.fillRect(x + size + 2, y - size - 10, textWidth + 6, size + 10);
            
            ctx.fillStyle = '#00a3ff';
            ctx.fillText(text, x + size + 5, y - size);
          }
        }
      });
    }

    requestRef.current = requestAnimationFrame(drawFrame);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(drawFrame);
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (video && video.paused && videoFps > 0) {
      const targetTime = currentFrame / videoFps;
      if (Math.abs(video.currentTime - targetTime) > 0.05) {
        video.currentTime = targetTime;
      }
    }
  }, [currentFrame, videoFps]);

  return (
    <div className="relative rounded-xl overflow-hidden border border-hud-border bg-black aspect-video flex items-center justify-center">
      {videoUrl ? (
        <>
          <video
            ref={videoRef}
            src={videoUrl}
            onLoadedMetadata={updateCanvasDimensions}
            onLoadedData={updateCanvasDimensions}
            onCanPlay={updateCanvasDimensions}
            className="absolute opacity-0 pointer-events-none w-full h-full"
            loop
            playsInline
            muted
            crossOrigin="anonymous"
          />
          <canvas
            ref={canvasRef}
            onClick={() => {
              const video = videoRef.current;
              if (video) {
                if (video.paused) video.play();
                else video.pause();
              }
            }}
            className="w-full h-full object-contain cursor-pointer"
          />
        </>
      ) : (
        <span className="text-[10px] text-gray-500 uppercase font-hud-mono animate-pulse">
          Ingest video to initialize tracking canvas...
        </span>
      )}
    </div>
  );
};

export default SkeletonViewer;
