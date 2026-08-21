import React from 'react';
import { Shield, AlertTriangle, CheckCircle, Info } from 'lucide-react';

const RiskScoreCard = ({ score = 37.0, riskLevel = 'Moderate Risk', title = 'Overall Injury Risk' }) => {
  const getBadgeClass = () => {
    const lvl = riskLevel.toLowerCase();
    if (lvl.includes('low')) return 'badge-low';
    if (lvl.includes('mod')) return 'badge-moderate';
    if (lvl.includes('high')) return 'badge-high';
    return 'badge-critical';
  };

  const getScoreColor = () => {
    if (score <= 25) return '#15803D';
    if (score <= 50) return '#A16207';
    if (score <= 75) return '#C2410C';
    return '#B91C1C';
  };

  const color = getScoreColor();
  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="card" style={styles.cardContainer}>
      <div style={styles.cardHeader}>
        <span style={styles.headerTitle}>{title}</span>
        <span className={`badge ${getBadgeClass()}`}>{riskLevel}</span>
      </div>

      <div style={styles.gaugeWrapper}>
        <svg width="120" height="120" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="10"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>

        <div style={styles.scoreOverlay}>
          <span style={{ ...styles.scoreNum, color }}>{score}</span>
          <span style={styles.scoreMax}>/ 100</span>
        </div>
      </div>

      <div style={styles.scaleContainer}>
        <div style={styles.scaleLabels}>
          <span>0 (Optimal)</span>
          <span>50</span>
          <span>100 (Critical)</span>
        </div>
        <div style={styles.scaleBar}>
          <div style={{ ...styles.marker, left: `${score}%`, backgroundColor: color }} />
        </div>
      </div>
    </div>
  );
};

const styles = {
  cardContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  cardHeader: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  headerTitle: {
    fontWeight: '700',
    fontSize: '1rem',
    color: '#1F2937',
  },
  gaugeWrapper: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0.5rem 0',
  },
  scoreOverlay: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  scoreNum: {
    fontSize: '2rem',
    fontWeight: '800',
    lineHeight: 1,
  },
  scoreMax: {
    fontSize: '0.72rem',
    color: '#6B7280',
    fontWeight: '600',
  },
  scaleContainer: {
    width: '100%',
    marginTop: '1rem',
  },
  scaleLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.7rem',
    color: '#6B7280',
    marginBottom: '0.25rem',
    fontWeight: '600',
  },
  scaleBar: {
    height: '6px',
    backgroundColor: '#E5E7EB',
    borderRadius: '9999px',
    position: 'relative',
    background: 'linear-gradient(to right, #15803D, #FACC15, #FB923C, #EF4444)',
  },
  marker: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    border: '2px solid #FFFFFF',
    position: 'absolute',
    top: '-2px',
    transform: 'translateX(-50%)',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  },
};

export default RiskScoreCard;
