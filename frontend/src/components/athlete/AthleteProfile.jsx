import React, { useState } from 'react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import RiskGauge from '../common/RiskGauge';
import { Activity, Calendar, MapPin, User, FileText, ChevronRight } from 'lucide-react';

export default function AthleteProfile({ athlete }) {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'history', label: 'Medical History' },
    { id: 'analyses', label: 'Recent Analyses' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Profile Card */}
        <Card glass className="p-6 md:w-1/3 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg mb-4">
            {athlete?.name?.charAt(0) || 'A'}
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{athlete?.name || 'Alex Johnson'}</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">{athlete?.sport || 'Basketball'} • {athlete?.position || 'Point Guard'}</p>
          
          <div className="flex gap-2 mb-6">
            <Badge variant="primary">Pro</Badge>
            <Badge variant="success">Cleared</Badge>
          </div>

          <div className="w-full space-y-3 text-left">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <User className="w-4 h-4 mr-3 text-gray-400" />
              <span>Age: 24 (185 cm, 82 kg)</span>
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <MapPin className="w-4 h-4 mr-3 text-gray-400" />
              <span>Team: LA Lakers</span>
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <Calendar className="w-4 h-4 mr-3 text-gray-400" />
              <span>Joined: Jan 2023</span>
            </div>
          </div>
        </Card>

        {/* Stats & Risk Card */}
        <Card glass className="p-6 md:w-2/3">
          <div className="flex border-b border-gray-200 dark:border-gray-800 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-dark-bg/50 rounded-xl border border-gray-100 dark:border-gray-800">
                <RiskGauge score={25} size={150} />
                <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">Current Risk Level</h3>
                <p className="text-sm text-gray-500 text-center mt-1">Overall injury probability is low based on recent kinematic data.</p>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Key Metrics</h3>
                {[
                  { label: 'Knee Symmetry', value: '94%', status: 'good' },
                  { label: 'Landing Impact', value: '2.4G', status: 'warning' },
                  { label: 'Joint Stability', value: 'High', status: 'good' },
                  { label: 'Fatigue Index', value: '12%', status: 'good' },
                ].map((metric, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-white dark:bg-dark-card border border-gray-100 dark:border-gray-800 rounded-lg shadow-sm">
                    <span className="text-sm text-gray-600 dark:text-gray-300">{metric.label}</span>
                    <span className={`text-sm font-semibold ${
                      metric.status === 'good' ? 'text-success' : 'text-warning'
                    }`}>{metric.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Other tabs content would go here */}
        </Card>
      </div>
    </div>
  );
}
