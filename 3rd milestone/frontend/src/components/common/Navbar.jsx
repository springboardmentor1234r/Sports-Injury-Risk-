import React from 'react';
import { Bell, Moon, Sun, Search, Menu } from 'lucide-react';
import Avatar from './Avatar';
import Dropdown from './Dropdown';

const Navbar = ({ onMenuClick, user, isDarkMode, toggleDarkMode }) => {
  return (
    <header className="h-16 border-b border-white/10 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-40 w-full flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 text-slate-400 hover:text-white mr-4 rounded-lg hover:bg-white/5"
        >
          <Menu className="h-5 w-5" />
        </button>
        
        <div className="hidden sm:flex relative w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-full bg-white/5 border border-white/10 py-1.5 pl-10 pr-3 text-sm text-slate-200 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="Search athletes, videos..."
          />
        </div>
      </div>

      <div className="flex items-center space-x-3 sm:space-x-5">
        <button 
          onClick={toggleDarkMode}
          className="p-2 text-slate-400 hover:text-amber-400 transition-colors rounded-full hover:bg-white/5"
        >
          {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        <button className="relative p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-white/5">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-rose-500 ring-2 ring-slate-900"></span>
        </button>

        <div className="h-6 w-px bg-white/10 mx-2 hidden sm:block"></div>

        <Dropdown
          trigger={
            <button className="flex items-center space-x-2 focus:outline-none">
              <Avatar 
                src={user?.avatar} 
                alt={user?.name || 'User'} 
                fallback={user?.name?.[0] || 'U'} 
                size="sm" 
              />
              <span className="hidden sm:block text-sm font-medium text-slate-200">
                {user?.name || 'Jane Doe'}
              </span>
            </button>
          }
          items={[
            { label: 'Profile', onClick: () => console.log('Profile') },
            { label: 'Settings', onClick: () => console.log('Settings') },
            { label: 'Sign out', onClick: () => console.log('Sign out'), className: 'text-rose-400 hover:text-rose-300' }
          ]}
          align="right"
        />
      </div>
    </header>
  );
};

export default Navbar;
