import React from 'react';

const DeleteAnalysisModal = ({ analysis, onCancel, onConfirm, loading }) => {
  if (!analysis) return null;
  return <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/40 p-4"><div className="w-full max-w-md rounded-2xl border border-brand-200 bg-white p-6 shadow-2xl shadow-brand-900/10"><h2 className="text-lg font-bold text-slate-700">Delete analysis history?</h2><p className="mt-2 text-sm leading-relaxed text-slate-600">This removes the saved analysis record for {analysis.video?.originalFileName}. The original video remains in video management.</p><div className="mt-6 flex justify-end gap-3"><button onClick={onCancel} disabled={loading} className="rounded-xl border border-brand-500 px-4 py-2 text-sm text-brand-600 hover:bg-brand-50">Cancel</button><button onClick={onConfirm} disabled={loading} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">{loading ? 'Deleting…' : 'Delete Record'}</button></div></div></div>;
};

export default DeleteAnalysisModal;
