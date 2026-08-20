import React from 'react';

export default function Avatar({ src, name, size = 'md' }) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-24 h-24 text-2xl',
  };

  const initial = name ? name.charAt(0).toUpperCase() : 'U';

  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center text-white font-medium shadow-sm shrink-0 overflow-hidden`}>
      {src ? <img src={src} alt={name} className="w-full h-full object-cover" /> : initial}
    </div>
  );
}
