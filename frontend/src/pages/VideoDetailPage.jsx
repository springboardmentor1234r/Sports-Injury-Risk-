import React from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';

const VideoDetailPage = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Sprint Mechanics - Side View</h1>
        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
          View Analysis
        </button>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
        <div className="aspect-video bg-black rounded-lg flex items-center justify-center relative mb-4">
          <div className="absolute inset-0 flex items-center justify-center">
            <button className="w-16 h-16 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-sm">
              <Play className="w-8 h-8 ml-1" />
            </button>
          </div>
          <p className="text-slate-600">Video Player Component</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
            <p className="text-gray-400 mb-1">Athlete</p>
            <p className="text-white font-medium">Mike Brown</p>
          </div>
          <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
            <p className="text-gray-400 mb-1">Date</p>
            <p className="text-white font-medium">Oct 24, 2023</p>
          </div>
          <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
            <p className="text-gray-400 mb-1">Status</p>
            <p className="text-emerald-400 font-medium">Analyzed</p>
          </div>
          <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
            <p className="text-gray-400 mb-1">Resolution</p>
            <p className="text-white font-medium">1080p @ 60fps</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default VideoDetailPage;
