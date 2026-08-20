import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Film, Loader2, Play, Activity } from 'lucide-react';
import api from '../../utils/api';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Toast from '../../components/Toast';

// Components
import SkeletonViewer from '../components/SkeletonViewer';
import JointAngleCard from '../components/JointAngleCard';
import AngleHeatmap from '../components/AngleHeatmap';
import MetricsDashboard from '../components/MetricsDashboard';
import FrameNavigator from '../components/FrameNavigator';
import PoseTimeline from '../components/PoseTimeline';

const BACKEND_URL = 'http://127.0.0.1:8000';

export const Biomechanics = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const [selectedVideoId, setSelectedVideoId] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);

  // Biomechanics Analysis states
  const [analysisSession, setAnalysisSession] = useState(null);
  const [skeletonData, setSkeletonData] = useState(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle'); // idle, processing, completed, failed, no_pose
  const [error, setError] = useState('');

  // Toast
  const [toast, setToast] = useState(null);
  const pollIntervalRef = useRef(null);

  const navigate = useNavigate();

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const initPage = async () => {
      try {
        const userRes = await api.get('/me');
        setUser(userRes.data);

        // Fetch videos
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

  useEffect(() => {
    if (!selectedVideoId) return;

    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    const checkExistingAnalysis = async () => {
      setStatus('idle');
      setAnalysisSession(null);
      setSkeletonData(null);
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
            startPolling(sessRes.data.session_id);
            return;
          }
        } catch (sessErr) {
          // Proceed to auto-start if session not created yet
        }
      }

      try {
        // Fetch completed biomechanics results
        const res = await api.get(`/milestone2/analysis/biomechanics/${selectedVideoId}`);
        setAnalysisSession(res.data);
        
        // Fetch completed skeleton details for player overlay
        const skelRes = await api.get(`/milestone2/analysis/skeleton/${selectedVideoId}`);
        setSkeletonData(skelRes.data);
        
        setStatus('completed');
      } catch (err) {
        // Automatically trigger biomechanics start pipeline
        handleStartAnalysis();
      }
    };

    checkExistingAnalysis();
  }, [selectedVideoId, videos]);

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const handleStartAnalysis = async () => {
    if (!selectedVideoId) return;
    setProcessing(true);
    setError('');
    setProgress(0);

    try {
      const res = await api.post(`/milestone2/analysis/start/${selectedVideoId}`);
      const data = res.data;
      setStatus(data.processing_status);
      showToast("Starting biomechanics extraction workflow...", "success");

      startPolling(data.session_id);
    } catch (err) {
      console.error("Start analysis failed:", err);
      const msg = err.response?.data?.detail || "Failed to start analysis.";
      setError(msg);
      showToast(msg, "danger");
      setProcessing(false);
    }
  };

  const startPolling = (sessionId) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    setProcessing(true);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/milestone2/analysis/status/${sessionId}`);
        const data = res.data;
        
        setProgress(data.progress);
        setStatus(data.processing_status);

        if (data.processing_status === 'completed') {
          clearInterval(pollIntervalRef.current);
          setProcessing(false);
          setProgress(100);
          showToast("Biomechanical models successfully calculated!", "success");
          
          // Load final results
          const bioRes = await api.get(`/milestone2/analysis/biomechanics/${selectedVideoId}`);
          setAnalysisSession(bioRes.data);
          
          const skelRes = await api.get(`/milestone2/analysis/skeleton/${selectedVideoId}`);
          setSkeletonData(skelRes.data);
        } else if (data.processing_status === 'failed') {
          clearInterval(pollIntervalRef.current);
          setProcessing(false);
          setError(data.error_message || 'Analysis pipeline crashed.');
          showToast("Analysis crashed.", "danger");
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 1500);
  };

  const handleFrameChange = (idx) => {
    if (analysisSession && analysisSession.frames && idx >= 0 && idx < analysisSession.frames.length) {
      setCurrentFrame(idx);
    }
  };

  const handleVideoSelect = (e) => {
    const id = e.target.value;
    setSelectedVideoId(id);
    const match = videos.find(v => v._id === id);
    setSelectedVideo(match);
  };

  const currentFrameData = analysisSession?.frames?.[currentFrame] || null;
  const currentSkeletonFrame = skeletonData?.frames?.[currentFrame] || null;

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
              Biomechanical Joints Analysis
            </h1>
            <p className="text-gray-400 text-xs mt-1">
              Select a video session to monitor flexion curves, valgus angles, range of motion constraints, and symmetries.
            </p>
          </div>
        </div>

        <div className="font-hud-mono text-[10px] text-hud-blue px-2.5 py-1 rounded-full bg-hud-blue/10 border border-hud-blue/20">
          BIOMECHANICS_MODULE // ONLINE
        </div>
      </div>

      {/* Aggregate telemetry highlights */}
      {status === 'completed' && analysisSession && (
        <MetricsDashboard
          summary={analysisSession.summary}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Player visualizer canvas */}
        <div className="lg:col-span-8 space-y-5">
          <SkeletonViewer
            videoUrl={selectedVideo ? `${BACKEND_URL}/uploads/${selectedVideo.stored_filename}` : ''}
            landmarks={currentSkeletonFrame?.connections?.map(c => ({ name: c.name_from, x: c.x1, y: c.y1, visibility: 0.9 })) || []}
            currentFrame={currentFrame}
            onFrameUpdate={handleFrameChange}
            totalFrames={analysisSession?.frames?.length || 1}
            videoFps={selectedVideo?.fps || 0}
            velocities={currentSkeletonFrame?.joint_velocities || {}}
            showDeleteButton={false}
          />

          {status === 'completed' && analysisSession?.frames && (
            <>
              <FrameNavigator
                currentFrame={currentFrame}
                totalFrames={analysisSession.frames.length}
                onChange={handleFrameChange}
              />
              <PoseTimeline
                frames={analysisSession.frames.map(f => ({ average_confidence: 0.9 }))} // Mapped layout
                currentFrame={currentFrame}
                onChange={handleFrameChange}
              />
            </>
          )}
        </div>

        {/* RIGHT COLUMN: Joint angle cards and heatmap */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Selector dropdown */}
          <div className="hud-glass-panel p-5 rounded-xl border border-hud-border space-y-3">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Select Video Source
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
                No video files synced.
              </p>
            )}
          </div>

          {/* Trigger controls */}
          {status !== 'completed' && (
            <div className="hud-glass-panel p-5 rounded-xl border border-hud-border space-y-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Telemetry Analytics Controls
              </h3>

              {status === 'no_pose' ? (
                <div className="p-3 rounded-lg bg-hud-danger/10 border border-hud-danger/30 text-hud-danger text-[10px] font-hud-mono">
                  ⚠️ Pose coordinate data missing. Run Pose Ingestion first.
                </div>
              ) : status === 'processing' ? (
                <div className="space-y-2">
                  <span className="text-[10px] font-hud-mono text-hud-blue font-bold block uppercase">
                    COMPUTING JOINT ANGLES ({progress}%)
                  </span>
                  <div className="relative w-full h-1 bg-hud-dark rounded-full overflow-hidden">
                    <div className="absolute left-0 h-full bg-hud-blue rounded-full" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
              ) : (
                <p className="text-[10px] text-gray-500 font-hud-mono leading-relaxed">
                  Clicking start will extract range of motion, symmetry index, touchdown landing flexions, and ankle step paces.
                </p>
              )}

              {status !== 'no_pose' && status !== 'processing' && (
                <Button onClick={handleStartAnalysis} loading={processing} className="w-full text-xs">
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Extract Biomechanics</span>
                </Button>
              )}
            </div>
          )}

          {/* Joint angle values grid */}
          {status === 'completed' && currentFrameData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <JointAngleCard
                  title="Left Knee Flexion"
                  current={currentFrameData.joint_angles?.knee_flexion_left || 0.0}
                  min={currentFrameData.rom?.knee_flexion_left?.min || 0.0}
                  max={currentFrameData.rom?.knee_flexion_left?.max || 0.0}
                  threshold={120.0}
                />
                <JointAngleCard
                  title="Right Knee Flexion"
                  current={currentFrameData.joint_angles?.knee_flexion_right || 0.0}
                  min={currentFrameData.rom?.knee_flexion_right?.min || 0.0}
                  max={currentFrameData.rom?.knee_flexion_right?.max || 0.0}
                  threshold={120.0}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <JointAngleCard
                  title="Left Knee Valgus"
                  current={currentFrameData.joint_angles?.knee_valgus_left || 0.0}
                  min={currentFrameData.rom?.knee_valgus_left?.min || 0.0}
                  max={currentFrameData.rom?.knee_valgus_left?.max || 0.0}
                  threshold={10.0}
                  isValgus={true}
                />
                <JointAngleCard
                  title="Right Knee Valgus"
                  current={currentFrameData.joint_angles?.knee_valgus_right || 0.0}
                  min={currentFrameData.rom?.knee_valgus_right?.min || 0.0}
                  max={currentFrameData.rom?.knee_valgus_right?.max || 0.0}
                  threshold={10.0}
                  isValgus={true}
                />
              </div>

              <AngleHeatmap
                frames={analysisSession.frames}
                currentFrame={currentFrame}
              />
            </div>
          )}

        </div>

      </div>

      <Toast toast={toast} />

    </div>
  );
};

export default Biomechanics;
