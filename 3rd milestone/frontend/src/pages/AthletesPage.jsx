import React, { useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { Search, Filter, Plus, ChevronRight, MoreVertical } from 'lucide-react';

const MOCK_ATHLETES = [
  { id: 1, name: 'Alex Johnson', sport: 'Basketball', position: 'Point Guard', risk: 'Low', lastAnalysis: '2023-10-24' },
  { id: 2, name: 'Sarah Smith', sport: 'Soccer', position: 'Forward', risk: 'Medium', lastAnalysis: '2023-10-22' },
  { id: 3, name: 'Mike Williams', sport: 'Football', position: 'Wide Receiver', risk: 'High', lastAnalysis: '2023-10-20' },
  { id: 4, name: 'Emily Brown', sport: 'Tennis', position: 'Singles', risk: 'Low', lastAnalysis: '2023-10-18' },
  { id: 5, name: 'David Lee', sport: 'Basketball', position: 'Center', risk: 'Low', lastAnalysis: '2023-10-15' },
];

export default function AthletesPage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Athletes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage and view athlete profiles</p>
        </div>
        <Button className="shrink-0">
          <Plus className="w-5 h-5 mr-2" />
          Add Athlete
        </Button>
      </div>

      <Card glass className="overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50 dark:bg-dark-bg/50">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search athletes..." 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-gray-900 dark:text-white transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="w-full sm:w-auto">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-dark-bg/50 text-gray-500 dark:text-gray-400 text-sm border-b border-gray-200 dark:border-gray-800">
                <th className="px-6 py-4 font-medium">Athlete</th>
                <th className="px-6 py-4 font-medium">Sport</th>
                <th className="px-6 py-4 font-medium">Position</th>
                <th className="px-6 py-4 font-medium">Risk Status</th>
                <th className="px-6 py-4 font-medium">Last Analysis</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {MOCK_ATHLETES.map((athlete) => (
                <tr key={athlete.id} className="hover:bg-gray-50/50 dark:hover:bg-dark-bg/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-semibold shadow-sm">
                        {athlete.name.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">{athlete.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{athlete.sport}</td>
                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{athlete.position}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      athlete.risk === 'Low' ? 'bg-success/10 text-success' :
                      athlete.risk === 'Medium' ? 'bg-warning/10 text-warning' :
                      'bg-danger/10 text-danger'
                    }`}>
                      {athlete.risk}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-sm">
                    {athlete.lastAnalysis}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-lg transition-colors">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-dark-bg/50 text-sm text-gray-500 dark:text-gray-400">
          <span>Showing 1 to 5 of 5 entries</span>
          <div className="flex space-x-1">
            <Button variant="ghost" size="sm" disabled>Previous</Button>
            <Button variant="ghost" size="sm" className="bg-primary/10 text-primary">1</Button>
            <Button variant="ghost" size="sm" disabled>Next</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
