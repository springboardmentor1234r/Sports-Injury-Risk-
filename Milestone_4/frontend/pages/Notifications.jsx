import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, AlertTriangle, Play } from 'lucide-react';
import { getNotifications, markNotificationRead, evaluateNotifications } from '../services/milestone4Api';
import NotificationCard from '../components/NotificationCard';
import NotificationFilters from '../components/NotificationFilters';
import NotificationBadge from '../components/NotificationBadge';
import ReportLoading from '../components/ReportLoading';

const Notifications = () => {
  const { athleteId } = useParams();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [evalSessionId, setEvalSessionId] = useState('');

  // Filtering states
  const [unreadOnly, setUnreadOnly] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('ALL');

  const navigate = useNavigate();

  const loadNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getNotifications(athleteId, { unread_only: unreadOnly });
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch (err) {
      console.error("Notifications fetch failed:", err);
      const detail = err.response?.data?.detail || "Failed to load notifications.";
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (athleteId) {
      loadNotifications();
    }
  }, [athleteId, unreadOnly]);

  const handleMarkRead = async (notificationId) => {
    try {
      await markNotificationRead(notificationId);
      // Local state update to reflect fast read status change
      setNotifications(prev => prev.map(n => n._id === notificationId ? { ...n, read_status: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Mark read failed:", err);
    }
  };

  const handleEvaluate = async (e) => {
    if (e) e.preventDefault();
    if (!evalSessionId.trim()) return;

    setEvaluating(true);
    setError('');
    try {
      await evaluateNotifications(evalSessionId.trim());
      setEvalSessionId('');
      // Reload notifications list
      loadNotifications();
    } catch (err) {
      console.error("Evaluation failed:", err);
      const detail = err.response?.data?.detail || "Failed to evaluate session metrics.";
      setError(detail);
    } finally {
      setEvaluating(false);
    }
  };

  // Local filtering based on severity
  const getFilteredNotifications = () => {
    if (severityFilter === 'ALL') return notifications;
    return notifications.filter(n => n.severity?.toUpperCase() === severityFilter);
  };

  if (loading || evaluating) {
    return <ReportLoading message={evaluating ? "Evaluating session limits and disptaching warnings..." : "Fetching athlete alerts registry..."} />;
  }

  return (
    <div className="min-h-screen bg-hud-black text-white flex flex-col font-sans">
      
      {/* HEADER BAR */}
      <header className="hud-glass-panel rounded-none border-b border-hud-border px-6 py-4 flex justify-between items-center sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="px-3 py-1.5 border border-hud-border rounded-lg text-xs font-bold bg-hud-dark/30 hover:text-white flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
          <div>
            <h1 className="text-sm font-extrabold tracking-wider text-white uppercase block leading-none">
              Notification Center
            </h1>
            <span className="text-[10px] text-gray-500 block leading-none mt-0.5">
              Warning limits warnings and analysis updates
            </span>
          </div>
        </div>

        <NotificationBadge count={unreadCount} />
      </header>

      {/* WORKSPACE */}
      <main className="flex-1 p-6 md:p-8 space-y-6 max-w-4xl mx-auto w-full">
        
        {/* EVALUATE TRIGGER PANEL */}
        <div className="hud-glass-panel p-5">
          <form onSubmit={handleEvaluate} className="flex flex-col sm:flex-row sm:items-end gap-3 text-xs">
            <div className="flex-1 space-y-1">
              <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold block">
                Evaluate Completed Session Alerts
              </span>
              <input
                type="text"
                placeholder="Enter Session ID to scan (e.g. 60c72b2f9b1d8b2bad034341)"
                value={evalSessionId}
                onChange={(e) => setEvalSessionId(e.target.value)}
                className="input-hud w-full px-3 py-2 bg-hud-dark/30 text-white border border-hud-border rounded text-xs focus:outline-none"
              />
            </div>
            <button 
              type="submit"
              className="px-4 py-2 bg-hud-blue hover:bg-hud-blue/85 font-bold rounded cursor-pointer flex justify-center items-center gap-1.5 whitespace-nowrap text-xs"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Evaluate Session</span>
            </button>
          </form>
        </div>

        {/* FILTERS PANEL */}
        <NotificationFilters 
          unreadOnly={unreadOnly} 
          setUnreadOnly={setUnreadOnly} 
          severityFilter={severityFilter} 
          setSeverityFilter={setSeverityFilter} 
        />

        {/* ALERTS LOGS LIST */}
        {error ? (
          <div className="hud-glass-panel p-6 text-center text-hud-danger text-xs">
            {error}
          </div>
        ) : getFilteredNotifications().length === 0 ? (
          <div className="hud-glass-panel p-10 text-center text-gray-500 text-xs py-14 flex flex-col items-center justify-center gap-2">
            <Bell className="w-8 h-8 text-gray-600" />
            <span>No notifications match your current filter parameters.</span>
          </div>
        ) : (
          <div className="space-y-4">
            {getFilteredNotifications().map((notif) => (
              <NotificationCard 
                key={notif._id} 
                notification={notif} 
                onMarkRead={handleMarkRead} 
              />
            ))}
          </div>
        )}

      </main>
    </div>
  );
};

export default Notifications;
