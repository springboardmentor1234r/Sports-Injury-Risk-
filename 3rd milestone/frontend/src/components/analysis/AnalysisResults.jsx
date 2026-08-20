import React from 'react';
import Card from '../common/Card';
import RiskGauge from '../common/RiskGauge';

export default function AnalysisResults({ analysis }) {
  return (
    <div className="space-y-6">
      <Card glass className="p-6">
        <h3 className="text-xl font-bold mb-6">Biomechanics Analysis Results</h3>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-4">Key Findings</h4>
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="w-2 h-2 mt-2 rounded-full bg-danger mr-3 shrink-0"></span>
                <span className="text-gray-600 dark:text-gray-400">Excessive knee valgus angle during landing phase (max 15°).</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 mt-2 rounded-full bg-warning mr-3 shrink-0"></span>
                <span className="text-gray-600 dark:text-gray-400">Mild asymmetry in hip extension between left and right.</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 mt-2 rounded-full bg-success mr-3 shrink-0"></span>
                <span className="text-gray-600 dark:text-gray-400">Good trunk stability maintained throughout the movement.</span>
              </li>
            </ul>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center border-l border-gray-200 dark:border-gray-800 pl-8">
            <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-4 text-center">Movement Risk Score</h4>
            <RiskGauge score={78} size={150} />
            <p className="text-sm text-danger mt-4 font-medium">High Risk - Intervention Recommended</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
