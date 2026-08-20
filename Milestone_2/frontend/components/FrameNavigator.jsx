import React from 'react';
import { ChevronLeft, ChevronRight, SkipBack, SkipForward } from 'lucide-react';

export const FrameNavigator = ({ currentFrame, totalFrames, onChange }) => {
  return (
    <div className="flex items-center justify-between p-3 bg-hud-dark/50 border border-hud-border rounded-xl font-hud-mono text-xs">
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(0)}
          disabled={currentFrame <= 0}
          className="p-1 rounded hover:bg-hud-dark text-gray-400 hover:text-white disabled:opacity-30 cursor-pointer"
          title="First Frame"
        >
          <SkipBack className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onChange(currentFrame - 1)}
          disabled={currentFrame <= 0}
          className="p-1 rounded hover:bg-hud-dark text-gray-400 hover:text-white disabled:opacity-30 cursor-pointer"
          title="Previous Frame"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      <div className="text-[10px] text-gray-400 font-bold">
        FRAME <span className="text-hud-blue text-xs">{currentFrame + 1}</span> / <span className="text-white">{totalFrames}</span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(currentFrame + 1)}
          disabled={currentFrame >= totalFrames - 1}
          className="p-1 rounded hover:bg-hud-dark text-gray-400 hover:text-white disabled:opacity-30 cursor-pointer"
          title="Next Frame"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => onChange(totalFrames - 1)}
          disabled={currentFrame >= totalFrames - 1}
          className="p-1 rounded hover:bg-hud-dark text-gray-400 hover:text-white disabled:opacity-30 cursor-pointer"
          title="Last Frame"
        >
          <SkipForward className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default FrameNavigator;
