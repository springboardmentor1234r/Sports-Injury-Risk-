import React from 'react';

const StatusBanner = ({ type, text }) => {
  if (!text) return null;

  const styles = {
    success: 'border-green-200 bg-green-50 text-green-700',
    error: 'border-red-200 bg-red-50 text-red-700',
  };

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${styles[type] || styles.success}`}>
      {text}
    </div>
  );
};

export default StatusBanner;
