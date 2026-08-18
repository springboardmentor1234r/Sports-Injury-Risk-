import React, { useCallback, useState } from 'react';
import { UploadCloud, File, X } from 'lucide-react';
import ProgressBar from './ProgressBar';

const FileUpload = ({ onFileSelect, accept = '*/*', maxSizeMB = 50, multi = false }) => {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const processFiles = (newFiles) => {
    setError('');
    const validFiles = [];
    
    Array.from(newFiles).forEach(file => {
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File ${file.name} exceeds ${maxSizeMB}MB limit`);
      } else {
        validFiles.push({
          file,
          id: Math.random().toString(36).substring(7),
          preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
        });
      }
    });

    if (validFiles.length > 0) {
      const updatedFiles = multi ? [...files, ...validFiles] : validFiles;
      setFiles(updatedFiles);
      onFileSelect(multi ? updatedFiles.map(f => f.file) : updatedFiles[0].file);
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [files, multi, maxSizeMB]);

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const removeFile = (id) => {
    const updated = files.filter(f => f.id !== id);
    setFiles(updated);
    if (updated.length > 0) {
      onFileSelect(multi ? updated.map(f => f.file) : updated[0].file);
    } else {
      onFileSelect(null);
    }
  };

  return (
    <div className="w-full">
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors duration-200 
          ${dragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/20 bg-white/5 hover:bg-white/10'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple={multi}
          accept={accept}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="p-4 rounded-full bg-white/5 mb-4">
          <UploadCloud className="h-8 w-8 text-indigo-400" />
        </div>
        <p className="text-slate-200 font-medium mb-1">
          Drag & drop files or <span className="text-indigo-400">browse</span>
        </p>
        <p className="text-xs text-slate-400">
          Supported formats: {accept} (Max {maxSizeMB}MB)
        </p>
      </div>

      {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}

      {files.length > 0 && (
        <div className="mt-4 space-y-3">
          {files.map(item => (
            <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 backdrop-blur-xl">
              <div className="flex items-center space-x-3 overflow-hidden">
                {item.preview ? (
                  <img src={item.preview} alt="preview" className="h-10 w-10 object-cover rounded-lg" />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center">
                    <File className="h-5 w-5 text-slate-300" />
                  </div>
                )}
                <div className="truncate">
                  <p className="text-sm font-medium text-slate-200 truncate">{item.file.name}</p>
                  <p className="text-xs text-slate-400">{(item.file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button 
                onClick={() => removeFile(item.id)}
                className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-rose-400 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
