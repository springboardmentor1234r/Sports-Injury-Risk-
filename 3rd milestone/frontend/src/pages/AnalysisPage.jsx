import React from 'react';
import VideoList from '../components/video/VideoList';
import { motion } from 'framer-motion';

const AnalysisPage = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
          Analyses
        </h1>
        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
          New Analysis
        </button>
      </div>
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 flex gap-4">
        <input 
          type="text" 
          placeholder="Search analyses..." 
          className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2 focus:ring-1 focus:ring-indigo-500 outline-none"
        />
        <select className="bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2 focus:ring-1 focus:ring-indigo-500 outline-none">
          <option>All Status</option>
          <option>Completed</option>
          <option>Processing</option>
        </select>
      </div>
      <VideoList />
    </motion.div>
  );
};

export default AnalysisPage;
