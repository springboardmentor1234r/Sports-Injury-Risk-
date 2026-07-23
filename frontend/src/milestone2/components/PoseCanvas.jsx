import React, { useRef, useEffect } from 'react';

// Connection indices matching MediaPipe Pose landmark numbers
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

export const PoseCanvas = ({ 
  videoUrl, 
  landmarks, 
  currentFrame, 
  onFrameUpdate,
  totalFrames,
  videoFps
}) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const propsRef = useRef({ landmarks, currentFrame, onFrameUpdate, totalFrames, videoFps });

  useEffect(() => {
    propsRef.current = { landmarks, currentFrame, onFrameUpdate, totalFrames, videoFps };
  }, [landmarks, currentFrame, onFrameUpdate, totalFrames, videoFps]);

  // Sync canvas size with video dims
  const updateCanvasDimensions = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas && video.videoWidth && video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }
  };

  // Helper check for landmark visibility
  const isVisible = (lm) => lm && (lm.visibility === undefined || lm.visibility > 0.05);

  // Draw frame skeleton
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

    const { landmarks: currentLandmarks, onFrameUpdate: handleFrameUpdate, totalFrames: totalF, videoFps: rawFps } = propsRef.current;
    const fps = rawFps || 25;

    // Make sure dimensions are set
    if (canvas.width === 300 || canvas.width === 0) {
      if (video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      } else {
        canvas.width = 640;
        canvas.height = 480;
      }
    }

    // 1. Draw video background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    try {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    } catch (e) {
      // Ignore initial draw frame error before video load
    }

    // Update current frame index based on playback time
    if (!video.paused && fps > 0) {
      const computedFrame = Math.floor(video.currentTime * fps);
      if (computedFrame < totalF && handleFrameUpdate) {
        handleFrameUpdate(computedFrame);
      }
    }

    // 2. Render skeletal lines
    if (currentLandmarks && currentLandmarks.length > 0) {
      const landmarkMap = {};
      currentLandmarks.forEach((lm) => {
        landmarkMap[lm.name] = lm;
      });

      // Draw connection lines
      ctx.lineWidth = Math.max(4, Math.round(canvas.width / 160));
      SKELETON_CONNECTIONS.forEach((conn) => {
        const p1 = landmarkMap[conn.from];
        const p2 = landmarkMap[conn.to];
        
        if (isVisible(p1) && isVisible(p2)) {
          ctx.beginPath();
          ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
          ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
          ctx.strokeStyle = '#00f0ff'; // Bright HUD Cyan
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 6;
          ctx.stroke();
          ctx.shadowBlur = 0; // reset shadow
        }
      });

      // Draw joint dots
      currentLandmarks.forEach((lm) => {
        if (isVisible(lm)) {
          const x = lm.x * canvas.width;
          const y = lm.y * canvas.height;
          const size = Math.max(5, Math.round(canvas.width / 100));

          ctx.beginPath();
          ctx.arc(x, y, size, 0, 2 * Math.PI);
          
          // Color based on visibility confidence
          const vis = lm.visibility ?? 1.0;
          if (vis >= 0.7) {
            ctx.fillStyle = '#00e676'; // Bright green
          } else if (vis >= 0.4) {
            ctx.fillStyle = '#ffb300'; // Warning orange
          } else {
            ctx.fillStyle = '#ff1744'; // Danger red
          }
          
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#ffffff';
          ctx.stroke();
        }
      });
    }

    // Loop animation frames
    requestRef.current = requestAnimationFrame(drawFrame);
  };

  useEffect(() => {
    // Start drawing loop
    requestRef.current = requestAnimationFrame(drawFrame);
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  // Handle manual seeks or controls changes
  useEffect(() => {
    const video = videoRef.current;
    const fps = videoFps || 25;
    if (video && video.paused && fps > 0) {
      const targetTime = currentFrame / fps;
      if (Math.abs(video.currentTime - targetTime) > 0.04) {
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
          Ingest video to initialize skeletal canvas...
        </span>
      )}
    </div>
  );
};

export default PoseCanvas;
