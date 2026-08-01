import React from 'react';
import Card from '../common/Card';
import RiskGauge from '../common/RiskGauge';

export default function RiskOverview() {
  return (
    <Card glass className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Risk Distribution</h3>
      <div className="flex flex-col md:flex-row items-center justify-around">
        <div className="text-center">
          <RiskGauge score={85} size={120} />
          <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">Team Average</p>
        </div>
        <div className="space-y-4 mt-6 md:mt-0">
          <div className="flex items-center justify-between min-w-[200px]">
            <span className="text-sm text-gray-600 dark:text-gray-400">Low Risk (0-40)</span>
            <span className="text-sm font-semibold text-success">65%</span>
          </div>
          <div className="flex items-center justify-between min-w-[200px]">
            <span className="text-sm text-gray-600 dark:text-gray-400">Medium Risk (41-75)</span>
            <span className="text-sm font-semibold text-warning">25%</span>
          </div>
          <div className="flex items-center justify-between min-w-[200px]">
            <span className="text-sm text-gray-600 dark:text-gray-400">High Risk (76-100)</span>
            <span className="text-sm font-semibold text-danger">10%</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
