import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertOctagon } from 'lucide-react';

export const Toast = ({ toast }) => {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ y: 20, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.95 }}
          className={`fixed bottom-10 right-6 p-4 rounded-xl shadow-lg z-50 flex items-center gap-3 font-sans text-xs border backdrop-blur-md max-w-sm ${
            toast.type === 'success'
              ? 'bg-hud-green/10 border-hud-green text-hud-green'
              : 'bg-hud-danger/10 border-hud-danger text-hud-danger'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertOctagon className="w-5 h-5 flex-shrink-0" />
          )}
          <div>
            <p className="font-bold tracking-wide">
              {toast.type === 'success' ? 'Success' : 'Error'}
            </p>
            <p className="opacity-95 mt-0.5">{toast.message}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;
