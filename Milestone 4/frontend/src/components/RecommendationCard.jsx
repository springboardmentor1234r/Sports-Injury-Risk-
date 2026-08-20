import React from 'react';
import { Activity, Clock, Target, AlertCircle, CheckCircle2, Clock3 } from 'lucide-react';
import { recommendationAPI } from '../services/api';

const RecommendationCard = ({ recommendation, onStatusChange }) => {
  const { id, category, title, description, priority, target_area, frequency, reason, status } = recommendation;

  const handleToggle = async (newStatus) => {
    try {
      await recommendationAPI.updateStatus(id, newStatus);
      if (onStatusChange) onStatusChange();
    } catch (err) {
      console.error('Error updating recommendation status:', err);
    }
  };

  const getPrioBadge = (prio) => {
    const p = (prio || 'Medium').toLowerCase();
    if (p === 'critical' || p === 'high') return 'badge-critical';
    if (p === 'medium') return 'badge-moderate';
    return 'badge-low';
  };

  const getStatusBadge = (st) => {
    if (st === 'Completed') return { bg: '#DCFCE7', text: '#15803D', icon: CheckCircle2 };
    if (st === 'In Progress') return { bg: '#FEF9C3', text: '#A16207', icon: Clock3 };
    return { bg: '#F3F4F6', text: '#4B5563', icon: Clock };
  };

  const statusInfo = getStatusBadge(status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="card" style={styles.card}>
      <div style={styles.topRow}>
        <div style={styles.categoryBadge}>{category}</div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <span className={`badge ${getPrioBadge(priority)}`}>{priority} Priority</span>
          <span style={{ ...styles.statusTag, backgroundColor: statusInfo.bg, color: statusInfo.text }}>
            <StatusIcon size={12} />
            <span>{status}</span>
          </span>
        </div>
      </div>

      <h4 style={styles.title}>{title}</h4>
      <p style={styles.desc}>{description}</p>

      <div style={styles.detailsGrid}>
        <div style={styles.detailItem}>
          <Target size={14} color="#15803D" />
          <span><strong>Target Area:</strong> {target_area}</span>
        </div>
        <div style={styles.detailItem}>
          <Clock size={14} color="#15803D" />
          <span><strong>Frequency:</strong> {frequency}</span>
        </div>
      </div>

      <div style={styles.reasonBox}>
        <AlertCircle size={14} color="#A16207" />
        <span><strong>AI Trigger:</strong> {reason}</span>
      </div>

      <div style={styles.actionRow}>
        <button
          onClick={() => handleToggle('In Progress')}
          disabled={status === 'In Progress'}
          style={{
            ...styles.actionBtn,
            backgroundColor: status === 'In Progress' ? '#FEF9C3' : '#FFFFFF',
            borderColor: '#E5E7EB',
          }}
        >
          In Progress
        </button>
        <button
          onClick={() => handleToggle('Completed')}
          disabled={status === 'Completed'}
          style={{
            ...styles.actionBtn,
            backgroundColor: status === 'Completed' ? '#15803D' : '#FFFFFF',
            color: status === 'Completed' ? '#FFFFFF' : '#15803D',
            borderColor: '#15803D',
          }}
        >
          Mark Completed
        </button>
      </div>
    </div>
  );
};

const styles = {
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    fontSize: '0.75rem',
    fontWeight: '800',
    color: '#15803D',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  statusTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.2rem 0.6rem',
    borderRadius: '9999px',
    fontSize: '0.72rem',
    fontWeight: '700',
  },
  title: {
    fontSize: '1rem',
    fontWeight: '800',
    color: '#1F2937',
  },
  desc: {
    fontSize: '0.85rem',
    color: '#4B5563',
    lineHeight: 1.4,
  },
  detailsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
    fontSize: '0.8rem',
    color: '#374151',
    backgroundColor: '#F8FAF9',
    padding: '0.65rem 0.85rem',
    borderRadius: '6px',
  },
  detailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  reasonBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.78rem',
    color: '#854D0E',
    backgroundColor: '#FEFCE8',
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid #FEF08A',
  },
  actionRow: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.25rem',
  },
  actionBtn: {
    flex: 1,
    padding: '0.45rem',
    fontSize: '0.78rem',
    fontWeight: '700',
    borderRadius: '6px',
    border: '1px solid #E5E7EB',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
};

export default RecommendationCard;
