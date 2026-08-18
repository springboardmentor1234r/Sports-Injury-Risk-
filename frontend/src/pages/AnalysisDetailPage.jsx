import React from 'react';
import AnalysisResults from '../components/analysis/AnalysisResults';
import PoseVisualization from '../components/analysis/PoseVisualization';
import TimelineChart from '../components/analysis/TimelineChart';
import { motion } from 'framer-motion';

const AnalysisDetailPage = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center space-x-4">
        <h1 className="text-2xl font-bold text-white">Jump Analysis - Front</h1>
        <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs font-semibold">Completed</span>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <AnalysisResults />
          <TimelineChart />
        </div>
        <div className="space-y-6">
          <PoseVisualization />
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Key Findings</h3>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start">
                <span className="text-amber-500 mr-2">•</span>
                Mild valgus collapse detected in right knee during landing.
              </li>
              <li className="flex items-start">
                <span className="text-emerald-500 mr-2">•</span>
                Good hip extension symmetry.
              </li>
              <li className="flex items-start">
                <span className="text-indigo-400 mr-2">•</span>
                Ankle dorsiflexion within normal range.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AnalysisDetailPage;
