import React from 'react';

export const PoseTimeline = ({ frames, currentFrame, onChange }) => {
  const getConfidenceColor = (conf) => {
    if (conf >= 0.8) return 'bg-hud-green';
    if (conf >= 0.5) return 'bg-hud-warning';
    return 'bg-hud-danger';
  };

  return (
    <div className="hud-glass-panel p-5 rounded-xl border border-hud-border space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Ingestion Session Timeline
        </h3>
        <span className="text-[9px] font-hud-mono text-gray-500 uppercase">
          Color scale indicates joint visibility
        </span>
      </div>

      <div className="flex items-end gap-[1px] h-10 w-full overflow-x-auto bg-hud-dark/30 border border-hud-border rounded-lg p-2.5 scrollbar-thin select-none">
        {frames && frames.length > 0 ? (
          frames.map((frame, idx) => {
            const isSelected = currentFrame === idx;
            const heightClass = isSelected ? 'h-full scale-y-110' : 'h-3/4 hover:h-5/6';
            
            return (
              <div
                key={idx}
                onClick={() => onChange(idx)}
                className={`flex-1 min-w-[3px] rounded-t cursor-pointer transition-all ${getConfidenceColor(frame.average_confidence)} ${heightClass} ${
                  isSelected ? 'shadow-md shadow-hud-blue-glow ring-[1px] ring-hud-blue' : 'opacity-60 hover:opacity-100'
                }`}
                title={`Frame ${frame.frame_number + 1} (Conf: ${Math.round(frame.average_confidence * 100)}%)`}
              ></div>
            );
          })
        ) : (
          <div className="w-full text-center text-gray-600 text-[9px] uppercase font-hud-mono py-1">
            Timeline loading or empty...
          </div>
        )}
      </div>
    </div>
  );
};

export default PoseTimeline;
