import React from 'react';
import { Calendar, User, Database } from 'lucide-react';

const ReportHeader = ({ athleteId, sessionId, date }) => {
  const formattedDate = date ? new Date(date).toLocaleString() : 'N/A';

  return (
    <div className="hud-glass-panel p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div className="space-y-1">
        <span className="text-[10px] font-bold tracking-widest text-hud-blue uppercase block">
          Sports Biomechanics Evaluation
        </span>
        <h2 className="text-xl font-black text-white uppercase tracking-wider">
          Athlete Intelligence Report
        </h2>
      </div>

      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2 bg-hud-dark/45 border border-hud-border/40 px-3 py-2 rounded-lg">
          <User className="w-4 h-4 text-gray-400" />
          <div>
            <span className="text-[8px] text-gray-500 uppercase font-bold block">Athlete ID</span>
            <span className="font-hud-mono text-white">{athleteId || 'N/A'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-hud-dark/45 border border-hud-border/40 px-3 py-2 rounded-lg">
          <Database className="w-4 h-4 text-gray-400" />
          <div>
            <span className="text-[8px] text-gray-500 uppercase font-bold block">Session ID</span>
            <span className="font-hud-mono text-white">{sessionId || 'N/A'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-hud-dark/45 border border-hud-border/40 px-3 py-2 rounded-lg">
          <Calendar className="w-4 h-4 text-gray-400" />
          <div>
            <span className="text-[8px] text-gray-500 uppercase font-bold block">Analysis Date</span>
            <span className="font-hud-mono text-white">{formattedDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportHeader;
