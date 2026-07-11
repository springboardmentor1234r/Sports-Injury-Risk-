import React from 'react';

const StatusBanner = ({ type, text }) => {
  if (!text) return null;

  const styles = {
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    error: 'border-red-500/30 bg-red-500/10 text-red-300',
  };

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${styles[type] || styles.success}`}>
      {text}
    </div>
  );
};

export default StatusBanner;
