import React, { useRef, useState } from 'react';
import { UploadCloud, X, FileVideo, CheckCircle2, AlertCircle } from 'lucide-react';

interface FileUploaderProps {
  token?: string;
  onUploadSuccess?: (data: any) => void;
  onUploadStart?: () => void;
}

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => (
  <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-bottom-5 ${
    type === 'success' 
        ? 'bg-emerald-950/80 border-emerald-800 text-emerald-400' 
        : 'bg-rose-950/80 border-rose-800 text-rose-400'
  }`}
    role="alert"
  >
    {type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
    <span className="font-medium text-sm">{message}</span>
    <button onClick={onClose} className="ml-2 text-slate-400 hover:text-white transition-colors" aria-label="Close">
      <X className="w-4 h-4" />
    </button>
  </div>
);

export const FileUploader: React.FC<FileUploaderProps> = ({ token, onUploadSuccess, onUploadStart }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    // Only allow video files
    if (!file.type.startsWith('video/')) {
      setToast({ message: 'Please upload a valid video file (MP4, MOV, AVI)', type: 'error' });
      return;
    }
    setSelectedFile(file);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      handleFile(event.target.files[0]);
    }
    event.target.value = '';
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      handleFile(event.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setProgress(0);
    
    if (onUploadStart) {
        onUploadStart();
    }
    
    // Simulate progress while waiting for the slow video analysis backend
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        // Slow down progress as it gets closer to 90%
        const increment = prev < 50 ? 5 : prev < 80 ? 2 : 1;
        return prev + increment;
      });
    }, 500);
    
    try {
      const formData = new FormData();
      formData.append('video', selectedFile);

      const response = await fetch('http://localhost:8000/api/sessions/upload-and-analyze', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100); 
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to analyze video');
      }

      setToast({ message: 'Video analyzed successfully!', type: 'success' });
      
      if (onUploadSuccess) {
        // Add a slight delay before triggering success to let the user see 100%
        setTimeout(() => {
          onUploadSuccess(data);
        }, 500);
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      setToast({ message: err.message, type: 'error' });
      setProgress(0);
    } finally {
      setTimeout(() => {
        setUploading(false);
      }, 500);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto">
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-8 w-full animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white tracking-tight mb-1">Upload Athlete Video</h2>
            <p className="text-sm font-medium text-slate-400">MP4, MOV, AVI up to 100MB</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/x-msvideo"
          className="hidden"
          onChange={handleFileChange}
          aria-label="File input"
        />

        <div
          className={`w-full flex flex-col items-center justify-center border-2 border-dashed rounded-xl transition-all duration-300 mb-6 cursor-pointer ${
            isDragging 
                ? 'border-cyan-500 bg-cyan-950/20' 
                : 'border-slate-700 bg-slate-800/30 hover:border-slate-500 hover:bg-slate-800/50'
          }`}
          style={{ minHeight: 160 }}
          onClick={handleButtonClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="flex flex-col items-center py-6 pointer-events-none">
            <div className={`p-4 rounded-full mb-4 transition-colors duration-300 ${isDragging ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'}`}>
                <UploadCloud className={`w-8 h-8 ${isDragging ? 'animate-bounce' : ''}`} />
            </div>
            <span className="text-slate-300 font-medium text-sm">
              Drag & drop video here or <span className="text-cyan-400 hover:text-cyan-300 transition-colors">Browse</span>
            </span>
          </div>
        </div>

        {selectedFile && (
          <div className="mb-6 animate-in slide-in-from-bottom-2 fade-in duration-300">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Selected Video</div>
            <div className="flex items-center gap-4 bg-slate-800/50 border border-slate-700 rounded-xl p-3">
              <div className="p-2 bg-slate-900 rounded-lg text-cyan-400">
                <FileVideo className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate pr-4">{selectedFile.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{formatFileSize(selectedFile.size)}</p>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                disabled={uploading}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors disabled:opacity-50"
                aria-label="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {uploading && (
          <div className="w-full mb-6 animate-in fade-in">
            <div className="flex justify-between text-xs font-semibold text-slate-400 mb-2">
                <span>Analyzing Biomechanics...</span>
                <span className="text-cyan-400">{progress}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-300 ease-out relative"
                style={{ width: `${progress}%` }}
              >
                  <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          disabled={!selectedFile || uploading}
          onClick={handleUpload}
          className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all duration-300 shadow-lg flex items-center justify-center gap-2
            ${selectedFile && !uploading
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] active:scale-[0.98]'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'}
          `}
        >
          {uploading ? (
            <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Processing...
            </>
          ) : (
            'Analyze Video'
          )}
        </button>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
};
