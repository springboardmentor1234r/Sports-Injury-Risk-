import React from 'react';
import { PlayCircle, Clock, AlertTriangle } from 'lucide-react';

const VideoCard = ({ video }) => {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden group cursor-pointer hover:border-indigo-500/50 transition-colors">
      <div className="relative aspect-video bg-slate-800 flex items-center justify-center overflow-hidden">
        {video.thumbnail ? (
          <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
        ) : (
          <div className="w-full h-full bg-slate-800 flex items-center justify-center">
             <span className="text-slate-600">No Thumbnail</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <PlayCircle className="w-12 h-12 text-white" />
        </div>
        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded font-mono">
          {video.duration || '0:00'}
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-white font-medium mb-1 truncate">{video.title}</h3>
        <p className="text-gray-400 text-xs mb-3 flex items-center">
          <Clock className="w-3 h-3 mr-1" /> {video.date}
        </p>
        <div className="flex justify-between items-center">
          <span className={`px-2 py-1 rounded text-xs font-semibold ${
            video.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400' :
            video.status === 'Processing' ? 'bg-amber-500/20 text-amber-400' :
            'bg-slate-500/20 text-slate-400'
          }`}>
            {video.status}
          </span>
          {video.riskScore > 70 && (
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
