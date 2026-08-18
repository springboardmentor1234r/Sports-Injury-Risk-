import React from 'react';
import Card from '../common/Card';
import RiskGauge from '../common/RiskGauge';
import ProgressBar from '../common/ProgressBar';

export default function AthleteDashboard() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Athlete Portal</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card glass className="p-6 flex flex-col items-center">
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-4">Your Overall Risk Score</h3>
          <RiskGauge score={15} size={160} />
          <p className="text-success font-medium mt-4">Cleared for Play</p>
        </Card>
        
        <Card glass className="p-6 md:col-span-2">
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-4">Recent Performance Metrics</h3>
          <div className="space-y-6">
            <ProgressBar label="Knee Flexion Symmetry" progress={92} color="bg-success" />
            <ProgressBar label="Landing Impact Balance" progress={85} color="bg-success" />
            <ProgressBar label="Fatigue Indicator" progress={30} color="bg-warning" />
          </div>
        </Card>
      </div>
    </div>
  );
}
