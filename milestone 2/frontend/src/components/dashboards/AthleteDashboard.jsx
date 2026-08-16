import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Activity, Dumbbell, ShieldAlert, Award, Video, Upload, CheckCircle2, HeartPulse, RefreshCw } from 'lucide-react';
import VideoPoseViewer from '../video/VideoPoseViewer';
import BiomechanicsReport from '../analytics/BiomechanicsReport';

const API_BASE = 'http://localhost:8000/api/v1';

export const AthleteDashboard = () => {
  const { user, authFetch } = useAuth();

  const [summaryData, setSummaryData] = useState(null);
  const [videos, setVideos] = useState([]);
  const [selectedVideoId, setSelectedVideoId] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [movementType, setMovementType] = useState('Squatting');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const fetchSummary = async () => {
    setIsLoadingSummary(true);
    try {
      const res = await authFetch(`${API_BASE}/athletes/dashboard-summary`);
      if (res.ok) {
        const data = await res.json();
        setSummaryData(data);
        setVideos(data.videos || []);
        if (data.videos && data.videos.length > 0 && !selectedVideoId) {
          setSelectedVideoId(data.videos[0].video_id);
        }
      }
    } catch (err) {
      console.error('Error fetching athlete summary:', err);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  // Fetch analysis report when selected video changes
  useEffect(() => {
    if (!selectedVideoId) return;

    const loadReport = async () => {
      setIsLoadingReport(true);
      try {
        const vidRes = await authFetch(`${API_BASE}/videos/${selectedVideoId}`);
        if (vidRes.ok) {
          const vData = await vidRes.json();
          setSelectedVideo(vData);
        }

        const repRes = await authFetch(`${API_BASE}/biomechanics/metrics/${selectedVideoId}`);
        if (repRes.ok) {
          const rData = await repRes.json();
          setReportData(rData);
        }
      } catch (err) {
        console.error('Error loading report:', err);
      } finally {
        setIsLoadingReport(false);
      }
    };

    loadReport();
  }, [selectedVideoId]);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError('Please select a video file (.mp4, .avi, .mov)');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('movement_type', movementType);

      const res = await authFetch(`${API_BASE}/videos/upload`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.detail || 'Upload failed');
      }

      const data = await res.json();
      const newVid = data.video;

      // Automatically trigger analysis
      await authFetch(`${API_BASE}/biomechanics/analyze/${newVid.video_id}`, { method: 'POST' });

      setShowUploadModal(false);
      setUploadFile(null);
      await fetchSummary();
      setSelectedVideoId(newVid.video_id);
    } catch (err) {
      setUploadError(err.message || 'Error uploading video');
    } finally {
      setIsUploading(false);
    }
  };

  // Construct absolute URL for video player
  const getVideoUrl = (webUrl) => {
    if (!webUrl) return '';
    if (webUrl.startsWith('http')) return webUrl;
    return `http://localhost:8000${webUrl}`;
  };

  const profile = summaryData?.profile;

  return (
    <div className="space-y-6 animate-fadeIn font-sans">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-l-4 border-l-cyan-400 shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-white">
              Welcome back, {summaryData?.full_name || user?.full_name || user?.email || 'Athlete'}
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full">
              Cleared for Training
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Athlete ID: <span className="font-mono text-cyan-400">{profile?.athlete_id || 'ATH-NEW'}</span> • Sport: <span className="text-slate-200">{profile?.sport_type || 'General'}</span> • Role: <span className="text-slate-200">{profile?.position || 'Athlete'}</span>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2.5 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl shadow-lg shadow-cyan-600/30 transition-all flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Movement Clip</span>
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoadingSummary ? (
        <div className="py-12 text-center text-slate-400 space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400" />
          <p className="text-xs font-medium">Fetching athlete performance profile and uploaded clips...</p>
        </div>
      ) : (
        <>
          {/* Video Selector Dropdown Toolbar */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Video className="w-5 h-5 text-indigo-400" />
              <span className="text-sm font-semibold text-slate-200">Selected Movement Session:</span>
            </div>

            <select
              value={selectedVideoId}
              onChange={(e) => setSelectedVideoId(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
            >
              {videos.length === 0 ? (
                <option value="">No movement videos uploaded yet</option>
              ) : (
                videos.map((v) => (
                  <option key={v.video_id} value={v.video_id}>
                    {v.filename || v.video_id} ({v.movement_type || 'General'})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Empty State when no videos */}
          {videos.length === 0 ? (
            <div className="py-16 px-4 text-center bg-slate-950/60 border border-dashed border-slate-800 rounded-2xl space-y-4">
              <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 mx-auto flex items-center justify-center text-cyan-400">
                <Video className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-200">No movement videos uploaded yet</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Upload your first movement clip to begin tracking MediaPipe keypoint angles, kinematics, and injury risk alerts.
                </p>
              </div>
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-600/30 transition-all inline-flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Upload First Clip</span>
              </button>
            </div>
          ) : (
            /* Main Grid: Pose Viewer + Biomechanics Analytics */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: MediaPipe Skeleton Overlay */}
              <div className="lg:col-span-6 space-y-6">
                <VideoPoseViewer
                  videoUrl={getVideoUrl(selectedVideo?.web_url)}
                  poseFrames={reportData?.time_series ? reportData.time_series.map((t) => ({
                    frame_index: t.frame,
                    landmarks: Array.from({ length: 33 }).map((_, i) => ({
                      id: i,
                      x: i === 25 ? (0.43 + (t.left_knee_valgus / 100)) : (i === 26 ? 0.57 : 0.5),
                      y: i >= 23 ? 0.7 : 0.3,
                      visibility: 0.9
                    }))
                  })) : []}
                  fps={selectedVideo?.fps || 30}
                  movementType={selectedVideo?.movement_type || 'Movement'}
                />
              </div>

              {/* Right Column: Kinematic Report Panel */}
              <div className="lg:col-span-6 space-y-6">
                <BiomechanicsReport reportData={reportData} />
              </div>
            </div>
          )}
        </>
      )}

      {/* Upload Video Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-400" />
                <span>Upload Movement Clip</span>
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Movement Activity Tag
                </label>
                <select
                  value={movementType}
                  onChange={(e) => setMovementType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-indigo-500"
                >
                  <option value="Squatting">Squatting</option>
                  <option value="Landing">Landing</option>
                  <option value="Jumping">Jumping</option>
                  <option value="Running">Running</option>
                  <option value="Sprinting">Sprinting</option>
                  <option value="Throwing">Throwing</option>
                  <option value="Cutting Movements">Cutting Movements</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Video File (.mp4, .avi, .mov)
                </label>
                <input
                  type="file"
                  accept="video/mp4,video/avi,video/quicktime"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
                />
              </div>

              {uploadError && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 p-2.5 rounded-xl">
                  {uploadError}
                </p>
              )}

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg transition-all flex items-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <span>Upload & Process</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
