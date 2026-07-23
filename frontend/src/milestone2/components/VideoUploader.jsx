import React, { useRef, useState } from 'react';
import { UploadCloud, FileVideo, AlertOctagon, RefreshCw } from 'lucide-react';

const ALLOWED_MIME = ['video/mp4', 'video/avi', 'video/quicktime', 'video/webm', 'video/x-msvideo'];
const MAX_SIZE = 100 * 1024 * 1024; // 100 MB

export const VideoUploader = ({ onFileSelect, uploading, error, selectedFile }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!uploading) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (uploading) return;

    const file = e.dataTransfer.files[0];
    if (file) validateAndSetFile(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) validateAndSetFile(file);
  };

  const validateAndSetFile = (file) => {
    // Validate format
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const validExtensions = ['.mp4', '.avi', '.mov', '.webm'];
    
    if (!validExtensions.includes(fileExt) && !ALLOWED_MIME.includes(file.type)) {
      alert("Invalid format! Supported file formats: MP4, AVI, MOV, WEBM.");
      return;
    }

    // Validate size
    if (file.size > MAX_SIZE) {
      alert("File is too large! Maximum allowed video file size is 100MB.");
      return;
    }

    onFileSelect(file);
  };

  const triggerFileInput = () => {
    if (!uploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={`hud-glass-panel p-8 rounded-xl border border-dashed text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-4 ${
          isDragOver
            ? 'border-hud-blue bg-hud-blue/10 scale-[0.99] shadow-lg shadow-hud-blue-glow'
            : selectedFile
              ? 'border-hud-green bg-hud-green-glow/5'
              : 'border-hud-border hover:border-gray-500 bg-hud-dark/20'
        } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="video/mp4,video/avi,video/quicktime,video/webm"
          className="hidden"
          disabled={uploading}
        />

        {selectedFile ? (
          <div className="flex flex-col items-center gap-3">
            <FileVideo className="w-10 h-10 text-hud-green" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-white truncate max-w-[280px]">
                {selectedFile.name}
              </p>
              <p className="text-[10px] text-gray-400">
                Ready for upload. Tap to select a different video.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <UploadCloud className="w-10 h-10 text-hud-blue/70" />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-white">
                Drag & drop your athletic video file here
              </p>
              <p className="text-[10px] text-gray-500">
                Supports MP4, AVI, MOV, or WEBM (Max 100MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-hud-danger/10 border border-hud-danger/30 text-hud-danger text-[10px] font-hud-mono flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default VideoUploader;
