import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AnalysisHistoryTable from '../components/history/AnalysisHistoryTable';
import DeleteAnalysisModal from '../components/history/DeleteAnalysisModal';
import HistoryFilters from '../components/history/HistoryFilters';
import { getAthletesForAnalysis } from '../services/analysisService';
import { deleteAnalysisHistory, getAnalysisHistory } from '../services/analysisHistoryService';

const AnalysisHistory = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ search: '', athleteId: '', riskLevel: '', sort: 'desc', page: 1, limit: 10 });
  const [athletes, setAthletes] = useState([]);
  const [history, setHistory] = useState({ items: [], pagination: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingId, setDeletingId] = useState('');

  useEffect(() => { getAthletesForAnalysis().then(setAthletes).catch(() => setError('Athletes could not be loaded.')); }, []);
  useEffect(() => {
    setLoading(true); setError('');
    getAnalysisHistory(filters).then(setHistory).catch((requestError) => setError(requestError?.response?.data?.message || 'History could not be loaded.')).finally(() => setLoading(false));
  }, [filters]);

  const confirmDelete = async () => {
    setDeletingId(deleteTarget._id);
    try { await deleteAnalysisHistory(deleteTarget._id); setDeleteTarget(null); setFilters({ ...filters }); } catch (requestError) { setError(requestError?.response?.data?.message || 'History record could not be deleted.'); } finally { setDeletingId(''); }
  };
  const { pagination } = history;
  return <div className="space-y-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-2xl font-bold text-white sm:text-3xl">Analysis History</h1><p className="mt-2 text-sm text-slate-400">Search, review, and manage permanently saved analysis reports.</p></div><span className="text-sm text-slate-400">{pagination.total ?? 0} saved analyses</span></div><HistoryFilters filters={filters} athletes={athletes} onChange={setFilters} />{error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}{loading ? <div className="rounded-2xl border border-slate-800 p-8 text-center text-sm text-slate-400">Loading analysis history…</div> : <AnalysisHistoryTable items={history.items} onView={(id) => navigate(`/analysis-history/${id}`)} onDelete={setDeleteTarget} deletingId={deletingId} />}<div className="flex items-center justify-between"><button disabled={pagination.page <= 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })} className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 disabled:opacity-40">Previous</button><span className="text-sm text-slate-400">Page {pagination.page || 1} of {pagination.totalPages || 1}</span><button disabled={!pagination.totalPages || pagination.page >= pagination.totalPages} onClick={() => setFilters({ ...filters, page: filters.page + 1 })} className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 disabled:opacity-40">Next</button></div><DeleteAnalysisModal analysis={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={confirmDelete} loading={Boolean(deletingId)} /></div>;
};

export default AnalysisHistory;

