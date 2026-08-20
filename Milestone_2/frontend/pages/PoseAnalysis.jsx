import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Film, Loader2, Sparkles } from 'lucide-react';
import api from '../../utils/api';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Toast from '../../components/Toast';

// Components
import PoseCanvas from '../components/PoseCanvas';
import PoseControls from '../components/PoseControls';
import LandmarkTable from '../components/LandmarkTable';
import PoseTimeline from '../components/PoseTimeline';
import FrameNavigator from '../components/FrameNavigator';
import ConfidenceIndicator from '../components/ConfidenceIndicator';

const BACKEND_URL = 'http://127.0.0.1:8000';

export const PoseAnalysis = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const [selectedVideoId, setSelectedVideoId] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);

  // Pose session states
  const [poseSession, setPoseSession] = useState(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle'); // idle, processing, completed, failed
  const [error, setError] = useState('');

  // Toast
  const [toast, setToast] = useState(null);
  const pollIntervalRef = useRef(null);

  const navigate = useNavigate();

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Fetch user & load video records
  useEffect(() => {
    const initPage = async () => {
      try {
        const userRes = await api.get('/me');
        setUser(userRes.data);

        // Fetch videos list
        const vidRes = await api.get('/milestone2/videos');
        const vids = vidRes.data.videos || [];
        setVideos(vids);
        
        if (vids.length > 0) {
          const queryParams = new URLSearchParams(window.location.search);
          const queryVideoId = queryParams.get('video_id');
          const target = queryVideoId && vids.find(v => v._id === queryVideoId) ? vids.find(v => v._id === queryVideoId) : vids[0];
          setSelectedVideoId(target._id);
          setSelectedVideo(target);
        }
      } catch (err) {
        console.error("Initialization failed:", err);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    initPage();
  }, [navigate]);

  // 2. Fetch existing pose analysis when selected video changes
  useEffect(() => {
    if (!selectedVideoId) return;
    
    // Clear any active polling loops
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    const checkExistingPose = async () => {
      setStatus('idle');
      setPoseSession(null);
      setError('');
      setProgress(0);
      setCurrentFrame(0);

      // Check if this video is currently processing
      const matchedVid = videos.find(v => v._id === selectedVideoId);
      if (matchedVid && matchedVid.status === 'processing') {
        try {
          const sessRes = await api.get(`/milestone2/analysis/status-by-video/${selectedVideoId}`);
          if (sessRes.data && sessRes.data.session_id) {
            setStatus('processing');
            // Look up pose ID to start polling
            const poseRes = await api.get(`/milestone2/pose/video/${selectedVideoId}`);
            if (poseRes.data && poseRes.data._id) {
              startPolling(poseRes.data._id);
            }
            return;
          }
        } catch (sessErr) {
          // Proceed to auto-start if session not created yet
        }
      }

      try {
        const res = await api.get(`/milestone2/pose/video/${selectedVideoId}`);
        const session = res.data;
        setPoseSession(session);
        setStatus(session.processing_status);
        
        // Auto-seek to first frame that has landmarks (frame 0 is often empty)
        if (session.processing_status === 'completed' && session.frames) {
          const firstGoodFrame = session.frames.findIndex(f => f.landmarks && f.landmarks.length > 0);
          if (firstGoodFrame > 0) setCurrentFrame(firstGoodFrame);
        }
        
        if (session.processing_status === 'processing') {
          startPolling(session._id);
        } else if (session.processing_status === 'failed') {
          setError(session.error_message || 'Pose extraction failed.');
        }
      } catch (err) {
        // Automatically start the pose estimation pipeline
        handleStartAnalysis();
      }
    };
    
    checkExistingPose();
  }, [selectedVideoId, videos]);

  // Cleanup polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const handleStartAnalysis = async () => {
    if (!selectedVideoId) return;
    setProcessing(true);
    setError('');
    setProgress(0);
    
    try {
      const res = await api.post(`/milestone2/pose/process/${selectedVideoId}`);
      const session = res.data;
      setPoseSession(session);
      setStatus(session.processing_status);
      showToast("Ingesting frame pipeline in background...", "success");
      
      startPolling(session._id);
    } catch (err) {
      console.error("Process start failure:", err);
      const msg = err.response?.data?.detail || "Failed to launch pose extractor.";
      setError(msg);
      showToast(msg, "danger");
      setProcessing(false);
    }
  };

  const startPolling = (analysisId) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    setProcessing(true);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/milestone2/pose/status/${analysisId}`);
        const data = res.data;
        
        const calculatedProgress = data.total_frames > 0 
          ? Math.round((data.frames_processed / data.total_frames) * 100)
          : 0;
          
        setProgress(Math.min(calculatedProgress, 99)); // Keep at 99% until completed
        setStatus(data.processing_status);

        if (data.processing_status === 'completed') {
          clearInterval(pollIntervalRef.current);
          setProcessing(false);
          setProgress(100);
          showToast("Pose estimation coordinates successfully ingested!", "success");
          
          // Load final results
          const resultsRes = await api.get(`/milestone2/pose/results/${analysisId}`);
          const finalSession = resultsRes.data;
          setPoseSession(finalSession);
          // Seek to first frame with landmarks
          if (finalSession.frames) {
            const firstGoodFrame = finalSession.frames.findIndex(f => f.landmarks && f.landmarks.length > 0);
            if (firstGoodFrame > 0) setCurrentFrame(firstGoodFrame);
          }
        } else if (data.processing_status === 'failed') {
          clearInterval(pollIntervalRef.current);
          setProcessing(false);
          setError(data.error_message || 'Processing crashed.');
          showToast("Extraction pipeline crashed.", "danger");
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 1500);
  };

  const handleFrameChange = (idx) => {
    if (poseSession && poseSession.frames && idx >= 0 && idx < poseSession.frames.length) {
      setCurrentFrame(idx);
    }
  };

  const handleVideoSelect = (e) => {
    const id = e.target.value;
    setSelectedVideoId(id);
    const match = videos.find(v => v._id === id);
    setSelectedVideo(match);
  };

  const currentFrameData = poseSession?.frames?.[currentFrame] || null;

  if (loading) {
    return (
      <div className="min-h-screen bg-hud-black flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin h-8 w-8 text-hud-blue" />
          <span className="text-hud-blue text-sm font-semibold animate-pulse">Synchronizing Pose Engine...</span>
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
              Skeletal Pose Ingestion
            </h1>
            <p className="text-gray-400 text-xs mt-1">
              Select a synced video source to ingest skeletal frame landmarks and track coordinate visibility vectors.
            </p>
          </div>
        </div>

        <div className="font-hud-mono text-[10px] text-hud-blue px-2.5 py-1 rounded-full bg-hud-blue/10 border border-hud-blue/20">
          POSE_ESTIMATION_ENGINE // ONLINE
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Player Canvas & Frame Navigators */}
        <div className="lg:col-span-8 space-y-5">
          <PoseCanvas
            videoUrl={selectedVideo ? `${BACKEND_URL}/uploads/${selectedVideo.stored_filename}` : ''}
            landmarks={currentFrameData?.landmarks || []}
            currentFrame={currentFrame}
            onFrameUpdate={handleFrameChange}
            totalFrames={poseSession?.frames?.length || 1}
            videoFps={selectedVideo?.fps || 0}
          />

          {status === 'completed' && poseSession?.frames && (
            <>
              <FrameNavigator
                currentFrame={currentFrame}
                totalFrames={poseSession.frames.length}
                onChange={handleFrameChange}
              />
              <PoseTimeline
                frames={poseSession.frames}
                currentFrame={currentFrame}
                onChange={handleFrameChange}
              />
            </>
          )}
        </div>

        {/* RIGHT COLUMN: Video selection and configurations */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Video Selector Dropdown */}
          <div className="hud-glass-panel p-5 rounded-xl border border-hud-border space-y-3">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Select Ingested Video Source
            </label>
            {videos.length > 0 ? (
              <div className="relative">
                <select
                  className="w-full px-4 py-2.5 bg-hud-dark border border-hud-border rounded-lg text-xs text-white appearance-none focus:outline-none focus:border-hud-blue focus:ring-1 focus:ring-hud-blue/30 transition-all cursor-pointer"
                  value={selectedVideoId}
                  onChange={handleVideoSelect}
                >
                  {videos.map((vid) => (
                    <option key={vid._id} value={vid._id} className="bg-hud-card">
                      {vid.activity} - {vid.original_filename}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                  <Film className="w-4 h-4" />
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500 font-hud-mono">
                No video files synced. Go to upload first.
              </p>
            )}
          </div>

          {/* Engine controller */}
          <PoseControls
            onStart={handleStartAnalysis}
            processing={processing}
            status={status}
            progress={progress}
            error={error}
            userRole={user?.role}
          />

          {/* Confidence vector */}
          {status === 'completed' && currentFrameData && (
            <ConfidenceIndicator
              value={currentFrameData.average_confidence}
            />
          )}

          {/* Coordinates table */}
          {status === 'completed' && currentFrameData && (
            <LandmarkTable
              landmarks={currentFrameData.landmarks}
            />
          )}

        </div>

      </div>

      {/* Toast Notification */}
      <Toast toast={toast} />

    </div>
  );
};

export default PoseAnalysis;
