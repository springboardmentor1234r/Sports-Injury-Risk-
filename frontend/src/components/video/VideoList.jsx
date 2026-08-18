import React from 'react';
import VideoCard from './VideoCard';

const VideoList = () => {
  const videos = [
    { id: 1, title: 'Jump Analysis - Front', date: 'Oct 25, 2023', status: 'Completed', duration: '0:15', riskScore: 25 },
    { id: 2, title: 'Sprint Mechanics - Side', date: 'Oct 24, 2023', status: 'Completed', duration: '0:22', riskScore: 85 },
    { id: 3, title: 'Squat Form - Rear', date: 'Oct 24, 2023', status: 'Processing', duration: '0:30', riskScore: 0 },
    { id: 4, title: 'Agility Drill', date: 'Oct 22, 2023', status: 'Failed', duration: '0:12', riskScore: 0 },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {videos.map(video => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
};

export default VideoList;
