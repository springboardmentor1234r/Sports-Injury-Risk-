import React, { useState, useEffect } from 'react';
import { Bell, Check, Info, AlertTriangle, AlertOctagon } from 'lucide-react';
import { notificationAPI } from '../services/api';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await notificationAPI.getAll();
      setNotifications(res.data);
      const unread = res.data.filter((n) => !n.is_read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (priority) => {
    if (priority === 'Critical') return <AlertOctagon size={16} color="#B91C1C" />;
    if (priority === 'Warning') return <AlertTriangle size={16} color="#C2410C" />;
    return <Info size={16} color="#15803D" />;
  };

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setIsOpen(!isOpen)} style={styles.bellBtn}>
        <Bell size={20} color="#4B5563" />
        {unreadCount > 0 && (
          <span style={styles.badgeCount}>{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div style={styles.dropdown}>
          <div style={styles.header}>
            <span style={styles.title}>Notifications ({notifications.length})</span>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} style={styles.markAllBtn}>
                Mark all read
              </button>
            )}
          </div>

          <div style={styles.list}>
            {notifications.length === 0 ? (
              <div style={styles.empty}>No notifications yet</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  style={{
                    ...styles.item,
                    backgroundColor: n.is_read ? '#FFFFFF' : '#F0FDF4',
                  }}
                >
                  <div style={styles.itemHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {getIcon(n.priority)}
                      <span style={styles.itemTitle}>{n.title}</span>
                    </div>
                    {!n.is_read && (
                      <button onClick={() => handleMarkRead(n.id)} style={styles.checkBtn}>
                        <Check size={14} color="#15803D" />
                      </button>
                    )}
                  </div>
                  <p style={styles.itemMessage}>{n.message}</p>
                  <span style={styles.time}>{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  bellBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    position: 'relative',
    padding: '0.5rem',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCount: {
    position: 'absolute',
    top: '2px',
    right: '2px',
    backgroundColor: '#EF4444',
    color: '#FFFFFF',
    fontSize: '0.65rem',
    fontWeight: '800',
    borderRadius: '9999px',
    padding: '1px 5px',
    lineHeight: 1,
  },
  dropdown: {
    position: 'absolute',
    right: 0,
    top: '40px',
    width: '320px',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
    border: '1px solid #E5E7EB',
    zIndex: 1000,
    overflow: 'hidden',
  },
  header: {
    padding: '0.85rem 1rem',
    borderBottom: '1px solid #E5E7EB',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  title: {
    fontWeight: '700',
    fontSize: '0.9rem',
    color: '#1F2937',
  },
  markAllBtn: {
    background: 'none',
    border: 'none',
    color: '#15803D',
    fontSize: '0.75rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  list: {
    maxHeight: '340px',
    overflowY: 'auto',
  },
  empty: {
    padding: '2rem',
    textAlign: 'center',
    color: '#6B7280',
    fontSize: '0.85rem',
  },
  item: {
    padding: '0.85rem 1rem',
    borderBottom: '1px solid #F3F4F6',
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.25rem',
  },
  itemTitle: {
    fontWeight: '700',
    fontSize: '0.82rem',
    color: '#1F2937',
  },
  itemMessage: {
    fontSize: '0.78rem',
    color: '#4B5563',
    marginBottom: '0.35rem',
  },
  time: {
    fontSize: '0.68rem',
    color: '#9CA3AF',
  },
  checkBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  },
};

export default NotificationBell;
