import React from 'react';

const NotificationBadge = ({ count }) => {
  if (!count) return null;

  return (
    <span className="w-5 h-5 bg-hud-danger text-white rounded-full flex items-center justify-center text-[9px] font-hud-mono font-bold animate-pulse">
      {count}
    </span>
  );
};

export default NotificationBadge;
