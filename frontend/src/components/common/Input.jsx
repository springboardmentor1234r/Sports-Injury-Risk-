import React, { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

const Input = forwardRef(({ 
  label, 
  error, 
  icon: Icon, 
  className = '', 
  id, 
  ...props 
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-slate-400" />
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            block w-full rounded-lg sm:text-sm transition-colors duration-200
            bg-white/5 border backdrop-blur-xl
            focus:ring-2 focus:outline-none
            ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5
            ${error 
              ? 'border-rose-500/50 text-rose-200 focus:border-rose-500 focus:ring-rose-500/20 placeholder-rose-400/50' 
              : 'border-white/10 text-slate-100 focus:border-indigo-500 focus:ring-indigo-500/20 placeholder-slate-500'
            }
          `}
          {...props}
        />
        {error && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <AlertCircle className="h-5 w-5 text-rose-500" />
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
