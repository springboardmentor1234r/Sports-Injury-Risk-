import React from 'react';
import { Filter, Eye, EyeOff } from 'lucide-react';

const NotificationFilters = ({ unreadOnly, setUnreadOnly, severityFilter, setSeverityFilter }) => {
  return (
    <div className="hud-glass-panel p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
      <div className="flex items-center gap-2 text-gray-400">
        <Filter className="w-4 h-4" />
        <span className="font-bold uppercase tracking-wider text-[10px]">Filter Alerts</span>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        {/* Read / Unread Status */}
        <div className="flex gap-2 border border-hud-border/40 p-1 rounded-lg bg-hud-dark/15">
          <button
            onClick={() => setUnreadOnly(true)}
            className={`px-3 py-1 rounded font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
              unreadOnly 
                ? 'bg-hud-blue text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>Unread Only</span>
          </button>
          <button
            onClick={() => setUnreadOnly(false)}
            className={`px-3 py-1 rounded font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
              !unreadOnly 
                ? 'bg-hud-blue text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>All Alerts</span>
          </button>
        </div>

        {/* Severity levels Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold block">Severity:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="input-hud px-3 py-1 bg-hud-dark/30 text-white border border-hud-border rounded text-xs"
          >
            <option value="ALL">All Levels</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default NotificationFilters;
