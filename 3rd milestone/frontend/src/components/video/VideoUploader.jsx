import React, { useState } from 'react';
import { UploadCloud, X, FileVideo } from 'lucide-react';

const VideoUploader = () => {
  const [files, setFiles] = useState([]);

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('video/'));
    setFiles(prev => [...prev, ...droppedFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div 
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="border-2 border-dashed border-slate-600 rounded-xl p-10 flex flex-col items-center justify-center bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer"
      >
        <UploadCloud className="w-12 h-12 text-indigo-400 mb-4" />
        <h3 className="text-lg font-bold text-white mb-2">Drag & Drop videos here</h3>
        <p className="text-gray-400 text-sm text-center mb-6">Support for MP4, MOV, AVI up to 500MB</p>
        <label className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer transition-colors">
          Browse Files
          <input type="file" multiple accept="video/*" className="hidden" onChange={(e) => setFiles(prev => [...prev, ...Array.from(e.target.files)])} />
        </label>
      </div>

      {files.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h4 className="text-white font-bold mb-4">Selected Files</h4>
          <div className="space-y-3">
            {files.map((file, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <FileVideo className="text-indigo-400 w-6 h-6 flex-shrink-0" />
                  <span className="text-white text-sm truncate">{file.name}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-gray-400 text-xs">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                  <button onClick={() => removeFile(i)} className="text-gray-400 hover:text-rose-500 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <button className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium">
              Upload and Analyze ({files.length})
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoUploader;
