import React, { useEffect, useMemo, useRef, useState } from 'react';
import axiosInstance from '../services/axiosInstance';

const acceptedTypes = ['mp4', 'mov', 'avi', 'webm'];
const maxSizeBytes = 100 * 1024 * 1024;

const formatBytes = (size) => {
  if (!size && size !== 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = size;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString();
};

const RiskAnalysis = () => {
  const [athletes, setAthletes] = useState([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState('');
  const [videos, setVideos] = useState([]);
  const [loadingAthletes, setLoadingAthletes] = useState(true);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [status, setStatus] = useState({ type: '', text: '' });
  const [isDragging, setIsDragging] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const fileInputRef = useRef(null);

  const selectedAthlete = useMemo(() => athletes.find((athlete) => athlete._id === selectedAthleteId) || null, [athletes, selectedAthleteId]);

  const fetchAthletes = async () => {
    try {
      setLoadingAthletes(true);
      const response = await axiosInstance.get('/athletes');
      setAthletes(response?.data?.data || []);
    } catch (error) {
      const message = error?.response?.data?.message || 'Unable to load athletes.';
      setStatus({ type: 'error', text: message });
    } finally {
      setLoadingAthletes(false);
    }
  };

  const fetchVideos = async (athleteId) => {
    if (!athleteId) {
      setVideos([]);
      return;
    }

    try {
      setLoadingVideos(true);
      const response = await axiosInstance.get(`/videos/athlete/${athleteId}`);
      setVideos(response?.data?.data || []);
    } catch (error) {
      const message = error?.response?.data?.message || 'Unable to load videos.';
      setStatus({ type: 'error', text: message });
    } finally {
      setLoadingVideos(false);
    }
  };

  useEffect(() => {
    fetchAthletes();
  }, []);

  useEffect(() => {
    if (selectedAthleteId) {
      fetchVideos(selectedAthleteId);
    } else {
      setVideos([]);
    }
  }, [selectedAthleteId]);

  const validateFile = (file) => {
    if (!file) {
      return 'Please choose a video file.';
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !acceptedTypes.includes(extension)) {
      return 'Only MP4, MOV, AVI, and WEBM files are supported.';
    }

    if (file.size > maxSizeBytes) {
      return 'File size exceeds the 100 MB limit.';
    }

    return '';
  };

  const handleFileSelection = (file) => {
    const validationMessage = validateFile(file);
    if (validationMessage) {
      setSelectedFile(null);
      setStatus({ type: 'error', text: validationMessage });
      return;
    }

    setSelectedFile(file);
    setStatus({ type: '', text: '' });
  };

  const handleInputChange = (event) => {
    const file = event.target.files?.[0];
    handleFileSelection(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    handleFileSelection(file);
  };

  const handleUpload = async () => {
    if (!selectedAthleteId) {
      setStatus({ type: 'error', text: 'Please select an athlete before uploading.' });
      return;
    }

    if (!selectedFile) {
      setStatus({ type: 'error', text: 'Please choose a video file to upload.' });
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setStatus({ type: '', text: '' });

    const formData = new FormData();
    formData.append('video', selectedFile);
    formData.append('athleteId', selectedAthleteId);

    try {
      await axiosInstance.post('/videos', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setUploadProgress(percent);
        },
      });

      setStatus({ type: 'success', text: 'Video uploaded successfully.' });
      setSelectedFile(null);
      setUploadProgress(100);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      await fetchVideos(selectedAthleteId);
    } catch (error) {
      const message = error?.response?.data?.message || 'Video upload failed.';
      setStatus({ type: 'error', text: message });
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (videoId) => {
    if (!window.confirm('Are you sure you want to delete this video?')) {
      return;
    }

    try {
      setDeletingId(videoId);
      await axiosInstance.delete(`/videos/${videoId}`);
      setStatus({ type: 'success', text: 'Video deleted successfully.' });
      await fetchVideos(selectedAthleteId);
    } catch (error) {
      const message = error?.response?.data?.message || 'Unable to delete video.';
      setStatus({ type: 'error', text: message });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white font-sans">Video Upload</h2>
        <p className="text-sm text-slate-400">Upload and manage athlete training videos for future analysis workflows.</p>
      </div>

      <div className="glass-panel rounded-2xl border border-slate-900 p-6">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-white">Select Athlete</h3>
          <p className="text-sm text-slate-400">Choose an athlete before uploading a new video clip.</p>
        </div>

        {loadingAthletes ? (
          <div className="text-sm text-slate-400">Loading athletes...</div>
        ) : (
          <select
            value={selectedAthleteId}
            onChange={(event) => setSelectedAthleteId(event.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="">Select an athlete</option>
            {athletes.map((athlete) => (
              <option key={athlete._id} value={athlete._id}>{athlete.fullName}</option>
            ))}
          </select>
        )}

        {selectedAthlete && (
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-300">
            Uploading for <span className="font-semibold text-white">{selectedAthlete.fullName}</span>
          </div>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="glass-panel rounded-2xl border border-slate-900 p-6">
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-white">Upload Video</h3>
            <p className="text-sm text-slate-400">Drag and drop a supported video file or browse your device.</p>
          </div>

          <div
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`rounded-2xl border border-dashed p-6 text-center transition ${isDragging ? 'border-brand-500 bg-brand-500/10' : 'border-slate-700 bg-slate-900/40'}`}
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-slate-800 bg-slate-950/70 text-brand-400">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 4v8m0 0l4-4m-4 4l-4-4" />
              </svg>
            </div>
            <p className="mt-4 text-sm text-slate-300">{isDragging ? 'Drop your video here' : 'Drag and drop a video here'}</p>
            <p className="mt-2 text-xs text-slate-500">Supported: MP4, MOV, AVI, WEBM • Max 100 MB</p>
            <input ref={fileInputRef} type="file" accept=".mp4,.mov,.avi,.webm" onChange={handleInputChange} className="mt-4 hidden" />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-4 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500">
              Browse Files
            </button>
          </div>

          {selectedFile && (
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-white">{selectedFile.name}</p>
                  <p className="text-xs text-slate-400">{formatBytes(selectedFile.size)}</p>
                </div>
                <button type="button" onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="text-xs text-slate-400 transition hover:text-white">
                  Clear
                </button>
              </div>
            </div>
          )}

          {uploading && (
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-sm text-slate-400">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800">
                <div className="h-2 rounded-full bg-brand-500 transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}

          {status.text && (
            <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${status.type === 'error' ? 'border-red-500/30 bg-red-500/10 text-red-300' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'}`}>
              {status.text}
            </div>
          )}

          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading || !selectedAthleteId || !selectedFile}
            className="mt-5 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading ? 'Uploading...' : 'Upload Video'}
          </button>
        </section>

        <section className="glass-panel rounded-2xl border border-slate-900 p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Uploaded Videos</h3>
              <p className="text-sm text-slate-400">Review uploaded clips and track current processing status.</p>
            </div>
          </div>

          {loadingVideos ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-center text-sm text-slate-400">Loading videos...</div>
          ) : !selectedAthleteId ? (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center text-sm text-slate-400">Select an athlete to view uploaded videos.</div>
          ) : !videos.length ? (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center text-sm text-slate-400">No videos uploaded yet for this athlete.</div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40">
              <table className="min-w-full text-left text-sm text-slate-300">
                <thead className="border-b border-slate-800 bg-slate-950/60 text-xs uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Video Name</th>
                    <th className="px-4 py-3">Upload Date</th>
                    <th className="px-4 py-3">File Size</th>
                    <th className="px-4 py-3">Processing Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {videos.map((video) => (
                    <tr key={video._id} className="border-b border-slate-800/70 last:border-b-0 hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-medium text-white">{video.originalFileName}</td>
                      <td className="px-4 py-3">{formatDate(video.uploadDate)}</td>
                      <td className="px-4 py-3">{formatBytes(video.fileSize)}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full border border-slate-700 bg-slate-800/70 px-2.5 py-1 text-xs text-slate-300">
                          {video.processingStatus || 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleDelete(video._id)}
                          disabled={deletingId === video._id}
                          className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-red-500 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingId === video._id ? 'Deleting...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default RiskAnalysis;
