import React from 'react';
import { motion } from 'framer-motion';
import RecentAnalyses from '../components/dashboard/RecentAnalyses';
import { User, Activity, Calendar } from 'lucide-react';

const AthleteDetailPage = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 flex flex-col md:flex-row gap-6 items-center md:items-start">
        <div className="w-32 h-32 bg-slate-700 rounded-full flex items-center justify-center border-4 border-slate-600">
          <User className="w-16 h-16 text-gray-400" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-3xl font-bold text-white mb-2">Sarah Williams</h1>
          <p className="text-gray-400 text-lg mb-4">Soccer • Forward • 24 yrs</p>
          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            <div className="flex items-center text-gray-300 bg-slate-800 px-3 py-1 rounded-full text-sm border border-slate-700">
              <Activity className="w-4 h-4 mr-2 text-indigo-400" /> 12 Analyses
            </div>
            <div className="flex items-center text-gray-300 bg-slate-800 px-3 py-1 rounded-full text-sm border border-slate-700">
              <Calendar className="w-4 h-4 mr-2 text-emerald-400" /> Last Active: 2d ago
            </div>
            <div className="flex items-center text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full text-sm border border-rose-500/20 font-medium">
              High Risk Profile
            </div>
          </div>
        </div>
        <div>
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
            Upload Video
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentAnalyses limit={5} />
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Injury History</h2>
          <div className="space-y-4">
            <div className="border-l-2 border-rose-500 pl-4">
              <p className="text-white font-medium">Right ACL Tear</p>
              <p className="text-gray-400 text-sm">March 2022 • Surgery & 9mo rehab</p>
            </div>
            <div className="border-l-2 border-amber-500 pl-4">
              <p className="text-white font-medium">Left Ankle Sprain (Grade 2)</p>
              <p className="text-gray-400 text-sm">Oct 2021 • 3 weeks missed</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AthleteDetailPage;
