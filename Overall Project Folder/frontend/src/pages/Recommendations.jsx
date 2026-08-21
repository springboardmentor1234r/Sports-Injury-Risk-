import React, { useState, useEffect } from 'react';
import { CheckCircle, Filter } from 'lucide-react';
import { recommendationAPI } from '../services/api';
import RecommendationCard from '../components/RecommendationCard';

const Recommendations = ({ user }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    fetchRecs();
  }, []);

  const fetchRecs = async () => {
    setLoading(true);
    try {
      const res = await recommendationAPI.getAll();
      setRecommendations(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = recommendations.filter((r) => {
    const matchesCat = categoryFilter === 'All' || r.category.toLowerCase().includes(categoryFilter.toLowerCase());
    const matchesStat = statusFilter === 'All' || r.status.toLowerCase().includes(statusFilter.toLowerCase());
    return matchesCat && matchesStat;
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">AI Corrective & Recovery Protocols</h1>
        <p className="page-subtitle">Personalized exercise, mobility, strengthening, and recovery plans generated from video biomechanics.</p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={16} color="#6B7280" />
            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#374151' }}>Category:</span>
            <select className="form-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ width: '200px' }}>
              <option value="All">All Categories</option>
              <option value="Corrective Exercises">Corrective Exercises</option>
              <option value="Mobility">Mobility</option>
              <option value="Strengthening">Strengthening</option>
              <option value="Recovery">Recovery</option>
              <option value="Training Modification">Training Modification</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#374151' }}>Status:</span>
            <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: '160px' }}>
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="state-box">
          <div className="spinner" />
          <p>Loading AI recommendations...</p>
        </div>
      ) : (
        <div className="grid-2">
          {filtered.map((rec) => (
            <RecommendationCard key={rec.id} recommendation={rec} onStatusChange={fetchRecs} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Recommendations;
