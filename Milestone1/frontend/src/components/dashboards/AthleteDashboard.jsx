import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Activity, Dumbbell, ShieldAlert, Award, Video, ChevronRight, CheckCircle, Flame, HeartPulse } from 'lucide-react';

export const AthleteDashboard = () => {
  const { user } = useAuth();
  const [selectedVideo, setSelectedVideo] = useState('drop_jump_cutting_01.mp4');

  const riskScore = 24; // 0-100 scale (24 = Low Risk)

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-l-4 border-l-cyan-400">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-white">Welcome back, {user?.full_name || 'Athlete'}</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full">
              Cleared for Full Training
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Athlete ID: <span className="font-mono text-cyan-400">ATH-9901</span> • Primary Sport: <span className="text-slate-200">Soccer (Winger)</span> • ACWR Load: <span className="text-emerald-400 font-bold">1.18</span>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 text-xs font-bold bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 rounded-xl transition-all flex items-center gap-1.5">
            <Video className="w-4 h-4" /> Upload Movement Video
          </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Injury Risk Gauge Container & Recommendations */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Risk Score Container (0-100) */}
          <div className="glass-panel-glow p-6 rounded-2xl relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Overall Injury Risk Score</h3>
                <p className="text-xs text-slate-400">Calculated via Biomechanical Pose Analysis</p>
              </div>
              <span className="p-2 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                <HeartPulse className="w-5 h-5" />
              </span>
            </div>

            {/* Circular / Large Gauge Score Display */}
            <div className="flex items-center justify-center my-6">
              <div className="relative flex items-center justify-center w-40 h-40 rounded-full border-8 border-slate-800 border-t-emerald-400 border-r-emerald-400 shadow-xl shadow-emerald-950/50">
                <div className="text-center">
                  <span className="text-4xl font-extrabold text-white">{riskScore}</span>
                  <span className="text-xs font-bold text-slate-400 block">/ 100</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs pt-4 border-t border-slate-800">
              <div className="p-2 bg-slate-950/60 rounded-xl">
                <span className="text-[10px] text-slate-500 block">ACL Strain</span>
                <span className="font-bold text-emerald-400">Low (8%)</span>
              </div>
              <div className="p-2 bg-slate-950/60 rounded-xl">
                <span className="text-[10px] text-slate-500 block">Hamstring</span>
                <span className="font-bold text-emerald-400">Low (12%)</span>
              </div>
              <div className="p-2 bg-slate-950/60 rounded-xl">
                <span className="text-[10px] text-slate-500 block">Ankle Valgus</span>
                <span className="font-bold text-amber-400">Mod (22%)</span>
              </div>
            </div>
          </div>

          {/* Exercise Recommendation Cards */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
              <span>Targeted Injury Prevention Exercises</span>
              <Award className="w-4 h-4 text-cyan-400" />
            </h3>

            <div className="space-y-3">
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between hover:border-cyan-900 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-950 text-cyan-400 flex items-center justify-center font-bold text-xs">
                    01
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">Eccentric Nordic Hamstring Curls</h4>
                    <p className="text-[10px] text-slate-400">3 Sets x 8 Reps • Focus on slow 4s descent</p>
                  </div>
                </div>
                <span className="px-2 py-1 text-[10px] font-semibold bg-cyan-950 text-cyan-400 rounded">Prescribed</span>
              </div>

              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between hover:border-cyan-900 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-950 text-emerald-400 flex items-center justify-center font-bold text-xs">
                    02
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">Single-Leg Drop Jump Symmetry Drill</h4>
                    <p className="text-[10px] text-slate-400">4 Sets x 5 Reps • Correct knee valgus drift</p>
                  </div>
                </div>
                <span className="px-2 py-1 text-[10px] font-semibold bg-emerald-950 text-emerald-400 rounded">High Priority</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Movement Video Analysis & Trajectory Report Placeholder */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Video Analysis & Pose Keypoint Overlay</h3>
                <p className="text-xs text-slate-400">COCO 17-Keypoint & Human3.6M 3D Joint Tracking Frame</p>
              </div>
              <span className="px-2.5 py-1 text-[10px] font-mono bg-slate-900 text-cyan-400 rounded border border-slate-800">
                60 FPS Pose Stream
              </span>
            </div>

            {/* Video Preview Container with Keypoint overlay visual simulation */}
            <div className="relative w-full h-64 sm:h-72 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center group">
              
              {/* Fake Video Grid background */}
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#00f2fe_1px,transparent_1px)] [background-size:16px_16px]"></div>

              {/* Skeleton Visual Overlay Mockup */}
              <div className="relative z-10 text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-cyan-950/60 border-2 border-cyan-400/50 flex items-center justify-center animate-pulse mb-3">
                  <Activity className="w-10 h-10 text-cyan-400" />
                </div>
                <span className="text-xs font-mono text-cyan-300 block">Joint Trajectory Active: Knee Angle = 132.4°</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Symmetry Ratio: 94.2% (Left vs Right leg)</span>
              </div>

              {/* Status Pills */}
              <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur px-3 py-1 rounded-full border border-slate-800 text-[10px] text-emerald-400 font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Live Tracking
              </div>

              <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur px-3 py-1 rounded-lg border border-slate-800 text-[10px] text-slate-300 font-mono">
                Model: YOLOv8x-Pose + OpenPose
              </div>
            </div>

            {/* Movement Metric Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Knee Flexion</span>
                <span className="text-sm font-bold text-white">132.4°</span>
              </div>
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Valgus Angle</span>
                <span className="text-sm font-bold text-emerald-400">4.2° (Normal)</span>
              </div>
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Ground Force</span>
                <span className="text-sm font-bold text-white">3.1 G</span>
              </div>
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Cadence</span>
                <span className="text-sm font-bold text-cyan-400">178 spm</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
