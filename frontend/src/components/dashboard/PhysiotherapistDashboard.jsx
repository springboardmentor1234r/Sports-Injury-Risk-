import React from 'react';
import { motion } from 'framer-motion';
import DashboardStats from './DashboardStats';
import TeamOverview from './TeamOverview';

const PhysiotherapistDashboard = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
        Physiotherapist Dashboard
      </h1>
      <DashboardStats role="physio" />
      <TeamOverview isPhysio={true} />
    </motion.div>
  );
};

export default PhysiotherapistDashboard;
