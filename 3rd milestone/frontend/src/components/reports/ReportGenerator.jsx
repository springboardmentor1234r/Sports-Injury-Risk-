import React from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { FileText, Download, Share2 } from 'lucide-react';

export default function ReportGenerator() {
  return (
    <Card glass className="p-6">
      <div className="flex items-center space-x-4 mb-6">
        <div className="p-3 bg-primary/10 text-primary rounded-xl">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Generate Report</h3>
          <p className="text-sm text-gray-500">Create a comprehensive PDF report for an athlete.</p>
        </div>
      </div>
      <div className="space-y-4">
        <select className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-bg px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none">
          <option>Select Athlete...</option>
          <option>Alex Johnson</option>
          <option>Mike Williams</option>
        </select>
        <select className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-bg px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none">
          <option>Select Date Range...</option>
          <option>Last 30 Days</option>
          <option>Last 3 Months</option>
          <option>Year to Date</option>
        </select>
        <div className="flex space-x-3 pt-2">
          <Button className="flex-1">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" className="flex-1">
            <Share2 className="w-4 h-4 mr-2" />
            Share Link
          </Button>
        </div>
      </div>
    </Card>
  );
}
