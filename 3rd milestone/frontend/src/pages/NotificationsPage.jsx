import React from 'react';
import { motion } from 'framer-motion';
import { Bell, AlertTriangle, CheckCircle } from 'lucide-react';

const NotificationsPage = () => {
  const notifications = [
    { id: 1, type: 'alert', message: 'High risk detected for Sarah Williams (Jump Analysis)', time: '2 hours ago', read: false },
    { id: 2, type: 'success', message: 'Batch processing completed (12 videos)', time: '5 hours ago', read: true },
    { id: 3, type: 'info', message: 'New model version deployed (v2.1.0)', time: '1 day ago', read: true },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 max-w-3xl"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
          Notifications
        </h1>
        <button className="text-sm text-indigo-400 hover:text-indigo-300">Mark all as read</button>
      </div>

      <div className="space-y-4">
        {notifications.map(note => (
          <div key={note.id} className={`p-4 rounded-xl border flex gap-4 ${note.read ? 'bg-white/5 border-white/5 opacity-70' : 'bg-slate-800 border-slate-700'}`}>
            <div className="mt-1">
              {note.type === 'alert' && <AlertTriangle className="text-rose-500 w-5 h-5" />}
              {note.type === 'success' && <CheckCircle className="text-emerald-500 w-5 h-5" />}
              {note.type === 'info' && <Bell className="text-indigo-400 w-5 h-5" />}
            </div>
            <div className="flex-1">
              <p className="text-white">{note.message}</p>
              <p className="text-sm text-gray-500 mt-1">{note.time}</p>
            </div>
            {!note.read && <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>}
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default NotificationsPage;
