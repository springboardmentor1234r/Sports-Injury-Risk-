import React, { useState, useEffect } from 'react';
import { Bell, Check, Info, AlertTriangle, AlertOctagon } from 'lucide-react';
import { notificationAPI } from '../services/api';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifs();
  }, []);

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const res = await notificationAPI.getAll();
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      fetchNotifs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      fetchNotifs();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Notification Inbox</h1>
          <p className="page-subtitle">Real-time alerts for high injury risks, video analysis completions & training load warnings.</p>
        </div>
        <button onClick={handleMarkAllRead} className="btn btn-secondary">
          <Check size={16} />
          <span>Mark All Read</span>
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="state-box">
            <div className="spinner" />
            <p>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="state-box">
            <Bell size={40} color="#9CA3AF" />
            <p style={{ marginTop: '0.75rem' }}>No notifications found.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {notifications.map((n) => (
              <div
                key={n.id}
                style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                  backgroundColor: n.is_read ? '#FFFFFF' : '#F0FDF4',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#1F2937' }}>{n.title}</h4>
                  <p style={{ fontSize: '0.85rem', color: '#4B5563', margin: '0.25rem 0' }}>{n.message}</p>
                  <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{new Date(n.created_at).toLocaleString()}</span>
                </div>
                {!n.is_read && (
                  <button onClick={() => handleMarkRead(n.id)} className="btn btn-secondary" style={{ fontSize: '0.75rem' }}>
                    Mark Read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
