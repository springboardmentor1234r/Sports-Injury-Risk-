import React from 'react';
import { motion } from 'framer-motion';

const Tabs = ({ tabs, activeTab, onChange, className = '' }) => {
  return (
    <div className={`flex space-x-1 p-1 bg-white/5 border border-white/10 rounded-xl backdrop-blur-xl overflow-x-auto ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`
            relative px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors duration-200
            ${activeTab === tab.id ? 'text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}
          `}
        >
          {activeTab === tab.id && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-gradient-to-r from-indigo-500/40 to-purple-500/40 border border-white/10 rounded-lg shadow-sm"
              initial={false}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center space-x-2">
            {tab.icon && <tab.icon className="h-4 w-4" />}
            <span>{tab.label}</span>
          </span>
        </button>
      ))}
    </div>
  );
};

export default Tabs;
