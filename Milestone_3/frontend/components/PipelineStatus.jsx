import React from 'react';
import { Activity, CheckCircle, AlertOctagon, HelpCircle } from 'lucide-react';

const PipelineStatus = ({ pipelineState }) => {
  if (!pipelineState) return null;

  const { status, stage, progress, message, error } = pipelineState;

  const getStatusColor = () => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
        return 'text-hud-green border-hud-green/30 bg-hud-green/10';
      case 'FAILED':
        return 'text-hud-danger border-hud-danger/30 bg-hud-danger/10';
      case 'PROCESSING':
        return 'text-hud-blue border-hud-blue/30 bg-hud-blue/10';
      case 'PENDING':
      default:
        return 'text-hud-warning border-hud-warning/30 bg-hud-warning/10';
    }
  };

  const getProgressColor = () => {
    if (status?.toUpperCase() === 'FAILED') return 'bg-hud-danger';
    if (status?.toUpperCase() === 'COMPLETED') return 'bg-hud-green';
    return 'bg-hud-blue';
  };

  return (
    <div className={`hud-glass-panel p-5 border rounded-xl space-y-4 ${getStatusColor()}`}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {status?.toUpperCase() === 'COMPLETED' ? (
            <CheckCircle className="w-5 h-5 text-hud-green" />
          ) : status?.toUpperCase() === 'FAILED' ? (
            <AlertOctagon className="w-5 h-5 text-hud-danger" />
          ) : (
            <Activity className="w-5 h-5 text-hud-blue animate-spin" />
          )}
          <div>
            <span className="text-[10px] font-bold tracking-widest uppercase block text-gray-400">
              Pipeline Status
            </span>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              State: {status || 'PENDING'}
            </h4>
          </div>
        </div>
        <span className="text-xl font-hud-mono font-black text-white">
          {progress || 0}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="w-full bg-hud-dark h-2.5 rounded-full overflow-hidden border border-hud-border">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${getProgressColor()}`}
            style={{ width: `${progress || 0}%` }}
          />
        </div>
        <div className="flex justify-between text-[9px] text-gray-500 font-hud-mono">
          <span>Stage: {stage || 'idle'}</span>
          <span>Automatic Ingestion</span>
        </div>
      </div>

      <div className="text-xs text-gray-300 leading-relaxed bg-hud-black/35 p-3 rounded border border-hud-border/40">
        <span className="font-bold text-white uppercase tracking-wider block text-[8px] mb-1">
          Current Activity Log:
        </span>
        {message}
      </div>

      {error && (
        <div className="text-xs text-hud-danger leading-relaxed bg-hud-danger/10 p-3 rounded border border-hud-danger/25">
          <span className="font-bold text-hud-danger uppercase tracking-wider block text-[8px] mb-1">
            Exception Caught:
          </span>
          {error}
        </div>
      )}
    </div>
  );
};

export default PipelineStatus;
