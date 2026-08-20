import React from 'react';
import { Film, Clock, Monitor, RefreshCw } from 'lucide-react';

export const VideoPreview = ({ file, url, meta }) => {
  const getFormatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="hud-glass-panel p-5 rounded-xl border border-hud-border space-y-4">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Video Preview
      </h3>

      <div className="relative aspect-video rounded-lg overflow-hidden border border-hud-border bg-black flex items-center justify-center">
        {url ? (
          <video
            src={url}
            controls
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-600">
            <Film className="w-8 h-8" />
            <span className="text-[10px] uppercase font-hud-mono">Awaiting video source...</span>
          </div>
        )}
      </div>

      {(file || meta) && (
        <div className="grid grid-cols-2 gap-3 font-hud-mono text-[10px] text-gray-400">
          <div className="flex items-center gap-2 p-2 bg-hud-dark/50 rounded-lg border border-hud-border">
            <Film className="w-3.5 h-3.5 text-hud-blue" />
            <div>
              <span className="text-[9px] text-gray-500 block uppercase">File Size</span>
              <span className="text-white font-semibold">{file ? getFormatSize(file.size) : getFormatSize(meta.file_size)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 bg-hud-dark/50 rounded-lg border border-hud-border">
            <Clock className="w-3.5 h-3.5 text-hud-blue" />
            <div>
              <span className="text-[9px] text-gray-500 block uppercase">Duration</span>
              <span className="text-white font-semibold">{meta?.duration ? `${meta.duration}s` : 'Unknown'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 bg-hud-dark/50 rounded-lg border border-hud-border">
            <Monitor className="w-3.5 h-3.5 text-hud-blue" />
            <div>
              <span className="text-[9px] text-gray-500 block uppercase">Resolution</span>
              <span className="text-white font-semibold">{meta?.resolution || 'Unknown'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 bg-hud-dark/50 rounded-lg border border-hud-border">
            <RefreshCw className="w-3.5 h-3.5 text-hud-blue" />
            <div>
              <span className="text-[9px] text-gray-500 block uppercase">Frame Rate</span>
              <span className="text-white font-semibold">{meta?.fps ? `${meta.fps} FPS` : 'Unknown'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPreview;
