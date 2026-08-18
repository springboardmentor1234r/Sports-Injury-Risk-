import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Video, 
  Activity, 
  FileText, 
  Settings, 
  ChevronLeft,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { motion } from 'framer-motion';

const Sidebar = ({ role = 'admin' }) => {
  const [collapsed, setCollapsed] = useState(false);

  // Role-based menu items
  const getMenuItems = () => {
    const baseItems = [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
      { name: 'Athletes', icon: Users, path: '/athletes' },
      { name: 'Videos', icon: Video, path: '/videos' },
      { name: 'Analysis', icon: Activity, path: '/analysis' },
      { name: 'Reports', icon: FileText, path: '/reports' }
    ];

    if (role === 'admin') {
      baseItems.push({ name: 'Risk Overview', icon: ShieldAlert, path: '/risk' });
      baseItems.push({ name: 'Settings', icon: Settings, path: '/settings' });
    }

    return baseItems;
  };

  const menuItems = getMenuItems();

  return (
    <motion.aside
      initial={{ width: 240 }}
      animate={{ width: collapsed ? 80 : 240 }}
      className="h-screen bg-slate-900/80 backdrop-blur-xl border-r border-white/10 flex flex-col relative transition-all duration-300"
    >
      <div className="h-16 flex items-center justify-center border-b border-white/10 px-4">
        {collapsed ? (
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-lg">
            S
          </div>
        ) : (
          <div className="flex items-center space-x-2 w-full">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-lg">
              S
            </div>
            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              SportRisk AI
            </span>
          </div>
        )}
      </div>

      <button 
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 bg-slate-800 border border-white/10 rounded-full p-1 text-slate-300 hover:text-white hover:bg-slate-700 z-10"
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <nav className="flex-1 py-6 flex flex-col gap-2 px-3 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center px-3 py-3 rounded-xl transition-all duration-200 group
              ${isActive 
                ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/30' 
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }
            `}
            title={collapsed ? item.name : undefined}
          >
            <item.icon className={`h-5 w-5 flex-shrink-0 ${collapsed ? 'mx-auto' : 'mr-3'}`} />
            {!collapsed && (
              <span className="font-medium truncate">{item.name}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {!collapsed && (
        <div className="p-4 border-t border-white/10">
          <div className="bg-white/5 rounded-xl p-4 border border-white/5">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2">Role</p>
            <p className="text-sm text-indigo-400 capitalize">{role}</p>
          </div>
        </div>
      )}
    </motion.aside>
  );
};

export default Sidebar;
