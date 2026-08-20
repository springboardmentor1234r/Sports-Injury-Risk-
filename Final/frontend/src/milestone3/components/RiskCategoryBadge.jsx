import React from 'react';

const RiskCategoryBadge = ({ category }) => {
  const getStyle = () => {
    switch (category?.toLowerCase()) {
      case 'critical':
        return 'bg-hud-danger/15 border-hud-danger/30 text-hud-danger';
      case 'high':
        return 'bg-hud-warning/15 border-hud-warning/30 text-hud-warning';
      case 'moderate':
      case 'medium':
        return 'bg-amber-500/15 border-amber-500/30 text-amber-400';
      case 'low':
      default:
        return 'bg-hud-green/15 border-hud-green/30 text-hud-green';
    }
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider ${getStyle()}`}>
      {category || 'LOW'}
    </span>
  );
};

export default RiskCategoryBadge;
