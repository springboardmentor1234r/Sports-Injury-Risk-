import React, { useState, useEffect, useRef } from 'react';
import { Bell, Activity, UserPlus, Info, CheckCircle2, X } from 'lucide-react';

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  action_link?: string;
  created_at: string;
}

interface NotificationBellProps {
  token: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ token }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch initial history
  useEffect(() => {
    if (!token) return;
    
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/notifications`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
          setUnreadCount(data.unread_count || 0);
        }
      } catch (err) {
        console.error("Failed to fetch notification history", err);
      }
    };
    fetchHistory();
  }, [token]);

  // Establish WebSocket connection
  useEffect(() => {
    if (!token) return;

    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://127.0.0.1:8000'}/api/ws/notifications?token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const newNotif: Notification = JSON.parse(event.data);
        
        // Add to the top of the list
        setNotifications(prev => [newNotif, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Optional: Play a tiny sound or show a browser toast here
      } catch (err) {
        console.error("Failed to parse incoming notification", err);
      }
    };

    ws.onerror = (err) => {
      // Ignore errors if we are actively closing the socket (e.g. React StrictMode unmounts)
      if (ws.readyState !== WebSocket.CLOSING && ws.readyState !== WebSocket.CLOSED) {
        console.error("WebSocket error", err);
      }
    };
    
    return () => {
      if (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [token]);

  const markAsRead = async (id: string, is_read: boolean) => {
    if (is_read) return;
    
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const getIcon = (type: string) => {
    if (type.includes("ALERT") || type.includes("RISK")) return <Activity className="w-4 h-4 text-red-500" />;
    if (type.includes("COACH") || type.includes("REQUEST")) return <UserPlus className="w-4 h-4 text-blue-500" />;
    if (type.includes("SUCCESS") || type.includes("COMPLETED")) return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    return <Info className="w-4 h-4 text-slate-500" />;
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-[#424656] hover:text-[#004ccd] hover:bg-[#f2f4f8] transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white pointer-events-none"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
          <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-sm text-slate-800">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-500 text-sm">
                No notifications yet
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {notifications.map(notif => (
                  <li 
                    key={notif._id}
                    onClick={() => markAsRead(notif._id, notif.is_read)}
                    className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${!notif.is_read ? 'bg-blue-50/30' : ''}`}
                  >
                    <div className="flex gap-3">
                      <div className="mt-0.5 shrink-0">
                        {getIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <p className={`text-sm font-semibold truncate ${!notif.is_read ? 'text-slate-900' : 'text-slate-700'}`}>
                            {notif.title}
                          </p>
                          {!notif.is_read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-1.5"></span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                          {notif.message}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium">
                          {formatDate(notif.created_at)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
