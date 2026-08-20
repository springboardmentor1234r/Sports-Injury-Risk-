import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Film, Play, Trash2, Calendar, HardDrive, Clock, Monitor, RefreshCw } from 'lucide-react';

const BACKEND_URL = 'http://127.0.0.1:8000';

export const VideoCard = ({ video, onSelect, onDelete, isDeleting, showDeleteButton = true }) => {
  const navigate = useNavigate();

  const getFormatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFormatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  const getStatusStyle = () => {
    const status = video.status || 'uploaded';
    if (status === 'completed') return 'text-hud-green';
    if (status === 'failed') return 'text-hud-danger';
    return 'text-hud-warning';
  };

  return (
    <div className="hud-glass-panel hover:border-hud-blue/40 transition-all p-4 rounded-xl flex flex-col justify-between border border-hud-border relative group">
      
      {/* Video metadata header */}
      <div className="space-y-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <span className="px-2 py-0.5 rounded-full bg-hud-blue/10 border border-hud-blue/30 text-hud-blue font-bold text-[9px] uppercase tracking-wider">
              {video.activity}
            </span>
            <h4 className="text-xs font-bold text-white uppercase tracking-wide truncate max-w-[180px] mt-1" title={video.original_filename}>
              {video.original_filename}
            </h4>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onSelect(video)}
              className="p-1.5 rounded-lg border border-hud-blue/20 hover:border-hud-blue hover:bg-hud-blue/10 text-hud-blue cursor-pointer transition-colors"
              title="Preview Video"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
            </button>
            {showDeleteButton && (
              <button
                onClick={() => onDelete(video._id)}
                disabled={isDeleting}
                className="p-1.5 rounded-lg border border-hud-danger/20 hover:border-hud-danger hover:bg-hud-danger/10 text-hud-danger cursor-pointer transition-colors disabled:opacity-50"
                title="Delete Video"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Video properties grid */}
        <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-400 font-hud-mono">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-gray-500" />
            <span>{video.duration}s</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Monitor className="w-3 h-3 text-gray-500" />
            <span>{video.resolution}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <HardDrive className="w-3 h-3 text-gray-500" />
            <span>{getFormatSize(video.file_size)}</span>
          </div>
          <div className={`flex items-center gap-1.5 font-bold ${getStatusStyle()}`}>
            {video.status === 'processing' ? (
              <RefreshCw className="w-3 h-3 animate-spin text-hud-warning" />
            ) : (
              <span className={`w-1.5 h-1.5 rounded-full bg-current ${video.status === 'processing' ? 'animate-pulse' : ''}`}></span>
            )}
            <span className="uppercase text-[9px]">
              {video.status === 'processing' ? 'analyzing...' : video.status}
            </span>
          </div>
        </div>
      </div>

      {video.status === 'completed' && (
        <div className="mt-3 pt-2.5 border-t border-hud-border/30 flex justify-between gap-1">
          <button
            onClick={() => navigate(`/milestone2/pose?video_id=${video._id}`)}
            className="flex-1 py-1 rounded bg-hud-blue/15 hover:bg-hud-blue/25 text-hud-blue border border-hud-blue/20 text-[8px] font-hud-mono font-bold text-center cursor-pointer transition-all uppercase"
          >
            Pose
          </button>
          <button
            onClick={() => navigate(`/milestone2/skeleton?video_id=${video._id}`)}
            className="flex-1 py-1 rounded bg-hud-blue/15 hover:bg-hud-blue/25 text-hud-blue border border-hud-blue/20 text-[8px] font-hud-mono font-bold text-center cursor-pointer transition-all uppercase"
          >
            Skeleton
          </button>
          <button
            onClick={() => navigate(`/milestone2/biomechanics?video_id=${video._id}`)}
            className="flex-1 py-1 rounded bg-hud-blue/15 hover:bg-hud-blue/25 text-hud-blue border border-hud-blue/20 text-[8px] font-hud-mono font-bold text-center cursor-pointer transition-all uppercase"
          >
            Biomech
          </button>
        </div>
      )}

      <div className="flex justify-between items-center border-t border-hud-border mt-4 pt-2.5 text-[9px] text-gray-500 font-hud-mono">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>{getFormatDate(video.upload_date)}</span>
        </div>
        <span className="text-[8px] text-gray-600 truncate max-w-[80px]" title={video.uploaded_by}>
          BY: {video.uploaded_by?.split('@')[0]}
        </span>
      </div>

    </div>
  );
};

export default VideoCard;
