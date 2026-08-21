import React from 'react';
import { User, ShieldCheck, Mail, Phone, Calendar } from 'lucide-react';

const Profile = ({ user }) => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">User Account Profile</h1>
        <p className="page-subtitle">Your personal account details, role permissions, and platform settings.</p>
      </div>

      <div className="card" style={{ maxWidth: '600px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={styles.avatar}>{(user?.full_name || 'A')[0].toUpperCase()}</div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#1F2937' }}>{user?.full_name}</h2>
            <span className="badge badge-low" style={{ textTransform: 'capitalize' }}>{user?.role} Role</span>
          </div>
        </div>

        <div style={styles.infoList}>
          <div style={styles.infoItem}>
            <Mail size={18} color="#15803D" />
            <div>
              <span style={styles.label}>Email Address</span>
              <div style={styles.val}>{user?.email}</div>
            </div>
          </div>

          <div style={styles.infoItem}>
            <ShieldCheck size={18} color="#15803D" />
            <div>
              <span style={styles.label}>Platform User ID</span>
              <div style={styles.val}>{user?.id}</div>
            </div>
          </div>

          <div style={styles.infoItem}>
            <Calendar size={18} color="#15803D" />
            <div>
              <span style={styles.label}>Account Registration Date</span>
              <div style={styles.val}>{new Date(user?.created_at || Date.now()).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  avatar: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: '#15803D',
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: '1.8rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  infoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.85rem',
    backgroundColor: '#F8FAF9',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
  },
  label: {
    fontSize: '0.75rem',
    color: '#6B7280',
    fontWeight: '600',
  },
  val: {
    fontSize: '0.9rem',
    fontWeight: '700',
    color: '#1F2937',
  },
};

export default Profile;
