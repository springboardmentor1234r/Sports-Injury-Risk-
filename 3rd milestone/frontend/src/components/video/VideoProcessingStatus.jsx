import React from 'react';
import { motion } from 'framer-motion';

const VideoProcessingStatus = ({ progress = 45 }) => {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
      <h3 className="text-lg font-bold text-white mb-2">Analyzing Movement...</h3>
      <p className="text-gray-400 text-sm mb-6">Running biomechanical models on video frames.</p>
      
      <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
        <motion.div 
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-400">
        <span>Extracting Keypoints</span>
        <span>{progress}%</span>
      </div>
    </div>
  );
};

export default VideoProcessingStatus;
