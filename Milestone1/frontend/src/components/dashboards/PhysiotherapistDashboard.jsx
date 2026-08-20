import React, { useState } from 'react';
import { Stethoscope, Activity, Plus, CheckCircle, Clock, ChevronRight, FileText } from 'lucide-react';

export const PhysiotherapistDashboard = () => {
  const [selectedAthlete, setSelectedAthlete] = useState('Marcus Rashford');

  const rehabKanban = {
    initial: [
      { id: 1, name: 'Bukayo Saka', injury: 'Grade 1 Ankle Sprain', progress: 15, daysIn: 4 }
    ],
    rehab: [
      { id: 2, name: 'Jude Bellingham', injury: 'Patellar Tendinopathy', progress: 45, daysIn: 18 },
      { id: 3, name: 'Kevin De Bruyne', injury: 'Right Biceps Femoris Strain', progress: 65, daysIn: 24 }
    ],
    onField: [
      { id: 4, name: 'Marcus Rashford', injury: 'Left ACL Reconstruction', progress: 88, daysIn: 140 }
    ],
    cleared: [
      { id: 5, name: 'Virgil van Dijk', injury: 'Meniscus Repair', progress: 100, daysIn: 180 }
    ]
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-l-4 border-l-amber-400">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-white">Physiotherapy & Rehabilitation Portal</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-amber-950 text-amber-400 border border-amber-800 rounded-full">
              4 Active Rehab Cases
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Joint Alignment Kinematics, Range of Motion (ROM) Analysis & SOAP Progress Logger
          </p>
        </div>

        <button className="px-4 py-2 text-xs font-bold bg-amber-950 hover:bg-amber-900 border border-amber-800 text-amber-300 rounded-xl transition-all flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> New Rehab Protocol
        </button>
      </div>

      {/* JOINT ALIGNMENT & RANGE OF MOTION (ROM) METRIC PANEL */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Joint Alignment & Range of Motion (ROM) Metrics</h3>
            <p className="text-xs text-slate-400">Selected Patient: <span className="text-cyan-400 font-semibold">{selectedAthlete}</span></p>
          </div>
          <span className="px-3 py-1 text-xs bg-slate-950 text-emerald-400 border border-slate-800 rounded-lg font-mono">
            ROM Recovery: 92%
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Knee Flexion Angle</span>
              <span className="font-bold text-emerald-400">138° / 142° Target</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-400 h-full w-[94%]"></div>
            </div>
            <p className="text-[10px] text-slate-500">Symmetry vs unaffected leg: 96.5%</p>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Valgus Dynamic Collapse</span>
              <span className="font-bold text-cyan-400">3.8° (Optimal)</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-cyan-400 h-full w-[85%]"></div>
            </div>
            <p className="text-[10px] text-slate-500">No lateral displacement observed in drop jump</p>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Hip Internal Rotation</span>
              <span className="font-bold text-amber-400">32° (Slight Deficit)</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-amber-400 h-full w-[72%]"></div>
            </div>
            <p className="text-[10px] text-slate-500">Targeting +8° via manual therapy</p>
          </div>

        </div>
      </div>

      {/* ATHLETE REHAB TRACKING KANBAN BOARD */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Athlete Rehab Pipeline Tracking Board</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Column 1: Initial Assessment */}
          <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl space-y-3">
            <div className="flex justify-between items-center text-xs font-bold text-slate-400 pb-2 border-b border-slate-800">
              <span>Initial Assessment</span>
              <span className="bg-slate-900 px-2 py-0.5 rounded text-[10px]">{rehabKanban.initial.length}</span>
            </div>
            {rehabKanban.initial.map(item => (
              <div key={item.id} className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
                <span className="text-xs font-bold text-slate-200 block">{item.name}</span>
                <span className="text-[10px] text-rose-400 font-medium block">{item.injury}</span>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Day {item.daysIn}</span>
                  <span>{item.progress}% Progress</span>
                </div>
              </div>
            ))}
          </div>

          {/* Column 2: Active Rehab */}
          <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl space-y-3">
            <div className="flex justify-between items-center text-xs font-bold text-amber-400 pb-2 border-b border-slate-800">
              <span>Active Rehab</span>
              <span className="bg-amber-950 px-2 py-0.5 rounded text-[10px]">{rehabKanban.rehab.length}</span>
            </div>
            {rehabKanban.rehab.map(item => (
              <div key={item.id} className="p-3 bg-slate-900 border border-amber-900/50 rounded-lg space-y-2">
                <span className="text-xs font-bold text-slate-200 block">{item.name}</span>
                <span className="text-[10px] text-amber-400 font-medium block">{item.injury}</span>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-400 h-full" style={{ width: `${item.progress}%` }}></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Day {item.daysIn}</span>
                  <span>{item.progress}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Column 3: On-Field Return */}
          <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl space-y-3">
            <div className="flex justify-between items-center text-xs font-bold text-cyan-400 pb-2 border-b border-slate-800">
              <span>On-Field Transition</span>
              <span className="bg-cyan-950 px-2 py-0.5 rounded text-[10px]">{rehabKanban.onField.length}</span>
            </div>
            {rehabKanban.onField.map(item => (
              <div key={item.id} className="p-3 bg-slate-900 border border-cyan-900/50 rounded-lg space-y-2">
                <span className="text-xs font-bold text-slate-200 block">{item.name}</span>
                <span className="text-[10px] text-cyan-400 font-medium block">{item.injury}</span>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-cyan-400 h-full" style={{ width: `${item.progress}%` }}></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Day {item.daysIn}</span>
                  <span>{item.progress}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Column 4: Fully Cleared */}
          <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl space-y-3">
            <div className="flex justify-between items-center text-xs font-bold text-emerald-400 pb-2 border-b border-slate-800">
              <span>Fully Cleared</span>
              <span className="bg-emerald-950 px-2 py-0.5 rounded text-[10px]">{rehabKanban.cleared.length}</span>
            </div>
            {rehabKanban.cleared.map(item => (
              <div key={item.id} className="p-3 bg-slate-900 border border-emerald-900/50 rounded-lg space-y-2">
                <span className="text-xs font-bold text-slate-200 block">{item.name}</span>
                <span className="text-[10px] text-emerald-400 font-medium block">{item.injury}</span>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Completed</span>
                  <span className="text-emerald-400 font-bold">100%</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

    </div>
  );
};
