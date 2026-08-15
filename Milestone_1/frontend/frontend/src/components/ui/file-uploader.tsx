import React, { useRef, useState } from 'react';
import { UploadCloud, X, FileVideo, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

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
  <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center gap-3 animate-in slide-in-from-bottom-5 ${
    type === 'success' 
        ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
        : 'bg-red-50 border-red-200 text-red-800'
  }`}
    role="alert"
  >
    {type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
    <span className="font-semibold text-sm">{message}</span>
    <button onClick={onClose} className="ml-2 text-slate-500 hover:text-slate-900 transition-colors" aria-label="Close">
      <X className="w-4 h-4" />
    </button>
  </div>
);

export const FileUploader: React.FC<FileUploaderProps> = ({ token, onUploadSuccess, onUploadStart }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customName, setCustomName] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('video/')) {
      setToast({ message: 'Please upload a valid video file (MP4, MOV, AVI)', type: 'error' });
      return;
    }
    setSelectedFile(file);
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
    setCustomName(nameWithoutExt);
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
    setCustomName('');
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
    
    try {
      // 1. Get Signature
      const sigResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/sessions/upload-signature`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!sigResponse.ok) {
        throw new Error('Failed to get upload signature');
      }
      const sigData = await sigResponse.json();
      
      // 2. Upload directly to Cloudinary
      const cloudinaryFormData = new FormData();
      cloudinaryFormData.append('file', selectedFile);
      cloudinaryFormData.append('api_key', sigData.api_key);
      cloudinaryFormData.append('timestamp', sigData.timestamp);
      cloudinaryFormData.append('signature', sigData.signature);
      cloudinaryFormData.append('folder', 'sports_injury_raw_videos');
      
      setProgress(10);
      const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${sigData.cloud_name}/video/upload`, {
        method: 'POST',
        body: cloudinaryFormData
      });
      
      if (!cloudRes.ok) {
        throw new Error('Direct upload to cloud failed');
      }
      const cloudData = await cloudRes.json();
      setProgress(50);
      
      // 3. Trigger processing on backend
      const processRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/sessions/process-video`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          secure_url: cloudData.secure_url,
          custom_name: customName.trim() || undefined
        }),
      });

      const data = await processRes.json();

      if (!processRes.ok) {
        throw new Error(data.detail || 'Failed to start analysis');
      }

      // WebSocket listener
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const wsProtocol = apiUrl.startsWith('https') ? 'wss' : 'ws';
      const wsHost = apiUrl.replace(/^https?:\/\//, '');
      const ws = new WebSocket(`${wsProtocol}://${wsHost}/api/ws/progress/${data.session_id}?token=${token}`);

      ws.onmessage = async (event) => {
        const msg = JSON.parse(event.data);
        
        if (msg.progress) {
          setProgress(msg.progress);
        }
        
        if (msg.step === "Analysis Complete") {
          ws.close();
          setToast({ message: 'Video analyzed successfully!', type: 'success' });
          
          try {
            // Fetch the final session data
            const res = await fetch(`${apiUrl}/api/sessions/${data.session_id}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
              const sessionData = await res.json();
              if (onUploadSuccess) {
                setTimeout(() => onUploadSuccess(sessionData), 500);
              }
            }
          } catch (e) {
             console.error("Failed to fetch final session", e);
          } finally {
            setUploading(false);
          }
        }
        
        if (msg.step === "ERROR") {
          ws.close();
          setToast({ message: msg.error || 'Pipeline failed', type: 'error' });
          setUploading(false);
          setProgress(0);
        }
      };

      ws.onerror = () => {
        setToast({ message: 'WebSocket connection failed.', type: 'error' });
        setUploading(false);
        setProgress(0);
      };

      ws.onclose = (event) => {
        if (!event.wasClean && uploading) {
          setToast({ message: 'Disconnected from progress tracking.', type: 'error' });
          setUploading(false);
          setProgress(0);
        }
      };

    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
      setProgress(0);
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto text-left">
      <div className="bg-white border border-[#c3c6d7] rounded-2xl shadow-sm p-6 w-full animate-in fade-in zoom-in duration-300 text-[#191c1f]">
        <div className="text-center mb-6">
            <h2 className="text-[20px] font-bold text-[#191c1f] tracking-tight mb-1">Upload Athlete Video</h2>
            <p className="text-sm font-medium text-[#434654]">MP4, MOV, AVI up to 100MB</p>
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
                ? 'border-[#004ccd] bg-[#faf8ff]' 
                : 'border-[#c3c6d7] bg-[#faf8ff] hover:border-[#004ccd]'
          }`}
          style={{ minHeight: 160 }}
          onClick={handleButtonClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="flex flex-col items-center py-6 pointer-events-none">
            <div className={`p-4 rounded-full mb-3 transition-colors duration-300 ${isDragging ? 'bg-[#faf8ff] text-[#004ccd]' : 'bg-[#f3f3fe] text-[#00379b]'}`}>
                <UploadCloud className={`w-8 h-8 ${isDragging ? 'animate-bounce' : ''}`} />
            </div>
            <span className="text-[#191c1f] font-semibold text-sm">
              Drag &amp; drop video here or <span className="text-[#004ccd] hover:underline transition-colors">Browse</span>
            </span>
          </div>
        </div>

        {selectedFile && (
          <div className="mb-6 animate-in slide-in-from-bottom-2 fade-in duration-300">
            <div className="text-[11px] font-bold text-[#434654] uppercase tracking-wider mb-2">Selected Video</div>
            <div className="flex items-center gap-4 bg-[#faf8ff] border border-[#c3c6d7] rounded-xl p-3">
              <div className="p-2 bg-[#f3f3fe] rounded-lg text-[#004ccd]">
                <FileVideo className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#191c1f] truncate pr-4">{selectedFile.name}</p>
                <p className="text-xs text-[#737686] mt-0.5">{formatFileSize(selectedFile.size)}</p>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                disabled={uploading}
                className="p-2 text-[#737686] hover:text-[#ba1a1a] hover:bg-[#ffdad6] rounded-lg transition-colors disabled:opacity-50"
                aria-label="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="mt-4">
              <label className="block text-[11px] font-bold text-[#434654] uppercase tracking-wider mb-1.5">
                Video Name
              </label>
              <input 
                type="text" 
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. Morning Sprint Session"
                className="w-full bg-white border border-[#c3c6d7] rounded-xl px-4 py-2.5 text-[#191c1f] text-sm focus:outline-none focus:border-[#004ccd] focus:ring-2 focus:ring-[#004ccd]/20 transition-all"
                disabled={uploading}
              />
            </div>
          </div>
        )}

        {uploading && (
          <div className="w-full mb-6 animate-in fade-in">
            <div className="flex justify-between text-xs font-bold text-[#434654] mb-2">
                <span>Analyzing Biomechanics...</span>
                <span className="text-[#004ccd]">{progress}%</span>
            </div>
            <div className="w-full bg-[#e2e1ed] rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#00379b] h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <button
          type="button"
          disabled={!selectedFile || uploading}
          onClick={handleUpload}
          className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2
            ${selectedFile && !uploading
              ? 'bg-[#004ccd] hover:bg-[#003da9] text-white active:scale-[0.99]'
              : 'bg-[#faf8ff] text-[#737686] cursor-not-allowed border border-[#c3c6d7]'}
          `}
        >
          {uploading ? (
            <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
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
