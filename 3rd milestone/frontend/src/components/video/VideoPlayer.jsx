import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Maximize, SkipBack, SkipForward } from 'lucide-react';
import SkeletonOverlay from '../common/SkeletonOverlay';

export default function VideoPlayer({ src, poseData }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentPose, setCurrentPose] = useState(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const prog = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(prog);
      setCurrentTime(videoRef.current.currentTime);
      
      // Map current time to pose data frame if available
      if (poseData && poseData.length > 0) {
        const frameIndex = Math.floor(videoRef.current.currentTime * 30); // assuming 30fps
        setCurrentPose(poseData[Math.min(frameIndex, poseData.length - 1)]);
      }
    }
  };

  const toggleFullScreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div ref={containerRef} className="relative w-full bg-black rounded-xl overflow-hidden group shadow-xl">
      <video
        ref={videoRef}
        src={src || "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4"}
        className="w-full h-auto max-h-[70vh] object-contain"
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        onClick={togglePlay}
      />
      
      {currentPose && videoRef.current && (
        <SkeletonOverlay 
          videoElement={videoRef.current} 
          poseData={currentPose} 
          width={videoRef.current.clientWidth} 
          height={videoRef.current.clientHeight} 
        />
      )}

      {/* Controls Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="flex flex-col gap-2">
          {/* Progress Bar */}
          <div className="w-full h-1 bg-gray-600 rounded-full cursor-pointer overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${progress}%` }}></div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4 text-white">
              <button onClick={togglePlay} className="hover:text-primary transition-colors">
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </button>
              <div className="text-sm font-mono">
                {currentTime.toFixed(2)}s
              </div>
            </div>
            
            <button onClick={toggleFullScreen} className="text-white hover:text-primary transition-colors">
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
