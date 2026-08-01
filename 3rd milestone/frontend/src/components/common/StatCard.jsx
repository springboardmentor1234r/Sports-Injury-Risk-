import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue, 
  trendLabel,
  className = '' 
}) => {
  // Simple counter animation
  const [displayValue, setDisplayValue] = useState(typeof value === 'number' ? 0 : value);

  useEffect(() => {
    if (typeof value === 'number') {
      let start = 0;
      const duration = 1000;
      const startTime = performance.now();
      
      const updateCounter = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (easeOutQuart)
        const easeOut = 1 - Math.pow(1 - progress, 4);
        
        setDisplayValue(Math.floor(easeOut * value));
        
        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        } else {
          setDisplayValue(value);
        }
      };
      
      requestAnimationFrame(updateCounter);
    } else {
      setDisplayValue(value);
    }
  }, [value]);

  const renderTrend = () => {
    if (!trend) return null;
    
    let TrendIcon = Minus;
    let colorClass = 'text-slate-400';
    
    if (trend === 'up') {
      TrendIcon = TrendingUp;
      colorClass = 'text-emerald-400';
    } else if (trend === 'down') {
      TrendIcon = TrendingDown;
      colorClass = 'text-rose-400';
    }

    return (
      <div className={`flex items-center text-xs font-medium ${colorClass}`}>
        <TrendIcon className="h-3 w-3 mr-1" />
        <span>{trendValue}</span>
        {trendLabel && <span className="text-slate-400 ml-1">{trendLabel}</span>}
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-5 ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <div className="mt-2 flex items-baseline space-x-2">
            <h3 className="text-3xl font-bold text-white tracking-tight">
              {displayValue}
            </h3>
          </div>
          <div className="mt-2">
            {renderTrend()}
          </div>
        </div>
        {Icon && (
          <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl border border-indigo-500/20">
            <Icon className="h-6 w-6 text-indigo-400" />
          </div>
        )}
      </div>
      
      {/* Decorative gradient blob */}
      <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-2xl pointer-events-none" />
    </motion.div>
  );
};

export default StatCard;
