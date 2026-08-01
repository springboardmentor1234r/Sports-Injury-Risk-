import React from 'react';
import Card from '../common/Card';
import StatCard from '../common/StatCard';
import { Users, Activity, AlertTriangle } from 'lucide-react';
import Table from '../common/Table';

export default function CoachDashboard() {
  const athletes = [
    { name: 'Alex Johnson', status: 'Cleared', risk: 'Low' },
    { name: 'Mike Williams', status: 'Rest', risk: 'High' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Coach Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Team Members" value="24" icon={Users} color="primary" />
        <StatCard title="Average Readiness" value="88%" icon={Activity} color="success" />
        <StatCard title="At Risk" value="3" icon={AlertTriangle} color="danger" trend="up" trendValue="+1" />
      </div>
      <Card glass className="p-6">
        <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-4">Team Status</h3>
        <Table 
          columns={[
            { header: 'Athlete', accessor: 'name' },
            { header: 'Status', accessor: 'status' },
            { header: 'Risk Level', accessor: 'risk' }
          ]}
          data={athletes}
        />
      </Card>
    </div>
  );
}
