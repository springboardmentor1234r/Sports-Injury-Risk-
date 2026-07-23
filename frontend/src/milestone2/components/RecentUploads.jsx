import React from 'react';
import VideoCard from './VideoCard';
import { Video, AlertOctagon } from 'lucide-react';

export const RecentUploads = ({ videos, loading, onSelect, onDelete, deletingId, userRole }) => {
  const showDelete = userRole && ['Coach', 'Admin'].includes(userRole);

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Recently Uploaded Videos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="animate-pulse hud-glass-panel p-4 rounded-xl border border-hud-border space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <div className="h-3.5 bg-hud-blue/10 rounded w-1/3"></div>
                  <div className="h-4 bg-hud-blue/10 rounded w-2/3"></div>
                </div>
                <div className="w-8 h-8 bg-hud-blue/10 rounded-lg"></div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-hud-blue/10 rounded w-full"></div>
                <div className="h-3 bg-hud-blue/10 rounded w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Recently Uploaded Videos
      </h3>

      {videos && videos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((vid) => (
            <VideoCard
              key={vid._id}
              video={vid}
              onSelect={onSelect}
              onDelete={onDelete}
              isDeleting={deletingId === vid._id}
              showDeleteButton={showDelete || vid.uploaded_by === userRole} // User check logic inside
            />
          ))}
        </div>
      ) : (
        <div className="hud-glass-panel p-8 rounded-xl border border-hud-border text-center space-y-3">
          <Video className="w-10 h-10 text-gray-600 mx-auto" />
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            No video uploads synced for this profile.
          </p>
        </div>
      )}
    </div>
  );
};

export default RecentUploads;
