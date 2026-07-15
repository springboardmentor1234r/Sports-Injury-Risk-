import React from 'react';
import { motion } from 'framer-motion';

export const Card = ({ 
  children, 
  className = '', 
  title, 
  headerAction, 
  ...props 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`hud-glass-panel p-6 rounded relative overflow-hidden border border-hud-blue/15 ${className}`}
      {...props}
    >
      {(title || headerAction) && (
        <div className="flex justify-between items-center mb-4 border-b border-hud-blue/10 pb-2">
          {title && <h3 className="text-xs font-hud-mono text-gray-400 uppercase tracking-widest">{title}</h3>}
          {headerAction}
        </div>
      )}
      {children}
    </motion.div>
  );
};

export default Card;
