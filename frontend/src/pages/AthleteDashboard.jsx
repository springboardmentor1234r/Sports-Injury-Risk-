import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, Video, CheckCircle, HeartPulse, ArrowUpRight } from 'lucide-react';
import { athleteAPI, analysisAPI, recommendationAPI } from '../services/api';
import RiskScoreCard from '../components/RiskScoreCard';
import { BiomechanicalRadarChart, RiskTrendLineChart } from '../components/BiomechanicalCharts';
import AnalysisHistoryTable from '../components/AnalysisHistoryTable';
import RecommendationCard from '../components/RecommendationCard';

const AthleteDashboard = ({ user }) => {
  const [profile, setProfile] = useState(null);
  const [analyses, setAnalyses] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAthleteData();
  }, []);

  const fetchAthleteData = async () => {
    setLoading(true);
    try {
      // Fetch personal profile
      const profRes = await athleteAPI.getMyProfile();
      setProfile(profRes.data);

      // Fetch personal analyses
      const analRes = await analysisAPI.getAll();
      setAnalyses(analRes.data);

      // Fetch personal recommendations
      const recRes = await recommendationAPI.getAll();
      setRecommendations(recRes.data.slice(0, 3));
    } catch (err) {
      console.error('Error fetching athlete dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container state-box">
        <div className="spinner" />
        <p>Loading your biomechanics & injury risk overview...</p>
      </div>
    );
  }

  const riskScore = profile?.recent_risk_score || 37.0;
  const riskLevel = profile?.risk_level || 'Moderate Risk';

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Athlete Dashboard</h1>
        <p className="page-subtitle">Welcome back, {user?.full_name || 'Athlete'}. Here is your biomechanics & injury risk intelligence overview.</p>
      </div>

      {/* Top Summary Metric Cards */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        <div className="card" style={styles.metricCard}>
          <div style={styles.metricHeader}>
            <span style={styles.metricTitle}>Overall Health</span>
            <div style={styles.iconBadge}><HeartPulse size={20} color="#15803D" /></div>
          </div>
          <div style={styles.metricVal}>{profile?.overall_health_score || 85.0} / 100</div>
          <span style={styles.metricSub}>Musculoskeletal health index</span>
        </div>

        <div className="card" style={styles.metricCard}>
          <div style={styles.metricHeader}>
            <span style={styles.metricTitle}>Injury Risk Score</span>
            <div style={{ ...styles.iconBadge, backgroundColor: riskScore > 50 ? '#FFEDD5' : '#DCFCE7' }}>
              <ShieldAlert size={20} color={riskScore > 50 ? '#C2410C' : '#15803D'} />
            </div>
          </div>
          <div style={{ ...styles.metricVal, color: riskScore > 50 ? '#C2410C' : '#15803D' }}>
            {riskScore} ({riskLevel})
          </div>
          <span style={styles.metricSub}>35/20/20/15/10 weighted formula</span>
        </div>

        <div className="card" style={styles.metricCard}>
          <div style={styles.metricHeader}>
            <span style={styles.metricTitle}>Sessions Analyzed</span>
            <div style={styles.iconBadge}><Video size={20} color="#15803D" /></div>
          </div>
          <div style={styles.metricVal}>{profile?.sessions_analyzed || analyses.length || 3}</div>
          <span style={styles.metricSub}>Video biomechanics runs</span>
        </div>

        <div className="card" style={styles.metricCard}>
          <div style={styles.metricHeader}>
            <span style={styles.metricTitle}>Biomechanical Efficiency</span>
            <div style={styles.iconBadge}><Activity size={20} color="#15803D" /></div>
          </div>
          <div style={styles.metricVal}>{profile?.movement_quality_score || 82.0}%</div>
          <span style={styles.metricSub}>Movement symmetry & quality</span>
        </div>
      </div>

      {/* Main Charts & Risk Meter Grid */}
      <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
        <RiskScoreCard score={riskScore} riskLevel={riskLevel} />
        <BiomechanicalRadarChart biomechanics={analyses[0]?.biomechanics} />
        <RiskTrendLineChart historyData={analyses.map((a, idx) => ({ session: `S${idx + 1}`, risk: a.overall_risk_score }))} />
      </div>

      {/* Recent Video Analyses Section */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={styles.sectionHeader}>
          <h3 className="card-title" style={{ margin: 0 }}>Recent Video Analyses</h3>
          <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>Your recent movement tracking & AI pose runs</span>
        </div>
        <AnalysisHistoryTable analyses={analyses.slice(0, 5)} />
      </div>

      {/* Latest AI Recommendations Section */}
      <div className="card">
        <div style={styles.sectionHeader}>
          <h3 className="card-title" style={{ margin: 0 }}>Latest AI Recommendations</h3>
          <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>Automated corrective exercises & rehabilitation insights</span>
        </div>
        {recommendations.length === 0 ? (
          <p style={{ color: '#6B7280', fontSize: '0.875rem', padding: '1rem 0' }}>No pending recommendations. Upload a video for AI feedback.</p>
        ) : (
          <div className="grid-3">
            {recommendations.map((rec) => (
              <RecommendationCard key={rec.id} recommendation={rec} onStatusChange={fetchAthleteData} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  metricCard: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  metricHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
  metricTitle: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#6B7280',
  },
  iconBadge: {
    width: '36px',
    height: '36px',
    backgroundColor: '#DCFCE7',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricVal: {
    fontSize: '1.6rem',
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: '0.25rem',
  },
  metricSub: {
    fontSize: '0.72rem',
    color: '#9CA3AF',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
};

export default AthleteDashboard;
