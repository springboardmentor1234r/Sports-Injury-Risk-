import React from 'react';
import { Bell, ShieldAlert, ShieldCheck, Mail, Check } from 'lucide-react';

const NotificationCard = ({ notification, onMarkRead }) => {
  const { _id, notification_type, title, message, severity, read_status, created_at } = notification;

  const getSeverityStyles = () => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL': return 'border-hud-danger/25 bg-hud-danger/5 text-hud-danger';
      case 'HIGH': return 'border-hud-warning/25 bg-hud-warning/5 text-hud-warning';
      case 'MEDIUM': return 'border-hud-blue/25 bg-hud-blue/5 text-hud-blue';
      case 'LOW':
      default: return 'border-hud-green/25 bg-hud-green/5 text-hud-green';
    }
  };

  const getSeverityIcon = () => {
    if (severity?.toUpperCase() === 'CRITICAL' || severity?.toUpperCase() === 'HIGH') {
      return <ShieldAlert className="w-5 h-5 text-hud-danger" />;
    }
    return <ShieldCheck className="w-5 h-5 text-hud-green" />;
  };

  return (
    <div 
      className={`border rounded-xl p-4 flex gap-4 items-start transition-all ${getSeverityStyles()} ${
        !read_status ? 'shadow-[0_0_12px_rgba(59,130,246,0.05)] border-l-4' : 'opacity-65'
      }`}
    >
      <div className="bg-hud-black/45 p-2 rounded-lg border border-hud-border/40 flex-shrink-0 mt-0.5">
        {getSeverityIcon()}
      </div>

      <div className="flex-1 space-y-1.5 text-xs">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
          <h4 className="font-extrabold text-white uppercase tracking-wider">{title}</h4>
          <span className="text-[9px] text-gray-500 font-hud-mono">
            {new Date(created_at).toLocaleString()}
          </span>
        </div>
        
        <p className="text-gray-300 leading-relaxed">{message}</p>
        
        <div className="flex justify-between items-center pt-1 border-t border-hud-border/20 mt-1">
          <span className="text-[9px] text-gray-500 uppercase tracking-widest font-hud-mono">
            Category: {notification_type}
          </span>

          {!read_status && (
            <button
              onClick={() => onMarkRead(_id)}
              className="px-2.5 py-1 bg-hud-blue/15 hover:bg-hud-blue text-hud-blue hover:text-white border border-hud-blue/30 rounded text-[9px] font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1 transition-all"
            >
              <Check className="w-3 h-3" />
              <span>Mark Read</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCard;
