import React from 'react';
import { cn } from './Button'; // Reusing cn utility

const Card = React.forwardRef(({ className, glass = false, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border',
        glass 
          ? 'glass' 
          : 'bg-white dark:bg-dark-card border-gray-200 dark:border-gray-800 shadow-sm',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';
export default Card;
