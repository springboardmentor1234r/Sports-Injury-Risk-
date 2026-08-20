import React from 'react';
import { motion } from 'framer-motion';
import DashboardStats from './DashboardStats';
import RiskOverview from './RiskOverview';

const SportScientistDashboard = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
        Sport Scientist Dashboard
      </h1>
      <DashboardStats role="scientist" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RiskOverview />
      </div>
    </motion.div>
  );
};

export default SportScientistDashboard;
