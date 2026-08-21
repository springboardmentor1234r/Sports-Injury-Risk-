import React from 'react';
import { Search, User, ShieldCheck } from 'lucide-react';
import NotificationBell from './NotificationBell';

const Topbar = ({ user }) => {
  return (
    <header style={styles.topbar}>
      {/* Search Input */}
      <div style={styles.searchContainer}>
        <Search size={18} color="#9CA3AF" />
        <input
          type="text"
          placeholder="Search athletes, videos, risk reports..."
          style={styles.searchInput}
        />
      </div>

      {/* Right Controls */}
      <div style={styles.rightControls}>
        <div style={styles.platformBadge}>
          <ShieldCheck size={14} color="#15803D" />
          <span>Athletiq AI v3.0</span>
        </div>

        <NotificationBell />

        <div style={styles.userCard}>
          <div style={styles.userAvatar}>
            {(user?.full_name || 'A')[0].toUpperCase()}
          </div>
          <div style={styles.userMeta}>
            <span style={styles.userName}>{user?.full_name || 'User'}</span>
            <span style={styles.userRole}>{user?.role || 'Athlete'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

const styles = {
  topbar: {
    height: '64px',
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E5E7EB',
    padding: '0 2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 90,
  },
  searchContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#F8FAF9',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    padding: '0.45rem 0.85rem',
    width: '320px',
  },
  searchInput: {
    border: 'none',
    background: 'transparent',
    outline: 'none',
    width: '100%',
    fontSize: '0.85rem',
    color: '#1F2937',
  },
  rightControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
  },
  platformBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    backgroundColor: '#DCFCE7',
    padding: '0.35rem 0.65rem',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#15803D',
  },
  userCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
    paddingLeft: '0.5rem',
    borderLeft: '1px solid #E5E7EB',
  },
  userAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#15803D',
    color: '#FFFFFF',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.9rem',
  },
  userMeta: {
    display: 'flex',
    flexDirection: 'column',
  },
  userName: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#1F2937',
    lineHeight: 1.1,
  },
  userRole: {
    fontSize: '0.72rem',
    color: '#6B7280',
    textTransform: 'capitalize',
  },
};

export default Topbar;
