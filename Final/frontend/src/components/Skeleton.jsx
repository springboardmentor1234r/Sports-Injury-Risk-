import React from 'react';

export const SkeletonRow = ({ cols = 5 }) => {
  return (
    <tr className="animate-pulse border-b border-hud-blue/5">
      {Array.from({ length: cols }).map((_, idx) => (
        <td key={idx} className="p-4">
          <div className="h-3.5 bg-hud-blue/10 rounded w-3/4"></div>
        </td>
      ))}
    </tr>
  );
};

export const SkeletonCard = () => {
  return (
    <div className="animate-pulse hud-glass-panel p-6 rounded border border-hud-blue/15 space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-hud-blue/10 rounded-md"></div>
        <div className="space-y-2 flex-1">
          <div className="h-4.5 bg-hud-blue/10 rounded w-1/2"></div>
          <div className="h-3 bg-hud-blue/10 rounded w-1/3"></div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-hud-blue/10 rounded w-full"></div>
        <div className="h-3 bg-hud-blue/10 rounded w-5/6"></div>
        <div className="h-3 bg-hud-blue/10 rounded w-2/3"></div>
      </div>
    </div>
  );
};

export default SkeletonRow;
