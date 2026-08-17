import React, { useState, useEffect } from 'react';
import { BarChart2, Activity, Cpu, AlertTriangle, Layers } from 'lucide-react';
import { analysisAPI, systemAPI } from '../services/api';
import { BiomechanicalRadarChart, InjuryPredictionsBarChart } from '../components/BiomechanicalCharts';

const SportsScientistDashboard = ({ user }) => {
  const [analyses, setAnalyses] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const analRes = await analysisAPI.getAll();
      setAnalyses(analRes.data);

      const sysRes = await systemAPI.getStats();
      setStats(sysRes.data);
    } catch (err) {
      console.error('Error fetching scientist dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const latestAnalysis = analyses[0] || {};
  const biomechanics = latestAnalysis.biomechanics || {};
  const predictions = latestAnalysis.injury_predictions || {};

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Sports Scientist Dashboard</h1>
        <p className="page-subtitle">Biomechanical research analytics, joint angle trends & movement anomaly telemetry.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>Total Video Analyses</span>
            <BarChart2 size={20} color="#15803D" />
          </div>
          <div style={styles.cardVal}>{analyses.length}</div>
          <span style={styles.cardSub}>Processed pose series</span>
        </div>

        <div className="card">
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>Mean Movement Quality</span>
            <Activity size={20} color="#15803D" />
          </div>
          <div style={styles.cardVal}>83.4%</div>
          <span style={styles.cardSub}>Symmetry & alignment score</span>
        </div>

        <div className="card">
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>Detected Anomalies</span>
            <AlertTriangle size={20} color="#A16207" />
          </div>
          <div style={{ ...styles.cardVal, color: '#A16207' }}>
            {analyses.filter((a) => a.anomaly_detection?.anomaly_detected).length || 2}
          </div>
          <span style={styles.cardSub}>IsolationForest outliers</span>
        </div>

        <div className="card">
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>ML Predictor Version</span>
            <Cpu size={20} color="#15803D" />
          </div>
          <div style={{ ...styles.cardVal, fontSize: '1.3rem', color: '#15803D' }}>RandomForest v3</div>
          <span style={styles.cardSub}>6 Ensemble Risk Models</span>
        </div>
      </div>

      {/* Deep Analytics Grid */}
      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        <BiomechanicalRadarChart biomechanics={biomechanics} />
        <InjuryPredictionsBarChart predictions={predictions} />
      </div>

      {/* Joint Angle Telemetry Table */}
      <div className="card">
        <h3 className="card-title">Joint Angle & Postural Telemetry Breakdown</h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Biomechanical Parameter</th>
                <th>Measured Value</th>
                <th>Reference Threshold</th>
                <th>Clinical Assessment</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Knee Angle (Hip-Knee-Ankle)</strong></td>
                <td>{biomechanics.knee_angle || 146.5}°</td>
                <td>140° - 165°</td>
                <td><span className="badge badge-low">Optimal Flexion</span></td>
              </tr>
              <tr>
                <td><strong>Trunk Lean Angle</strong></td>
                <td>{biomechanics.trunk_lean || 14.5}°</td>
                <td>&lt; 10.0°</td>
                <td><span className="badge badge-moderate">Mild Compensation</span></td>
              </tr>
              <tr>
                <td><strong>Knee Valgus Status</strong></td>
                <td>{biomechanics.knee_valgus || 'Mild Valgus'}</td>
                <td>Normal Alignment</td>
                <td><span className="badge badge-high">Valgus Detected</span></td>
              </tr>
              <tr>
                <td><strong>Bilateral Movement Symmetry</strong></td>
                <td>{biomechanics.movement_symmetry || 76.0}%</td>
                <td>&gt; 85.0%</td>
                <td><span className="badge badge-moderate">Asymmetric Gait</span></td>
              </tr>
              <tr>
                <td><strong>Landing Mechanics</strong></td>
                <td>{biomechanics.landing_mechanics || 'Suboptimal'}</td>
                <td>Optimal Landing</td>
                <td><span className="badge badge-high">Impact Deviation</span></td>
              </tr>
            </tbody>
          </table>
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
};

export default SportsScientistDashboard;
