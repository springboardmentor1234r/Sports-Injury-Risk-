import React from 'react';
import { motion } from 'framer-motion';

const SettingsPage = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 max-w-4xl"
    >
      <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
        Settings
      </h1>
      
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Profile Settings</h2>
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">First Name</label>
              <input type="text" className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2 focus:ring focus:ring-indigo-500 outline-none" defaultValue="Admin" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Last Name</label>
              <input type="text" className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2 focus:ring focus:ring-indigo-500 outline-none" defaultValue="User" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input type="email" className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2 focus:ring focus:ring-indigo-500 outline-none" defaultValue="admin@sportrisk.com" />
          </div>
          <button type="button" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded transition-colors">
            Save Changes
          </button>
        </form>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Notifications</h2>
        <div className="space-y-3">
          <label className="flex items-center text-gray-300 cursor-pointer">
            <input type="checkbox" className="mr-3 w-4 h-4 bg-slate-800 border-slate-700 text-indigo-500 rounded focus:ring-indigo-500" defaultChecked />
            Email alerts for High Risk analyses
          </label>
          <label className="flex items-center text-gray-300 cursor-pointer">
            <input type="checkbox" className="mr-3 w-4 h-4 bg-slate-800 border-slate-700 text-indigo-500 rounded focus:ring-indigo-500" defaultChecked />
            Weekly summary reports
          </label>
        </div>
      </div>
    </motion.div>
  );
};

export default SettingsPage;
