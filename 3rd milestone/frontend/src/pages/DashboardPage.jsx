import React from 'react';
import Card from '../components/common/Card';
import { 
  Users, 
  Activity, 
  AlertTriangle, 
  CheckCircle2,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const mockChartData = [
  { name: 'Jan', value: 40 },
  { name: 'Feb', value: 30 },
  { name: 'Mar', value: 45 },
  { name: 'Apr', value: 50 },
  { name: 'May', value: 35 },
  { name: 'Jun', value: 25 },
  { name: 'Jul', value: 15 },
];

const StatCard = ({ title, value, icon: Icon, change, isPositive, color }) => (
  <Card glass className="p-6">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">{value}</p>
      </div>
      <div className={`p-3 rounded-xl bg-${color}/10 text-${color}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
    <div className="mt-4 flex items-center text-sm">
      {isPositive ? (
        <TrendingDown className="w-4 h-4 text-success mr-1" />
      ) : (
        <TrendingUp className="w-4 h-4 text-danger mr-1" />
      )}
      <span className={isPositive ? 'text-success font-medium' : 'text-danger font-medium'}>
        {change}
      </span>
      <span className="text-gray-500 dark:text-gray-400 ml-2">vs last month</span>
    </div>
  </Card>
);

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Overview</h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Last updated: Today, 09:41 AM
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Athletes" 
          value="142" 
          icon={Users} 
          change="+12%" 
          isPositive={false}
          color="primary"
        />
        <StatCard 
          title="Analyses This Month" 
          value="84" 
          icon={Activity} 
          change="+24%" 
          isPositive={true}
          color="purple-500"
        />
        <StatCard 
          title="High Risk Athletes" 
          value="12" 
          icon={AlertTriangle} 
          change="-14%" 
          isPositive={true}
          color="danger"
        />
        <StatCard 
          title="Cleared for Play" 
          value="118" 
          icon={CheckCircle2} 
          change="+5%" 
          isPositive={true}
          color="success"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card glass className="p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Average Risk Score Trends
          </h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                <XAxis dataKey="name" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E293B', borderColor: '#374151', color: '#F3F4F6' }}
                  itemStyle={{ color: '#F3F4F6' }}
                />
                <Area type="monotone" dataKey="value" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card glass className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Recent Alerts
          </h2>
          <div className="space-y-4">
            {[
              { name: 'John Doe', risk: 'High', type: 'Knee Valgus', time: '2h ago' },
              { name: 'Sarah Smith', risk: 'Medium', type: 'Asymmetry', time: '4h ago' },
              { name: 'Mike Johnson', risk: 'High', type: 'Fatigue', time: '1d ago' },
              { name: 'Emma Davis', risk: 'Low', type: 'Cleared', time: '1d ago' },
            ].map((alert, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-dark-bg/50 border border-gray-100 dark:border-gray-800">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    alert.risk === 'High' ? 'bg-danger' : 
                    alert.risk === 'Medium' ? 'bg-warning' : 'bg-success'
                  }`}></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{alert.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{alert.type}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">{alert.time}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
