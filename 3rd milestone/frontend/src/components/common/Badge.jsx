import React from 'react';
import { cn } from './Button';

export default function Badge({ children, variant = 'primary', className }) {
  const variants = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-danger/10 text-danger',
    gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  };

  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  );
}
