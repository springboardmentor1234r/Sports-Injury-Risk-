import React from 'react';

export const Input = ({ 
  label, 
  icon: Icon, 
  error, 
  className = '', 
  ...props 
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-gray-400">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
            <Icon className="w-4 h-4" />
          </span>
        )}
        <input
          className={`w-full ${Icon ? 'pl-10' : 'px-4'} py-2.5 input-hud text-xs ${
            error ? 'border-hud-danger/50 text-hud-danger bg-hud-danger/5' : ''
          }`}
          {...props}
        />
      </div>
      {error && (
        <span className="text-xs text-hud-danger block mt-1">
          {error}
        </span>
      )}
    </div>
  );
};

export default Input;
