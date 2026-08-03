import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_BASE } from "../lib/config";
import { severityColor } from "../lib/risk";

// Self-contained notification bell: fetches its own unread count + feed,
// so any page can drop in <NotificationBell /> without wiring props.
// Milestone 4 — Notification & Alert System (PDF section 11).
export default function NotificationBell() {
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/notifications/`, { headers });
      setNotifications(res.data);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await axios.get(`${API_BASE}/notifications/unread-count`, { headers });
        setUnreadCount(res.data.unread_count);
      } catch {
        // Silently ignore — the bell just won't show a badge this refresh.
      }
    };
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next) fetchNotifications();
  };

  const markRead = async (id) => {
    try {
      await axios.post(`${API_BASE}/notifications/${id}/read`, {}, { headers });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: "yes" } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Non-critical — the item just stays unread until next refresh.
    }
  };

  const markAllRead = async () => {
    try {
      await axios.post(`${API_BASE}/notifications/read-all`, {}, { headers });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: "yes" })));
      setUnreadCount(0);
    } catch {
      // Non-critical.
    }
  };

  return (
    <div ref={wrapperRef} style={styles.wrapper}>
      <div style={styles.bellIcon} onClick={toggleOpen}>
        🔔
        {unreadCount > 0 && <span style={styles.badge}>{unreadCount > 9 ? "9+" : unreadCount}</span>}
      </div>

      {open && (
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <span style={styles.panelTitle}>Notifications</span>
            {unreadCount > 0 && (
              <span style={styles.markAllLink} onClick={markAllRead}>
                Mark all read
              </span>
            )}
          </div>

          <div style={styles.list}>
            {loading && <p style={styles.emptyText}>Loading…</p>}
            {!loading && notifications.length === 0 && (
              <p style={styles.emptyText}>No notifications yet.</p>
            )}
            {!loading &&
              notifications.map((n) => (
                <div
                  key={n.id}
                  style={{
                    ...styles.item,
                    background: n.is_read === "no" ? "#faf5ff" : "transparent",
                  }}
                  onClick={() => n.is_read === "no" && markRead(n.id)}
                >
                  <div style={{ ...styles.dot, background: severityColor(n.severity) }} />
                  <div style={{ flex: 1 }}>
                    <p style={styles.itemTitle}>{n.title}</p>
                    <p style={styles.itemMessage}>{n.message}</p>
                    <p style={styles.itemTime}>{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: { position: "relative", display: "inline-block" },
  bellIcon: {
    width: 42, height: 42, borderRadius: "50%", background: "#faf5ff",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 18, cursor: "pointer", position: "relative",
  },
  badge: {
    position: "absolute", top: -2, right: -2, background: "#ef4444", color: "white",
    fontSize: 10, fontWeight: 700, borderRadius: 999, minWidth: 16, height: 16,
    display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px",
  },
  panel: {
    position: "absolute", top: 50, right: 0, width: 340, maxHeight: 420, overflowY: "auto",
    background: "white", borderRadius: 18, boxShadow: "0 12px 32px rgba(0,0,0,0.15)",
    border: "1px solid #f3e8ff", zIndex: 50,
  },
  panelHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "14px 16px", borderBottom: "1px solid #f3f4f6",
  },
  panelTitle: { fontWeight: 700, color: "#4c1d95", fontSize: 15 },
  markAllLink: { fontSize: 12, color: "#8b5cf6", fontWeight: 600, cursor: "pointer" },
  list: { padding: "6px" },
  emptyText: { fontSize: 13, color: "#9ca3af", textAlign: "center", padding: "20px" },
  item: {
    display: "flex", gap: 10, padding: "10px 10px", borderRadius: 12, cursor: "pointer",
  },
  dot: { width: 8, height: 8, borderRadius: "50%", marginTop: 6, flexShrink: 0 },
  itemTitle: { margin: 0, fontSize: 13, fontWeight: 700, color: "#374151" },
  itemMessage: { margin: "2px 0", fontSize: 12, color: "#6b7280", lineHeight: 1.4 },
  itemTime: { margin: 0, fontSize: 10, color: "#9ca3af" },
};
