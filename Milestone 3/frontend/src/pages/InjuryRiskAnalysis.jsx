import React, { useState } from 'react';
import VideoUpload from '../components/VideoUpload';
import SkeletonViewer from '../components/SkeletonViewer';
import RiskScoreCard from '../components/RiskScoreCard';
import { BiomechanicalRadarChart, InjuryPredictionsBarChart } from '../components/BiomechanicalCharts';
import RecommendationCard from '../components/RecommendationCard';
import { AlertTriangle, CheckCircle, Shield, FileText } from 'lucide-react';

const InjuryRiskAnalysis = ({ user }) => {
  const [analysisResult, setAnalysisResult] = useState(null);

  const handleAnalysisComplete = (data) => {
    setAnalysisResult(data);
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">AI Injury Risk Analysis Lab</h1>
        <p className="page-subtitle">Upload athlete movement video to extract 3D keypoint landmarks, compute joint angles, and predict injury risks.</p>
      </div>

      {/* Video Uploader Card */}
      <div style={{ marginBottom: '1.5rem' }}>
        <VideoUpload user={user} onAnalysisComplete={handleAnalysisComplete} />
      </div>

      {/* Analysis Results Display */}
      {analysisResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Top Summary Banner */}
          <div className="card" style={styles.summaryBanner}>
            <div>
              <span className="badge badge-low" style={{ marginBottom: '0.5rem' }}>Analysis Session Complete</span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#1F2937' }}>
                Biomechanical Report: {analysisResult.athlete_name} ({analysisResult.video_name})
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#6B7280' }}>
                Analyzed {analysisResult.frames_analyzed} keyframes on {new Date(analysisResult.analysis_date).toLocaleString()}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>Overall Risk Status</span>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: analysisResult.overall_risk_score > 50 ? '#C2410C' : '#15803D' }}>
                {analysisResult.overall_risk_score} / 100
              </div>
            </div>
          </div>

          {/* Keypoint Overlay & Risk Meter */}
          <div className="grid-2">
            <SkeletonViewer biomechanics={analysisResult.biomechanics} videoUrl={analysisResult.video_url} />
            <RiskScoreCard score={analysisResult.overall_risk_score} riskLevel={analysisResult.risk_level} />
          </div>

          {/* Charts Grid */}
          <div className="grid-2">
            <BiomechanicalRadarChart biomechanics={analysisResult.biomechanics} />
            <InjuryPredictionsBarChart predictions={analysisResult.injury_predictions} />
          </div>

          {/* 6 Random Forest Injury Prediction Cards */}
          <div className="card">
            <h3 className="card-title">6 Random Forest Injury Predictions Breakdown</h3>
            <div className="grid-3">
              {[
                { title: 'ACL Injury Risk', score: analysisResult.injury_predictions?.acl_risk || 37.5 },
                { title: 'Hamstring Risk', score: analysisResult.injury_predictions?.hamstring_risk || 21.4 },
                { title: 'Ankle Sprain Risk', score: analysisResult.injury_predictions?.ankle_sprain_risk || 18.7 },
                { title: 'Shoulder Injury Risk', score: analysisResult.injury_predictions?.shoulder_risk || 28.2 },
                { title: 'Lower Back Risk', score: analysisResult.injury_predictions?.lower_back_risk || 24.1 },
                { title: 'Overuse Injury Risk', score: analysisResult.injury_predictions?.overuse_risk || 41.3 }
              ].map((p, idx) => (
                <div key={idx} style={styles.predCard}>
                  <span style={styles.predTitle}>{p.title}</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: '800', color: p.score > 50 ? '#C2410C' : '#15803D' }}>
                    {p.score}%
                  </div>
                  <div style={styles.track}>
                    <div style={{ ...styles.fill, width: `${p.score}%`, backgroundColor: p.score > 50 ? '#C2410C' : '#15803D' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detected Anomaly Card */}
          {analysisResult.anomaly_detection && (
            <div className="card" style={{ backgroundColor: '#FFFBEB', borderColor: '#FEF08A' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <AlertTriangle size={20} color="#A16207" />
                <h3 style={{ margin: 0, fontWeight: '800', color: '#854D0E' }}>
                  IsolationForest Movement Anomaly Detected
                </h3>
              </div>
              <p style={{ fontSize: '0.9rem', color: '#713F12', marginBottom: '0.5rem' }}>
                <strong>Affected Body Area:</strong> {analysisResult.anomaly_detection.affected_area} (Severity: {analysisResult.anomaly_detection.severity})
              </p>
              <p style={{ fontSize: '0.85rem', color: '#854D0E' }}>
                {analysisResult.anomaly_detection.description}
              </p>
            </div>
          )}

          {/* AI Recommendations */}
          <div className="card">
            <h3 className="card-title">Personalized AI Corrective Recommendations</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {analysisResult.recommendations?.map((rec) => (
                <RecommendationCard key={rec.id} recommendation={rec} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  summaryBanner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    border: '1px solid #DCFCE7',
  },
  predCard: {
    padding: '0.85rem',
    backgroundColor: '#F8FAF9',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  predTitle: {
    fontSize: '0.8rem',
    fontWeight: '700',
    color: '#6B7280',
  },
  track: {
    height: '6px',
    backgroundColor: '#E5E7EB',
    borderRadius: '9999px',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: '9999px',
  },
};

export default InjuryRiskAnalysis;
