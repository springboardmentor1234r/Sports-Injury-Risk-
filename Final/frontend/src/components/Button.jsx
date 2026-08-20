import React from 'react';
import { motion } from 'framer-motion';

export const Button = ({ 
  children, 
  className = '', 
  variant = 'primary', 
  loading = false, 
  disabled = false, 
  ...props 
}) => {
  const baseStyle = "font-sans text-xs font-semibold px-4 py-2 rounded-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2";
  const variants = {
    primary: "btn-hud-primary",
    secondary: "btn-hud-secondary",
    danger: "btn-hud-danger",
    outline: "border border-hud-blue/30 text-hud-blue hover:bg-hud-blue/5"
  };

  return (
    <motion.button
      whileHover={!disabled && !loading ? { scale: 1.01 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.99 } : {}}
      className={`${baseStyle} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <svg className="animate-spin h-3.5 w-3.5 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="animate-pulse">Loading...</span>
        </div>
      ) : children}
    </motion.button>
  );
};

export default Button;
