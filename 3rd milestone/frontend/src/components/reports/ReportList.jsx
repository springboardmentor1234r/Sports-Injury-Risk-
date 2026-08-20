import React from 'react';
import { Download, Eye } from 'lucide-react';

const ReportList = () => {
  const reports = [
    { id: 1, name: 'Team Risk Overview - Oct 2023', type: 'PDF', date: '2023-10-25' },
    { id: 2, name: 'Athlete Analysis - Sarah W.', type: 'PDF', date: '2023-10-24' },
    { id: 3, name: 'Raw Biomechanics Data', type: 'CSV', date: '2023-10-20' },
  ];

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
      <h2 className="text-xl font-bold text-white mb-4">Generated Reports</h2>
      <div className="space-y-3">
        {reports.map(report => (
          <div key={report.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
            <div>
              <p className="text-white font-medium">{report.name}</p>
              <p className="text-gray-400 text-xs">{report.date} • {report.type}</p>
            </div>
            <div className="flex space-x-2">
              <button className="p-2 bg-white/10 hover:bg-white/20 rounded text-gray-300 transition-colors">
                <Eye className="w-4 h-4" />
              </button>
              <button className="p-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white transition-colors">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportList;
