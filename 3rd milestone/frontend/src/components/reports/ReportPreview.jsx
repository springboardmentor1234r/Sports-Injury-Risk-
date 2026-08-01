import React from 'react';
import { X } from 'lucide-react';

const ReportPreview = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-4xl h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Report Preview</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 p-6 overflow-auto bg-slate-900 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p>PDF Viewer Component Here</p>
            <p className="text-sm mt-2">Document: Team Risk Overview.pdf</p>
          </div>
        </div>
        <div className="p-4 border-t border-slate-700 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors">
            Close
          </button>
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors">
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportPreview;
