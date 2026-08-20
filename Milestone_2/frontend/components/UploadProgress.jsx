import React from 'react';
import { Loader2, CheckCircle2, AlertOctagon } from 'lucide-react';

export const UploadProgress = ({ progress, status, filename, filesize, error }) => {
  const getProgressWidth = () => {
    return `${progress}%`;
  };

  const getFormatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="hud-glass-panel p-4 rounded-xl space-y-3.5 border border-hud-border">
      <div className="flex justify-between items-start">
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-white truncate max-w-[200px]" title={filename}>
            {filename || 'uploading_video.mp4'}
          </p>
          <p className="text-[10px] text-gray-500">{getFormatSize(filesize)}</p>
        </div>
        
        <div className="flex items-center gap-1.5 font-hud-mono text-[10px] font-bold">
          {status === 'uploading' && (
            <div className="flex items-center gap-1 text-hud-blue">
              <Loader2 className="animate-spin w-3.5 h-3.5" />
              <span>UPLOADING {progress}%</span>
            </div>
          )}
          {status === 'success' && (
            <div className="flex items-center gap-1 text-hud-green">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>SYNCED</span>
            </div>
          )}
          {status === 'error' && (
            <div className="flex items-center gap-1 text-hud-danger">
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>FAILED</span>
            </div>
          )}
        </div>
      </div>

      <div className="relative w-full h-1.5 bg-hud-dark rounded-full overflow-hidden">
        <div
          className={`absolute left-0 top-0 h-full rounded-full transition-all duration-300 ${
            status === 'error' 
              ? 'bg-hud-danger' 
              : status === 'success' 
                ? 'bg-hud-green' 
                : 'bg-hud-blue'
          }`}
          style={{ width: getProgressWidth() }}
        ></div>
      </div>

      {status === 'error' && error && (
        <p className="text-[10px] text-hud-danger font-hud-mono">
          ▲ Error: {error}
        </p>
      )}
    </div>
  );
};

export default UploadProgress;
