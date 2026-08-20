import React, { useState, useEffect } from 'react';
import { FileText, Search, Filter } from 'lucide-react';
import { analysisAPI } from '../services/api';
import AnalysisHistoryTable from '../components/AnalysisHistoryTable';

const AnalysisHistory = ({ user }) => {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('All');

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const fetchAnalyses = async () => {
    setLoading(true);
    try {
      const res = await analysisAPI.getAll();
      setAnalyses(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this analysis record?')) return;
    try {
      await analysisAPI.delete(id);
      fetchAnalyses();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = analyses.filter((item) => {
    const matchesSearch =
      item.athlete_name.toLowerCase().includes(search.toLowerCase()) ||
      item.video_name.toLowerCase().includes(search.toLowerCase());
    const matchesRisk =
      riskFilter === 'All' || item.risk_level.toLowerCase().includes(riskFilter.toLowerCase());
    return matchesSearch && matchesRisk;
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Analysis History & Video Reports</h1>
        <p className="page-subtitle">Search, review, and manage previously saved biomechanics analysis sessions.</p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, backgroundColor: '#F8FAF9', padding: '0.5rem 0.85rem', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
            <Search size={18} color="#9CA3AF" />
            <input
              type="text"
              placeholder="Search by athlete name or video filename..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.9rem' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={16} color="#6B7280" />
            <select className="form-select" value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)} style={{ width: '180px' }}>
              <option value="All">All Risk Levels</option>
              <option value="Low">Low Risk</option>
              <option value="Moderate">Moderate Risk</option>
              <option value="High">High Risk</option>
              <option value="Critical">Critical Risk</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="state-box">
            <div className="spinner" />
            <p>Loading analysis history records...</p>
          </div>
        ) : (
          <AnalysisHistoryTable analyses={filtered} onDelete={handleDelete} />
        )}
      </div>
    </div>
  );
};

export default AnalysisHistory;
