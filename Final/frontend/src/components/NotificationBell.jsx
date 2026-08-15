import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, AlertTriangle, Info, CheckCircle2, ShieldAlert } from 'lucide-react';
import './NotificationBell.css';

export default function NotificationBell({ token }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (token) {
      fetchNotifications();
    }
  }, [token]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/notifications/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('sird_token');
        localStorage.removeItem('sird_user');
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (err) {
      console.error("Error loading notifications:", err);
    }
  };


  const markAsRead = async (id) => {
    try {
      await fetch(`http://localhost:8000/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (err) {
      console.error("Error marking notification read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('http://localhost:8000/api/notifications/read-all', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  const getPriorityIcon = (priority, type) => {
    if (priority === 'High' || type === 'High-Risk Alert') {
      return <ShieldAlert size={18} className="icon-high" />;
    } else if (priority === 'Medium' || type === 'Training Load Warning') {
      return <AlertTriangle size={18} className="icon-medium" />;
    } else {
      return <Info size={18} className="icon-low" />;
    }
  };

  return (
    <div className="notification-bell-container">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className={`bell-trigger-btn ${isOpen ? 'active' : ''}`}
        aria-label="View notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="bell-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="bell-overlay" onClick={() => setIsOpen(false)} />
          <div className="notification-drawer animate-scale-in">
            <div className="drawer-header">
              <div className="header-title">
                <h4>In-App Notifications & Alerts</h4>
                <span className="unread-pill">{unreadCount} Unread</span>
              </div>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="mark-all-btn">
                  <CheckCheck size={14} />
                  <span>Mark All Read</span>
                </button>
              )}
            </div>

            <div className="drawer-body">
              {notifications.length === 0 ? (
                <div className="empty-notif-msg">
                  <CheckCircle2 size={32} />
                  <p>All caught up! No active alerts.</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div 
                    key={notif.notification_id || notif._id} 
                    className={`notif-item ${notif.is_read ? 'read' : 'unread'}`}
                    onClick={() => markAsRead(notif.notification_id)}
                  >
                    <div className="notif-icon-col">
                      {getPriorityIcon(notif.priority, notif.type)}
                    </div>
                    <div className="notif-content-col">
                      <div className="notif-top">
                        <span className="notif-title">{notif.title}</span>
                        <span className={`priority-tag tag-${notif.priority?.toLowerCase()}`}>
                          {notif.priority}
                        </span>
                      </div>
                      <p className="notif-message">{notif.message}</p>
                      <span className="notif-type">{notif.type}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
