import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const Alert = ({ 
  type = 'info', 
  title, 
  message, 
  dismissible = false, 
  onDismiss,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) onDismiss();
  };

  const variants = {
    success: {
      icon: CheckCircle,
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      text: 'text-emerald-400',
      title: 'text-emerald-300'
    },
    warning: {
      icon: AlertTriangle,
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      text: 'text-amber-400',
      title: 'text-amber-300'
    },
    error: {
      icon: XCircle,
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      text: 'text-rose-400',
      title: 'text-rose-300'
    },
    info: {
      icon: Info,
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      text: 'text-blue-400',
      title: 'text-blue-300'
    }
  };

  const currentVariant = variants[type] || variants.info;
  const Icon = currentVariant.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`rounded-xl border backdrop-blur-xl p-4 flex items-start space-x-3 ${currentVariant.bg} ${currentVariant.border} ${className}`}
        >
          <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${currentVariant.text}`} />
          <div className="flex-1">
            {title && <h3 className={`text-sm font-semibold ${currentVariant.title}`}>{title}</h3>}
            <p className={`text-sm mt-1 ${currentVariant.text}`}>{message}</p>
          </div>
          {dismissible && (
            <button 
              onClick={handleDismiss}
              className={`flex-shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors ${currentVariant.text}`}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Alert;
