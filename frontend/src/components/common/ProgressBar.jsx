import React from 'react';
import { motion } from 'framer-motion';

const ProgressBar = ({ 
  progress = 0, 
  color = 'indigo', 
  height = 'md', 
  showLabel = false,
  className = '' 
}) => {
  const normalizedProgress = Math.min(Math.max(progress, 0), 100);
  
  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4'
  };

  const colorVariants = {
    indigo: 'from-indigo-500 to-purple-500',
    emerald: 'from-emerald-400 to-emerald-600',
    amber: 'from-amber-400 to-amber-600',
    rose: 'from-rose-500 to-rose-700'
  };

  const activeColor = colorVariants[color] || colorVariants.indigo;

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-medium text-slate-300">Progress</span>
          <span className="text-xs font-medium text-slate-300">{Math.round(normalizedProgress)}%</span>
        </div>
      )}
      <div className={`w-full bg-white/10 rounded-full overflow-hidden ${heightClasses[height]}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${normalizedProgress}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`h-full rounded-full bg-gradient-to-r ${activeColor}`}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
