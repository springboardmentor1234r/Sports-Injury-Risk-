import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Film, Loader2, CheckCircle2, AlertOctagon, 
  Trash2, Play, Users, CloudUpload, PlayCircle, ShieldCheck
} from 'lucide-react';
import api from '../../utils/api';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Toast from '../../components/Toast';
import { SkeletonCard } from '../../components/Skeleton';

// Reusable components
import ActivitySelector from '../components/ActivitySelector';
import VideoUploader from '../components/VideoUploader';
import UploadProgress from '../components/UploadProgress';
import VideoPreview from '../components/VideoPreview';
import RecentUploads from '../components/RecentUploads';

const BACKEND_URL = 'http://127.0.0.1:8000';

export const VideoUpload = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [athletes, setAthletes] = useState([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState('');
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [selectedActivity, setSelectedActivity] = useState('Running');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, success, error
  const [uploadError, setUploadError] = useState('');
  const [uploadedVideoMeta, setUploadedVideoMeta] = useState(null);

  // Video list state
  const [videos, setVideos] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [deletingId, setDeletingId] = useState('');

  // Active preview
  const [activePreviewVideo, setActivePreviewVideo] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);

  const navigate = useNavigate();

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Fetch user on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/me');
        setUser(res.data);
        
        // If athlete, auto-select them
        if (res.data.role === 'Athlete') {
          // Resolve athlete details by matching user name
          const listRes = await api.get('/athletes');
          const list = Array.isArray(listRes.data) ? listRes.data : (listRes.data?.athletes || []);
          const match = list.find(ath => ath.full_name?.toLowerCase() === res.data.name?.toLowerCase());
          if (match) {
            setSelectedAthleteId(match._id);
          }
        }
      } catch (err) {
        console.error(err);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  // 2. Fetch athletes if Operator (Coach/Admin/Physio/Scientist)
  useEffect(() => {
    if (!user || user.role === 'Athlete') return;
    const fetchAthletes = async () => {
      try {
        const res = await api.get('/athletes');
        const list = Array.isArray(res.data) ? res.data : (res.data?.athletes || []);
        setAthletes(list);
        if (list.length > 0) {
          setSelectedAthleteId(list[0]._id);
        }
      } catch (err) {
        console.error("Failed to load athletes list:", err);
      }
    };
    fetchAthletes();
  }, [user]);

  // 3. Fetch list of videos
  const fetchVideos = async () => {
    if (!selectedAthleteId) return;
    setListLoading(true);
    try {
      const res = await api.get('/milestone2/videos', {
        params: { athlete_id: selectedAthleteId }
      });
      setVideos(res.data.videos || []);
    } catch (err) {
      console.error("Failed to load video list:", err);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [selectedAthleteId]);

  // Poll video status automatically if any video is processing
  useEffect(() => {
    const hasProcessing = videos.some(v => v.status === 'processing');
    if (!hasProcessing) return;

    const interval = setInterval(() => {
      fetchVideos();
    }, 2000);

    return () => clearInterval(interval);
  }, [videos]);

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setUploadStatus('idle');
    setUploadProgress(0);
    setUploadError('');
    setUploadedVideoMeta(null);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      showToast("Please choose a video file first.", "danger");
      return;
    }
    if (!selectedAthleteId) {
      showToast("Please select a target athlete profile.", "danger");
      return;
    }

    setUploading(true);
    setUploadStatus('uploading');
    setUploadProgress(0);
    setUploadError('');

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('athlete_id', selectedAthleteId);
    formData.append('activity', selectedActivity);

    try {
      const res = await api.post('/milestone2/videos/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        }
      });
      
      setUploadStatus('success');
      setUploadedVideoMeta(res.data);
      showToast("Biometric video uploaded and registered successfully.", "success");
      
      // Reset upload panel
      setSelectedFile(null);
      
      // Reload list
      fetchVideos();
    } catch (err) {
      console.error("Upload error:", err);
      const msg = err.response?.data?.detail || "Upload connection refused.";
      setUploadStatus('error');
      setUploadError(msg);
      showToast(msg, "danger");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteVideo = async (id) => {
    if (!window.confirm("Permanently erase this video session from disk and database?")) return;
    setDeletingId(id);
    try {
      await api.delete(`/milestone2/videos/${id}`);
      showToast("Video session successfully deleted.", "success");
      if (activePreviewVideo?._id === id) {
        setActivePreviewVideo(null);
      }
      fetchVideos();
    } catch (err) {
      console.error("Delete failure:", err);
      showToast("Failed to delete video record.", "danger");
    } finally {
      setDeletingId('');
    }
  };

  const handleSelectPreview = (vid) => {
    setActivePreviewVideo(vid);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-hud-black flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin h-8 w-8 text-hud-blue" />
          <span className="text-hud-blue text-sm font-semibold animate-pulse">Synchronizing Biometrics Analyser...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hud-black text-white p-6 md:p-8 font-sans space-y-6">
      
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-hud-border pb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-lg border border-hud-border hover:border-hud-blue hover:text-hud-blue cursor-pointer transition-colors bg-hud-dark/40"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Biomechanics Analyser - Video Upload
            </h1>
            <p className="text-gray-400 text-xs mt-1">
              Select an athletic activity, choose your video file, and launch the analytical telemetry ingestion pipeline.
            </p>
          </div>
        </div>

        <div className="font-hud-mono text-[10px] text-hud-blue px-2.5 py-1 rounded-full bg-hud-blue/10 border border-hud-blue/20">
          VID_INGESTION_MODULE // ONLINE
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Upload Forms */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6 space-y-5 border-hud-border">
            
            {/* Athlete Select Field for Operators */}
            {user?.role !== 'Athlete' ? (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Target Athlete Profile
                </label>
                <div className="relative">
                  <select
                    className="w-full px-4 py-2.5 bg-hud-dark border border-hud-border rounded-lg text-xs text-white appearance-none focus:outline-none focus:border-hud-blue focus:ring-1 focus:ring-hud-blue/30 transition-all cursor-pointer"
                    value={selectedAthleteId}
                    onChange={(e) => {
                      setSelectedAthleteId(e.target.value);
                      setActivePreviewVideo(null);
                    }}
                  >
                    {athletes.map((ath) => (
                      <option key={ath._id} value={ath._id} className="bg-hud-card">
                        {ath.full_name} ({ath.athlete_id})
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-lg bg-hud-blue/5 border border-hud-blue/20 text-xs flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-hud-blue" />
                <span className="text-gray-300">
                  Secure upload profile linked to your authenticated athlete key: <strong className="text-hud-blue">{user.name}</strong>
                </span>
              </div>
            )}

            {/* Choose Activity */}
            <ActivitySelector
              selected={selectedActivity}
              onChange={setSelectedActivity}
            />

            {/* Ingestion Panel */}
            <VideoUploader
              onFileSelect={handleFileSelect}
              uploading={uploading}
              error={uploadError}
              selectedFile={selectedFile}
            />

            {/* Submit Actions */}
            {selectedFile && (
              <div className="flex gap-3 justify-end pt-3 border-t border-hud-border">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl('');
                    setUploadStatus('idle');
                  }}
                  disabled={uploading}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleUploadSubmit}
                  loading={uploading}
                >
                  <CloudUpload className="w-4 h-4" />
                  <span>Start Upload Ingestion</span>
                </Button>
              </div>
            )}

            {/* Upload Progress Loader */}
            {uploadStatus !== 'idle' && (
              <UploadProgress
                progress={uploadProgress}
                status={uploadStatus}
                filename={selectedFile?.name || uploadedVideoMeta?.original_filename}
                filesize={selectedFile?.size || uploadedVideoMeta?.file_size}
                error={uploadError}
              />
            )}

          </Card>
        </div>

        {/* RIGHT COLUMN: Active Preview Panel */}
        <div className="lg:col-span-5 space-y-6">
          {activePreviewVideo ? (
            <VideoPreview
              meta={activePreviewVideo}
              url={`${BACKEND_URL}/uploads/${activePreviewVideo.stored_filename}`}
            />
          ) : selectedFile ? (
            <VideoPreview
              file={selectedFile}
              url={previewUrl}
            />
          ) : (
            <div className="hud-glass-panel p-6 rounded-xl border border-hud-border text-center space-y-3 py-16 text-gray-500">
              <PlayCircle className="w-12 h-12 text-gray-600 mx-auto" />
              <p className="text-xs font-semibold uppercase tracking-wider">
                Select a video row to preview session metrics.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* RECENT UPLOADS GRID */}
      <RecentUploads
        videos={videos}
        loading={listLoading}
        onSelect={handleSelectPreview}
        onDelete={handleDeleteVideo}
        deletingId={deletingId}
        userRole={user?.role}
      />

      {/* Toast Notification */}
      <Toast toast={toast} />

    </div>
  );
};

export default VideoUpload;
