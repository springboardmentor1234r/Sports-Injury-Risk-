import React, { useState, useRef, useEffect } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { UploadCloud, FileVideo, X, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const VIDEO_STORAGE_KEY = 'uploadedVideos';

export default function VideoUploadPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);

  const persistFiles = (nextFiles) => {
    const serializable = nextFiles.map(({ id, progress, file }) => ({
      id,
      progress,
      name: file?.name || '',
      size: file?.size || 0,
      type: file?.type || '',
    }));
    localStorage.setItem(VIDEO_STORAGE_KEY, JSON.stringify(serializable));
    window.dispatchEvent(new Event('videosUpdated'));
  };

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(VIDEO_STORAGE_KEY) || '[]');
      const restored = saved
        .filter(item => item && (item.name || item.file?.name))
        .map((item) => ({
          id: item.id || `${item.name}-${Date.now()}-${Math.random()}`,
          progress: item.progress || 100,
          file: {
            name: item.name || item.file?.name || 'video.mp4',
            size: item.size || item.file?.size || 0,
            type: item.type || item.file?.type || 'video/mp4',
          },
        }));
      setFiles(restored);
    } catch (error) {
      setFiles([]);
    }
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const simulateUpload = (index) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setFiles(prev => {
        const newFiles = [...prev];
        if (newFiles[index]) {
          newFiles[index].progress = progress;
        }
        return newFiles;
      });
      if (progress >= 100) clearInterval(interval);
    }, 500);
  };

  const addFiles = (selectedFiles) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const validVideos = Array.from(selectedFiles).filter((file) => file.type.startsWith('video/'));
    if (validVideos.length === 0) return;

    const newEntries = validVideos.map((file) => ({
      file,
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      progress: 0,
    }));

    setFiles((prev) => {
      const nextFiles = [...prev, ...newEntries];
      const startIndex = prev.length;
      newEntries.forEach((_, idx) => {
        simulateUpload(startIndex + idx);
      });
      persistFiles(nextFiles);
      return nextFiles;
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleFileChange = (e) => {
    addFiles(e.target.files);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Upload Video for Analysis</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Upload biomechanical movement videos to assess injury risks.</p>
      </div>

      <Card glass className="p-8">
        <div 
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
            isDragging 
              ? 'border-primary bg-primary/5' 
              : 'border-gray-300 dark:border-gray-700 hover:border-primary/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <UploadCloud className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Drag & drop your videos here
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            MP4, WebM or MOV, up to 500MB
          </p>
          <Button type="button" onClick={() => fileInputRef.current?.click()}>Browse Files</Button>
        </div>
      </Card>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Uploading Files</h3>
            {files.map((fileObj, idx) => (
              <Card key={fileObj.id} className="p-4 flex items-center gap-4">
                <div className="p-3 bg-gray-100 dark:bg-dark-bg rounded-lg">
                  <FileVideo className="w-6 h-6 text-gray-500" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{fileObj.file.name}</span>
                    <span className="text-sm text-gray-500">{fileObj.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${fileObj.progress}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  {fileObj.progress === 100 ? (
                    <CheckCircle className="w-6 h-6 text-success" />
                  ) : (
                    <button onClick={() => {
                      const nextFiles = files.filter(f => f.id !== fileObj.id);
                      setFiles(nextFiles);
                      persistFiles(nextFiles);
                    }}>
                      <X className="w-5 h-5 text-gray-400 hover:text-danger" />
                    </button>
                  )}
                </div>
              </Card>
            ))}
            
            {files.every(f => f.progress === 100) && (
              <Button className="w-full mt-4">Proceed to Analysis</Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
