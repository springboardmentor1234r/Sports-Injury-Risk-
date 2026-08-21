import React, { useState, useEffect } from 'react';
import { HeartPulse, ShieldAlert, CheckCircle, Activity, User } from 'lucide-react';
import { athleteAPI, recommendationAPI } from '../services/api';
import RecommendationCard from '../components/RecommendationCard';

const PhysiotherapistDashboard = ({ user }) => {
  const [athletes, setAthletes] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const athRes = await athleteAPI.getAll();
      setAthletes(athRes.data);

      const recRes = await recommendationAPI.getAll();
      setRecommendations(recRes.data);
    } catch (err) {
      console.error('Error fetching physio dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const highRiskAthletes = athletes.filter((a) => (a.risk_level || '').toLowerCase().includes('high'));
  const pendingRecs = recommendations.filter((r) => r.status === 'Pending');
  const completedRecs = recommendations.filter((r) => r.status === 'Completed');

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Physiotherapist Dashboard</h1>
        <p className="page-subtitle">Rehabilitation tracking, injury recovery monitoring & corrective movement protocols.</p>
      </div>

      {/* Metric Summary Grid */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>Under Monitoring</span>
            <HeartPulse size={20} color="#15803D" />
          </div>
          <div style={styles.cardVal}>{athletes.length}</div>
          <span style={styles.cardSub}>Active athlete profiles</span>
        </div>

        <div className="card">
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>High Risk Rehab Cases</span>
            <ShieldAlert size={20} color="#C2410C" />
          </div>
          <div style={{ ...styles.cardVal, color: '#C2410C' }}>{highRiskAthletes.length}</div>
          <span style={styles.cardSub}>Requires movement correction</span>
        </div>

        <div className="card">
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>Pending Exercise Protocols</span>
            <Activity size={20} color="#A16207" />
          </div>
          <div style={{ ...styles.cardVal, color: '#A16207' }}>{pendingRecs.length}</div>
          <span style={styles.cardSub}>Assigned AI recommendations</span>
        </div>

        <div className="card">
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>Completed Recovery Sessions</span>
            <CheckCircle size={20} color="#15803D" />
          </div>
          <div style={{ ...styles.cardVal, color: '#15803D' }}>{completedRecs.length}</div>
          <span style={styles.cardSub}>Successfully executed</span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        {/* High Risk Athlete List */}
        <div className="card">
          <h3 className="card-title">Priority Rehabilitation Roster</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {highRiskAthletes.length === 0 ? (
              <p style={{ color: '#6B7280', fontSize: '0.85rem' }}>No high-risk rehabilitation cases detected.</p>
            ) : (
              highRiskAthletes.map((ath) => (
                <div key={ath.id} style={styles.rehabItem}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={styles.avatar}>{(ath.name || 'A')[0]}</div>
                    <div>
                      <strong style={{ fontSize: '0.9rem', color: '#1F2937' }}>{ath.name}</strong>
                      <div style={{ fontSize: '0.78rem', color: '#6B7280' }}>{ath.sport_type} | Injury: {ath.injury_history}</div>
                    </div>
                  </div>
                  <span className="badge badge-high">{ath.recent_risk_score} Risk</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* AI Corrective Recommendations Hub */}
        <div className="card">
          <h3 className="card-title">Assigned Corrective Protocols</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {recommendations.slice(0, 3).map((rec) => (
              <RecommendationCard key={rec.id} recommendation={rec} onStatusChange={fetchData} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' },
  cardTitle: { fontSize: '0.85rem', fontWeight: '700', color: '#6B7280' },
  cardVal: { fontSize: '1.8rem', fontWeight: '800', color: '#1F2937' },
  cardSub: { fontSize: '0.72rem', color: '#9CA3AF' },
  rehabItem: {
    padding: '0.75rem 1rem',
    backgroundColor: '#F8FAF9',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#15803D',
    color: '#FFFFFF',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.85rem',
  },
};

export default PhysiotherapistDashboard;
