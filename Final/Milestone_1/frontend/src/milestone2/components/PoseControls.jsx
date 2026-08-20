import React from 'react';
import { Play, RotateCcw, Cpu, ShieldAlert, Check } from 'lucide-react';
import Button from '../../components/Button';

export const PoseControls = ({ 
  onStart, 
  onReset, 
  processing, 
  status, 
  progress, 
  error,
  userRole 
}) => {
  const isOperator = userRole && ['Coach', 'Admin', 'Physiotherapist', 'Sports Scientist'].includes(userRole);

  return (
    <div className="hud-glass-panel p-5 rounded-xl border border-hud-border space-y-4">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Pose Engine Controls
      </h3>

      {/* Settings Summary */}
      <div className="p-3 bg-hud-dark/40 border border-hud-border rounded-lg text-[10px] font-hud-mono text-gray-400 space-y-2">
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-hud-blue" /> ENGINE complexity:</span>
          <span className="text-white font-bold">1 (Medium Complexity)</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Min Detection Conf:</span>
          <span className="text-white font-bold">0.50</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Min Tracking Conf:</span>
          <span className="text-white font-bold">0.50</span>
        </div>
      </div>

      {/* Ingestion triggers */}
      <div className="space-y-3">
        {status === 'completed' ? (
          <div className="p-3 rounded-lg bg-hud-green/10 border border-hud-green/30 text-hud-green text-[10px] font-bold font-hud-mono flex items-center gap-2">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>POSE ESTIMATION INGESTED SUCCESSFULLY</span>
          </div>
        ) : error ? (
          <div className="p-3 rounded-lg bg-hud-danger/10 border border-hud-danger/30 text-hud-danger text-[10px] font-hud-mono flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>Extraction Failed: {error}</span>
          </div>
        ) : status === 'processing' ? (
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-hud-mono text-hud-blue font-bold">
              <span>PROCESSING FRAMES...</span>
              <span>{progress}%</span>
            </div>
            <div className="relative w-full h-1.5 bg-hud-dark rounded-full overflow-hidden">
              <div 
                className="absolute left-0 top-0 h-full bg-hud-blue rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <p className="text-[10px] text-gray-500 font-hud-mono leading-relaxed">
            Clicking the extractor will trigger the MediaPipe framework in the background to log coordinates.
          </p>
        )}

        <div className="flex gap-2 pt-2">
          {status !== 'completed' && status !== 'processing' && isOperator && (
            <Button
              onClick={onStart}
              loading={processing}
              className="flex-1 text-xs"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Analyze Coordinates</span>
            </Button>
          )}

          {status === 'completed' && isOperator && (
            <Button
              onClick={onStart}
              variant="outline"
              className="flex-1 text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reprocess Video</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PoseControls;
