import React from 'react';
import StatCard from '../common/StatCard';
import { Users, Activity, TrendingUp, AlertCircle } from 'lucide-react';

export default function DashboardStats() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard title="Total Athletes" value="142" icon={Users} color="primary" trend="up" trendValue="12%" />
      <StatCard title="Assessments" value="84" icon={Activity} color="purple-500" trend="up" trendValue="5%" />
      <StatCard title="High Risk" value="12" icon={AlertCircle} color="danger" trend="down" trendValue="2%" />
      <StatCard title="Avg Score" value="82/100" icon={TrendingUp} color="success" />
    </div>
  );
}
