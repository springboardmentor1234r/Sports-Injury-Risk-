import React from 'react';
import ReportGenerator from '../components/reports/ReportGenerator';
import ReportList from '../components/reports/ReportList';
import { motion } from 'framer-motion';

const ReportsPage = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
        Reports
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportGenerator />
        <ReportList />
      </div>
    </motion.div>
  );
};

export default ReportsPage;
