import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Users, 
  Video, 
  FileText, 
  CheckCircle, 
  Bell, 
  User, 
  Settings, 
  LogOut,
  Shield,
  BarChart2,
  HeartPulse
} from 'lucide-react';

const Sidebar = ({ user }) => {
  const navigate = useNavigate();
  const role = (user?.role || 'athlete').toLowerCase();

  const handleLogout = () => {
    localStorage.removeItem('athletiq_token');
    localStorage.removeItem('athletiq_user');
    navigate('/login');
  };

  // Role-specific navigation items
  const getNavItems = () => {
    switch (role) {
      case 'athlete':
        return [
          { label: 'Dashboard', path: '/athlete/dashboard', icon: Activity },
          { label: 'Injury Risk Analysis', path: '/analysis', icon: Video },
          { label: 'Analysis History', path: '/history', icon: FileText },
          { label: 'AI Recommendations', path: '/recommendations', icon: CheckCircle },
          { label: 'Reports', path: '/reports', icon: BarChart2 },
          { label: 'Profile', path: '/profile', icon: User },
          { label: 'Settings', path: '/settings', icon: Settings },
        ];
      case 'coach':
        return [
          { label: 'Dashboard', path: '/coach/dashboard', icon: Activity },
          { label: 'Athletes & Profiles', path: '/athletes', icon: Users },
          { label: 'Injury Risk Analysis', path: '/analysis', icon: Video },
          { label: 'Analysis History', path: '/history', icon: FileText },
          { label: 'Recommendations', path: '/recommendations', icon: CheckCircle },
          { label: 'Reports', path: '/reports', icon: BarChart2 },
          { label: 'Notifications', path: '/notifications', icon: Bell },
          { label: 'Profile', path: '/profile', icon: User },
          { label: 'Settings', path: '/settings', icon: Settings },
        ];
      case 'physiotherapist':
        return [
          { label: 'Dashboard', path: '/physiotherapist/dashboard', icon: HeartPulse },
          { label: 'Athletes', path: '/athletes', icon: Users },
          { label: 'Movement Analysis', path: '/analysis', icon: Video },
          { label: 'Rehabilitation Plans', path: '/recommendations', icon: CheckCircle },
          { label: 'Analysis History', path: '/history', icon: FileText },
          { label: 'Reports', path: '/reports', icon: BarChart2 },
          { label: 'Notifications', path: '/notifications', icon: Bell },
          { label: 'Profile', path: '/profile', icon: User },
          { label: 'Settings', path: '/settings', icon: Settings },
        ];
      case 'scientist':
        return [
          { label: 'Dashboard', path: '/scientist/dashboard', icon: BarChart2 },
          { label: 'Biomechanical Lab', path: '/analysis', icon: Video },
          { label: 'Athlete Analytics', path: '/athletes', icon: Users },
          { label: 'Analysis History', path: '/history', icon: FileText },
          { label: 'Research Reports', path: '/reports', icon: FileText },
          { label: 'Profile', path: '/profile', icon: User },
          { label: 'Settings', path: '/settings', icon: Settings },
        ];
      case 'admin':
        return [
          { label: 'Dashboard', path: '/admin/dashboard', icon: Shield },
          { label: 'User Management', path: '/admin/dashboard', icon: Users },
          { label: 'Athlete Profiles', path: '/athletes', icon: Activity },
          { label: 'System Monitoring', path: '/analysis', icon: Video },
          { label: 'Analysis Records', path: '/history', icon: FileText },
          { label: 'Reports', path: '/reports', icon: FileText },
          { label: 'Settings', path: '/settings', icon: Settings },
        ];
      default:
        return [
          { label: 'Dashboard', path: '/athlete/dashboard', icon: Activity },
          { label: 'Injury Risk Analysis', path: '/analysis', icon: Video },
          { label: 'Analysis History', path: '/history', icon: FileText },
          { label: 'Profile', path: '/profile', icon: User },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <aside style={styles.sidebar}>
      {/* Brand Header */}
      <div style={styles.brandContainer}>
        <div style={styles.logoBadge}>
          <Activity size={24} color="#FFFFFF" />
        </div>
        <div>
          <h1 style={styles.brandTitle}>Athletiq AI</h1>
          <p style={styles.brandTagline}>Injury Intelligence</p>
        </div>
      </div>

      {/* Role Badge */}
      <div style={styles.roleBanner}>
        <span style={styles.roleText}>{user?.role || 'User'} Mode</span>
      </div>

      {/* Navigation Links */}
      <nav style={styles.navMenu}>
        {navItems.map((item, index) => {
          const IconComp = item.icon;
          return (
            <NavLink
              key={index}
              to={item.path}
              style={({ isActive }) => ({
                ...styles.navLink,
                ...(isActive ? styles.activeNavLink : {}),
              })}
            >
              <IconComp size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer & Logout */}
      <div style={styles.sidebarFooter}>
        <div style={styles.userInfo}>
          <div style={styles.avatarCircle}>
            {(user?.full_name || 'A')[0].toUpperCase()}
          </div>
          <div style={styles.userText}>
            <div style={styles.userName}>{user?.full_name || 'User'}</div>
            <div style={styles.userEmail}>{user?.email || 'user@athletiq.ai'}</div>
          </div>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

const styles = {
  sidebar: {
    width: '260px',
    backgroundColor: '#FFFFFF',
    borderRight: '1px solid #E5E7EB',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  brandContainer: {
    padding: '1.5rem 1.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    borderBottom: '1px solid #F3F4F6',
  },
  logoBadge: {
    width: '40px',
    height: '40px',
    backgroundColor: '#15803D',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 10px rgba(21, 128, 61, 0.25)',
  },
  brandTitle: {
    fontSize: '1.25rem',
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: '-0.02em',
    lineHeight: 1.1,
  },
  brandTagline: {
    fontSize: '0.72rem',
    color: '#6B7280',
    fontWeight: '500',
  },
  roleBanner: {
    margin: '1rem 1.25rem 0.5rem 1.25rem',
    padding: '0.35rem 0.75rem',
    backgroundColor: '#DCFCE7',
    borderRadius: '6px',
    display: 'inline-block',
  },
  roleText: {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#15803D',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  navMenu: {
    flex: 1,
    padding: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    overflowY: 'auto',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.7rem 0.85rem',
    borderRadius: '8px',
    color: '#4B5563',
    fontWeight: '500',
    fontSize: '0.9rem',
    transition: 'all 0.15s ease',
  },
  activeNavLink: {
    backgroundColor: '#DCFCE7',
    color: '#15803D',
    fontWeight: '700',
  },
  sidebarFooter: {
    padding: '1rem',
    borderTop: '1px solid #E5E7EB',
    backgroundColor: '#FAFAFA',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
    marginBottom: '0.75rem',
  },
  avatarCircle: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    backgroundColor: '#15803D',
    color: '#FFFFFF',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.9rem',
  },
  userText: {
    overflow: 'hidden',
  },
  userName: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#1F2937',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  userEmail: {
    fontSize: '0.72rem',
    color: '#6B7280',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  logoutBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.5rem',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '6px',
    color: '#EF4444',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
};

export default Sidebar;
