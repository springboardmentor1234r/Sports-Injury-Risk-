import React, { useState, useEffect } from 'react';
import { Users, ShieldAlert, CheckCircle, Search, Filter, Eye, Video, Activity, RefreshCw } from 'lucide-react';
import { athleteAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

const CoachDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sportFilter, setSportFilter] = useState('All');
  const [selectedAthlete, setSelectedAthlete] = useState(null);

  useEffect(() => {
    fetchAthletes();
  }, []);

  const fetchAthletes = async () => {
    setLoading(true);
    try {
      const res = await athleteAPI.getAll({ search, sport: sportFilter });
      setAthletes(res.data);
    } catch (err) {
      console.error('Error fetching coach dashboard athletes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setSportFilter(e.target.value);
  };

  // Risk Distribution Counts
  const total = athletes.length;
  const lowRiskCount = athletes.filter((a) => (a.risk_level || '').toLowerCase().includes('low')).length;
  const modRiskCount = athletes.filter((a) => (a.risk_level || '').toLowerCase().includes('mod')).length;
  const highRiskCount = athletes.filter((a) => (a.risk_level || '').toLowerCase().includes('high')).length;
  const critRiskCount = athletes.filter((a) => (a.risk_level || '').toLowerCase().includes('crit')).length;

  const getBadgeClass = (riskLevel) => {
    const l = (riskLevel || '').toLowerCase();
    if (l.includes('low')) return 'badge-low';
    if (l.includes('mod')) return 'badge-moderate';
    if (l.includes('high')) return 'badge-high';
    return 'badge-critical';
  };

  const filteredAthletes = athletes.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.sport_type.toLowerCase().includes(search.toLowerCase());
    const matchesSport = sportFilter === 'All' || a.sport_type.toLowerCase().includes(sportFilter.toLowerCase());
    return matchesSearch && matchesSport;
  });

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Coach Dashboard</h1>
          <p className="page-subtitle">Real-time team risk monitoring & dynamic registered athlete roster.</p>
        </div>
        <button onClick={fetchAthletes} className="btn btn-secondary">
          <RefreshCw size={16} />
          <span>Refresh Roster</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>Total Athletes</span>
            <Users size={20} color="#15803D" />
          </div>
          <div style={styles.cardVal}>{total}</div>
          <span style={styles.cardSub}>Registered in database</span>
        </div>

        <div className="card">
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>Low Risk</span>
            <CheckCircle size={20} color="#15803D" />
          </div>
          <div style={{ ...styles.cardVal, color: '#15803D' }}>{lowRiskCount}</div>
          <span style={styles.cardSub}>Optimal biomechanics</span>
        </div>

        <div className="card">
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>Moderate Risk</span>
            <ShieldAlert size={20} color="#A16207" />
          </div>
          <div style={{ ...styles.cardVal, color: '#A16207' }}>{modRiskCount}</div>
          <span style={styles.cardSub}>Requires monitoring</span>
        </div>

        <div className="card">
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>High / Critical Risk</span>
            <ShieldAlert size={20} color="#C2410C" />
          </div>
          <div style={{ ...styles.cardVal, color: '#C2410C' }}>{highRiskCount + critRiskCount}</div>
          <span style={styles.cardSub}>Requires corrective intervention</span>
        </div>
      </div>

      {/* Roster Controls */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, backgroundColor: '#F8FAF9', padding: '0.5rem 0.85rem', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
            <Search size={18} color="#9CA3AF" />
            <input
              type="text"
              placeholder="Search athlete by name or sport..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.9rem' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={16} color="#6B7280" />
            <select className="form-select" value={sportFilter} onChange={handleFilterChange} style={{ width: '180px' }}>
              <option value="All">All Sports</option>
              <option value="Cricket">Cricket</option>
              <option value="Football">Football</option>
              <option value="Athletics">Athletics</option>
              <option value="Badminton">Badminton</option>
              <option value="Basketball">Basketball</option>
              <option value="Tennis">Tennis</option>
              <option value="Volleyball">Volleyball</option>
              <option value="Running">Running</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dynamic Registered Athletes Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 className="card-title" style={{ margin: 0 }}>
            Registered Athlete Roster ({filteredAthletes.length})
          </h3>
          <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>
            Newly registered athletes appear here automatically from MongoDB
          </span>
        </div>

        {loading ? (
          <div className="state-box">
            <div className="spinner" />
            <p>Loading registered athletes from database...</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Athlete Name</th>
                  <th>Sport & Position</th>
                  <th>Injury History</th>
                  <th>Training Load</th>
                  <th>Injury Risk</th>
                  <th>Movement Quality</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAthletes.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                      No registered athletes found. Newly registered users will appear here automatically.
                    </td>
                  </tr>
                ) : (
                  filteredAthletes.map((ath) => (
                    <tr key={ath.id}>
                      <td>
                        <div>
                          <strong style={{ color: '#1F2937' }}>{ath.name}</strong>
                          <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>ID: {ath.id.substring(0, 8)}...</div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: '600' }}>{ath.sport_type}</span>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{ath.position}</div>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: '#4B5563' }}>{ath.injury_history || 'None'}</td>
                      <td>
                        <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#374151' }}>
                          {ath.training_load}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          <span className={`badge ${getBadgeClass(ath.risk_level)}`}>
                            {ath.risk_level}
                          </span>
                          <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#1F2937' }}>
                            {ath.recent_risk_score} / 100
                          </span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: '700', color: '#15803D' }}>
                          {ath.movement_quality_score}%
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => setSelectedAthlete(ath)}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                          >
                            <Eye size={14} />
                            <span>Details</span>
                          </button>
                          <button
                            onClick={() => navigate('/analysis')}
                            className="btn btn-outline"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                          >
                            <Video size={14} />
                            <span>Analyze</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Athlete Detail Modal */}
      {selectedAthlete && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontWeight: '800', color: '#1F2937' }}>
                Athlete Intelligence Profile: {selectedAthlete.name}
              </h3>
              <button onClick={() => setSelectedAthlete(null)} style={styles.closeBtn}>
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>
              <div className="grid-2" style={{ marginBottom: '1rem' }}>
                <div>
                  <p><strong>Sport:</strong> {selectedAthlete.sport_type} ({selectedAthlete.position})</p>
                  <p><strong>Age / Physicals:</strong> {selectedAthlete.age} yrs | {selectedAthlete.height} cm | {selectedAthlete.weight} kg</p>
                  <p><strong>Injury History:</strong> {selectedAthlete.injury_history}</p>
                </div>
                <div>
                  <p><strong>Training Load:</strong> {selectedAthlete.training_load}</p>
                  <p><strong>Latest Risk Score:</strong> {selectedAthlete.recent_risk_score} / 100 ({selectedAthlete.risk_level})</p>
                  <p><strong>Movement Quality:</strong> {selectedAthlete.movement_quality_score}%</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button
                  onClick={() => { setSelectedAthlete(null); navigate('/analysis'); }}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  <Video size={16} />
                  <span>Run Video Biomechanics Analysis</span>
                </button>
                <button onClick={() => setSelectedAthlete(null)} className="btn btn-secondary">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
  cardTitle: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#6B7280',
  },
  cardVal: {
    fontSize: '1.8rem',
    fontWeight: '800',
    color: '#1F2937',
  },
  cardSub: {
    fontSize: '0.72rem',
    color: '#9CA3AF',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '560px',
    overflow: 'hidden',
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
  },
  modalHeader: {
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid #E5E7EB',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.2rem',
    cursor: 'pointer',
    color: '#6B7280',
  },
  modalBody: {
    padding: '1.5rem',
    fontSize: '0.9rem',
    color: '#374151',
    lineHeight: 1.6,
  },
};

export default CoachDashboard;
