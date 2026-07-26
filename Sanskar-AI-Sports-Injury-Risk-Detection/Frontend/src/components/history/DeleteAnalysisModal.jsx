import React from 'react';

const DeleteAnalysisModal = ({ analysis, onCancel, onConfirm, loading }) => {
  if (!analysis) return null;
  return <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/80 p-4"><div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"><h2 className="text-lg font-bold text-white">Delete analysis history?</h2><p className="mt-2 text-sm leading-relaxed text-slate-300">This removes the saved analysis record for {analysis.video?.originalFileName}. The original video remains in video management.</p><div className="mt-6 flex justify-end gap-3"><button onClick={onCancel} disabled={loading} className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300">Cancel</button><button onClick={onConfirm} disabled={loading} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{loading ? 'Deleting…' : 'Delete Record'}</button></div></div></div>;
};

export default DeleteAnalysisModal;

