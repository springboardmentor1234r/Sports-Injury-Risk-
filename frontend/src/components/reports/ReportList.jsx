import React, { useEffect, useState } from 'react';
import { Download, Eye, X } from 'lucide-react';

const REPORT_STORAGE_KEY = 'generatedReports';

const ReportList = () => {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);

  const loadReports = () => {
    const saved = JSON.parse(localStorage.getItem(REPORT_STORAGE_KEY) || '[]');
    setReports(saved.length ? saved : [
      { id: 1, name: 'Team Risk Overview - Oct 2023', type: 'PDF', date: '2023-10-25', athlete: 'Team', video: 'Full Team Drill.mp4' },
      { id: 2, name: 'Athlete Analysis - Sarah W.', type: 'PDF', date: '2023-10-24', athlete: 'Sarah W.', video: 'Sarah Motion.mp4' },
      { id: 3, name: 'Raw Biomechanics Data', type: 'CSV', date: '2023-10-20', athlete: 'Data Set', video: 'Bulk Upload' },
    ]);
  };

  useEffect(() => {
    loadReports();
    window.addEventListener('reportsUpdated', loadReports);
    return () => window.removeEventListener('reportsUpdated', loadReports);
  }, []);

  const handleViewReport = (report) => {
    setSelectedReport(report);
  };

  const handleCloseModal = () => {
    setSelectedReport(null);
  };

  return (
    <>
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Generated Reports</h2>
        <div className="space-y-3">
          {reports.map(report => (
            <div key={report.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
              <div>
                <p className="text-white font-medium">{report.name}</p>
                <p className="text-gray-400 text-xs">{report.date} • {report.type}</p>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleViewReport(report)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded text-gray-300 transition-colors"
                >
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

      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedReport.name}</h2>
                <p className="text-gray-400 text-sm mt-1">{selectedReport.date}</p>
              </div>
              <button 
                onClick={handleCloseModal}
                className="p-2 bg-gray-800 hover:bg-gray-700 rounded text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6 text-gray-300">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Report Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Athlete</p>
                    <p className="text-white">{selectedReport.athlete}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Date</p>
                    <p className="text-white">{selectedReport.date}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Video</p>
                    <p className="text-white text-xs">{selectedReport.video}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Report Type</p>
                    <p className="text-white">{selectedReport.type}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Injury Risk Assessment</h3>
                <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Overall Risk Level</span>
                    <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm font-medium">MODERATE</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Knee Stability</span>
                    <div className="w-24 bg-gray-700 rounded-full h-2">
                      <div className="bg-amber-500 h-2 rounded-full" style={{width: '65%'}}></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Ankle Angle</span>
                    <div className="w-24 bg-gray-700 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{width: '45%'}}></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Hip Alignment</span>
                    <div className="w-24 bg-gray-700 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{width: '78%'}}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Recommendations</h3>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li>Improve hip strength with targeted exercises</li>
                  <li>Focus on single-leg balance work</li>
                  <li>Review landing mechanics during training</li>
                  <li>Schedule follow-up assessment in 2 weeks</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 flex space-x-3 pt-4 border-t border-gray-700">
              <button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium transition-colors">
                Download PDF
              </button>
              <button 
                onClick={handleCloseModal}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReportList;
