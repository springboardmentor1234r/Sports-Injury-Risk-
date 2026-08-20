import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Eye, EyeOff, Target, Activity } from 'lucide-react';

const POSE_CONNECTIONS = [
  // Torso box
  [11, 12], [12, 24], [24, 23], [23, 11],
  // Left Arm
  [11, 13], [13, 15],
  // Right Arm
  [12, 14], [14, 16],
  // Left Leg
  [23, 25], [25, 27], [27, 29], [29, 31],
  // Right Leg
  [24, 26], [26, 28], [28, 30], [30, 32],
  // Face
  [0, 1], [1, 2], [0, 4], [4, 5]
];

export default function VideoPoseViewer({ videoUrl, poseFrames = [], fps = 30, movementType = 'Movement', onFrameSeek, peakRiskFrame }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [showOverlay, setShowOverlay] = useState(true);
  const [duration, setDuration] = useState(0);

  const totalFrames = poseFrames.length || Math.max(1, Math.floor(duration * fps));

  // Sync canvas size with video videoWidth / videoHeight
  const syncCanvasSize = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      canvas.width = video.clientWidth || 640;
      canvas.height = video.clientHeight || 360;
    }
  };

  useEffect(() => {
    window.addEventListener('resize', syncCanvasSize);
    return () => window.removeEventListener('resize', syncCanvasSize);
  }, []);

  // Handle video playback events
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    const curTime = video.currentTime;
    const fIdx = Math.min(totalFrames - 1, Math.max(0, Math.floor(curTime * fps)));
    setCurrentFrame(fIdx);
    if (onFrameSeek) onFrameSeek(fIdx);
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video) {
      setDuration(video.duration || 0);
      syncCanvasSize();
    }
  };

  // Draw 33 Keypoint Skeleton overlay on Canvas
  const drawSkeleton = (frameIndex) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!showOverlay || !poseFrames || poseFrames.length === 0) return;

    const frameData = poseFrames[frameIndex] || poseFrames[0];
    if (!frameData || !frameData.landmarks) return;

    const landmarks = frameData.landmarks;
    const w = canvas.width;
    const h = canvas.height;

    // Get current valgus angles for dynamic joint coloring
    const leftKneeValgus = frameData.landmarks[25]?.valgus || 0;
    const rightKneeValgus = frameData.landmarks[26]?.valgus || 0;

    ctx.save();
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 1. Draw Skeleton Limb Connections
    POSE_CONNECTIONS.forEach(([startIdx, endIdx]) => {
      const p1 = landmarks[startIdx];
      const p2 = landmarks[endIdx];

      if (p1 && p2 && (p1.visibility > 0.3 || p1.visibility === undefined) && (p2.visibility > 0.3 || p2.visibility === undefined)) {
        const x1 = p1.x * w;
        const y1 = p1.y * h;
        const x2 = p2.x * w;
        const y2 = p2.y * h;

        // Color lower body limbs according to knee valgus risk
        const isLegLimb = (startIdx >= 23 && endIdx >= 23);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);

        if (isLegLimb) {
          ctx.strokeStyle = '#10B981'; // Emerald green
          ctx.shadowColor = '#059669';
          ctx.shadowBlur = 6;
        } else {
          ctx.strokeStyle = '#3B82F6'; // Vibrant blue
          ctx.shadowColor = '#2563EB';
          ctx.shadowBlur = 4;
        }
        ctx.stroke();
      }
    });

    // 2. Draw Landmark Keypoint Nodes
    landmarks.forEach((lm) => {
      if (lm.visibility < 0.3 && lm.visibility !== undefined) return;
      const x = lm.x * w;
      const y = lm.y * h;

      const isKnee = (lm.id === 25 || lm.id === 26);
      const isHip = (lm.id === 23 || lm.id === 24);
      const isAnkle = (lm.id === 27 || lm.id === 28);

      ctx.beginPath();

      if (isKnee) {
        // High-risk Knee node highlight
        ctx.arc(x, y, 7, 0, 2 * Math.PI);
        ctx.fillStyle = '#EF4444'; // Bright Red
        ctx.shadowColor = '#DC2626';
        ctx.shadowBlur = 12;
      } else if (isHip || isAnkle) {
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#F59E0B'; // Amber
        ctx.shadowColor = '#D97706';
        ctx.shadowBlur = 8;
      } else {
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#60A5FA';
        ctx.shadowBlur = 0;
      }

      ctx.fill();

      // Outer ring for knees
      if (isKnee) {
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    ctx.restore();
  };

  useEffect(() => {
    syncCanvasSize();
    drawSkeleton(currentFrame);
  }, [currentFrame, poseFrames, showOverlay]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const seekToFrame = (frameIdx) => {
    const video = videoRef.current;
    if (!video) return;
    const targetTime = frameIdx / fps;
    video.currentTime = targetTime;
    setCurrentFrame(frameIdx);
    drawSkeleton(frameIdx);
  };

  const stepFrame = (delta) => {
    const newFrame = Math.min(totalFrames - 1, Math.max(0, currentFrame + delta));
    seekToFrame(newFrame);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
      {/* Viewer Header */}
      <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Activity className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-white">MediaPipe Skeleton Overlay</h3>
            <p className="text-xs text-slate-400">Activity: <span className="text-indigo-400 font-medium">{movementType}</span></p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {peakRiskFrame !== undefined && (
            <button
              onClick={() => seekToFrame(peakRiskFrame)}
              className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold rounded-lg transition-all flex items-center space-x-1.5"
            >
              <Target className="w-3.5 h-3.5" />
              <span>Jump to Peak Risk (Frame #{peakRiskFrame})</span>
            </button>
          )}

          <button
            onClick={() => setShowOverlay(!showOverlay)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all flex items-center space-x-1.5 ${
              showOverlay
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            {showOverlay ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{showOverlay ? 'Overlay On' : 'Overlay Off'}</span>
          </button>
        </div>
      </div>

      {/* Video Canvas Container */}
      <div className="relative bg-black aspect-video flex items-center justify-center overflow-hidden">
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
            className="w-full h-full object-contain"
            playsInline
          />
        ) : (
          <div className="text-slate-500 text-sm flex flex-col items-center space-y-2">
            <Activity className="w-10 h-10 animate-pulse text-indigo-400" />
            <span>Select or upload a video clip to render pose skeleton</span>
          </div>
        )}

        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
        />
      </div>

      {/* Playback Controls & Frame Scrubber */}
      <div className="bg-slate-950 p-4 border-t border-slate-800 space-y-3">
        {/* Progress Scrubber */}
        <div className="flex items-center space-x-3">
          <span className="text-xs font-mono text-slate-400 w-12 text-right">
            #{currentFrame}
          </span>

          <input
            type="range"
            min="0"
            max={totalFrames - 1}
            value={currentFrame}
            onChange={(e) => seekToFrame(parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />

          <span className="text-xs font-mono text-slate-400 w-12">
            #{totalFrames - 1}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => stepFrame(-1)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all"
              title="Step Frame Back"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-lg shadow-indigo-600/30 transition-all"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>

            <button
              onClick={() => stepFrame(1)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all"
              title="Step Frame Forward"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          <div className="text-xs text-slate-400 flex items-center space-x-4">
            <div>
              FPS: <span className="text-white font-mono">{fps}</span>
            </div>
            <div>
              Time: <span className="text-white font-mono">{(currentFrame / fps).toFixed(2)}s</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
