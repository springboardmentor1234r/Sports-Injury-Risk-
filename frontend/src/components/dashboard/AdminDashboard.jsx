import React from 'react';
import Card from '../common/Card';

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">System Administration</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card glass className="p-6">
          <h3 className="font-semibold mb-2">User Management</h3>
          <p className="text-sm text-gray-500">Manage athletes, coaches, and staff accounts.</p>
        </Card>
        <Card glass className="p-6">
          <h3 className="font-semibold mb-2">System Settings</h3>
          <p className="text-sm text-gray-500">Configure global parameters and integrations.</p>
        </Card>
      </div>
    </div>
  );
}
