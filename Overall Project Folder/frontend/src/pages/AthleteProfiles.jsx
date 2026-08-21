import React, { useState, useEffect } from 'react';
import { Users, Search, Eye, Video } from 'lucide-react';
import { athleteAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

const AthleteProfiles = ({ user }) => {
  const navigate = useNavigate();
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAthletes();
  }, []);

  const fetchAthletes = async () => {
    setLoading(true);
    try {
      const res = await athleteAPI.getAll();
      setAthletes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = athletes.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.sport_type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Athlete Profiles & Roster</h1>
          <p className="page-subtitle">View physical details, sport profiles, and biomechanical health metrics.</p>
        </div>
        <input
          type="text"
          placeholder="Search athlete by name or sport..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input"
          style={{ width: '280px' }}
        />
      </div>

      {loading ? (
        <div className="state-box">
          <div className="spinner" />
          <p>Loading athlete profiles...</p>
        </div>
      ) : (
        <div className="grid-3">
          {filtered.map((ath) => (
            <div key={ath.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={styles.avatar}>{(ath.name || 'A')[0]}</div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1F2937' }}>{ath.name}</h3>
                  <span style={{ fontSize: '0.8rem', color: '#15803D', fontWeight: '700' }}>
                    {ath.sport_type} ({ath.position})
                  </span>
                </div>
              </div>

              <div style={styles.infoGrid}>
                <div><strong>Age / Physicals:</strong> {ath.age} yrs | {ath.height} cm | {ath.weight} kg</div>
                <div><strong>Injury History:</strong> {ath.injury_history || 'None'}</div>
                <div><strong>Training Load:</strong> {ath.training_load}</div>
                <div><strong>Risk Score:</strong> {ath.recent_risk_score} / 100 ({ath.risk_level})</div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  onClick={() => navigate('/analysis')}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem' }}
                >
                  <Video size={14} />
                  <span>Analyze Video</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  avatar: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    backgroundColor: '#15803D',
    color: '#FFFFFF',
    fontWeight: '800',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.1rem',
  },
  infoGrid: {
    fontSize: '0.82rem',
    color: '#4B5563',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
    backgroundColor: '#F8FAF9',
    padding: '0.65rem',
    borderRadius: '8px',
  },
};

export default AthleteProfiles;
