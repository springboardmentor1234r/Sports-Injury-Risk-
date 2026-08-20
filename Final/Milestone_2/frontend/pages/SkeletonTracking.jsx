import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Film, Loader2, Play, RotateCcw, Activity } from 'lucide-react';
import api from '../../utils/api';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Toast from '../../components/Toast';

// Components
import SkeletonViewer from '../components/SkeletonViewer';
import VelocityGraph from '../components/VelocityGraph';
import MotionTrail from '../components/MotionTrail';
import FrameNavigator from '../components/FrameNavigator';
import PoseTimeline from '../components/PoseTimeline';

const BACKEND_URL = 'http://127.0.0.1:8000';

export const SkeletonTracking = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const [selectedVideoId, setSelectedVideoId] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);

  // Ingestion tracking session states
  const [trackingSession, setTrackingSession] = useState(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle'); // idle, processing, completed, failed
  const [error, setError] = useState('');

  // Selected joint for detailed graphs
  const [selectedJoint, setSelectedJoint] = useState('LEFT_ANKLE');

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

    const checkExistingTracking = async () => {
      setStatus('idle');
      setTrackingSession(null);
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
        const res = await api.get(`/milestone2/analysis/skeleton/${selectedVideoId}`);
        const session = res.data;
        setTrackingSession(session);
        setStatus('completed');
        // Seek to first frame that has connection data
        if (session.frames) {
          const firstGoodFrame = session.frames.findIndex(
            f => f.connections && f.connections.length > 0
          );
          if (firstGoodFrame > 0) setCurrentFrame(firstGoodFrame);
        }
      } catch (err) {
        // Automatically start the tracking / pose analysis pipeline!
        handleStartTracking();
      }
    };

    checkExistingTracking();
  }, [selectedVideoId, videos]);

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const handleStartTracking = async () => {
    if (!selectedVideoId) return;
    setProcessing(true);
    setError('');
    setProgress(0);

    try {
      const res = await api.post(`/milestone2/analysis/start/${selectedVideoId}`);
      const data = res.data;
      setStatus(data.processing_status);
      showToast("Starting skeleton tracking and velocity calculations...", "success");

      startPolling(data.session_id);
    } catch (err) {
      console.error("Start analysis failed:", err);
      const msg = err.response?.data?.detail || "Failed to start analysis pipeline.";
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
          showToast("Skeletal motion vectors successfully calculated!", "success");
          
          // Load final results
          const trackRes = await api.get(`/milestone2/analysis/skeleton/${selectedVideoId}`);
          const finalTrack = trackRes.data;
          setTrackingSession(finalTrack);
          // Seek to first frame with connection data
          if (finalTrack.frames) {
            const firstGoodFrame = finalTrack.frames.findIndex(
              f => f.connections && f.connections.length > 0
            );
            if (firstGoodFrame > 0) setCurrentFrame(firstGoodFrame);
          }
        } else if (data.processing_status === 'failed') {
          clearInterval(pollIntervalRef.current);
          setProcessing(false);
          setError(data.error_message || 'Kinematic calculations crashed.');
          showToast("Tracking pipeline crashed.", "danger");
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 1500);
  };

  const handleFrameChange = (idx) => {
    if (trackingSession && trackingSession.frames && idx >= 0 && idx < trackingSession.frames.length) {
      setCurrentFrame(idx);
    }
  };

  const handleVideoSelect = (e) => {
    const id = e.target.value;
    setSelectedVideoId(id);
    const match = videos.find(v => v._id === id);
    setSelectedVideo(match);
  };

  const currentFrameData = trackingSession?.frames?.[currentFrame] || null;

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
              Skeletal Motion Tracking & Velocities
            </h1>
            <p className="text-gray-400 text-xs mt-1">
              Select a video source to track joint motion paths, frame velocities, and acceleration vectors.
            </p>
          </div>
        </div>

        <div className="font-hud-mono text-[10px] text-hud-blue px-2.5 py-1 rounded-full bg-hud-blue/10 border border-hud-blue/20">
          SKELETON_TRACKING_MODULE // ONLINE
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Viewer Canvas & scrub bars */}
        <div className="lg:col-span-8 space-y-5">
          <SkeletonViewer
            videoUrl={selectedVideo ? `${BACKEND_URL}/uploads/${selectedVideo.stored_filename}` : ''}
            landmarks={
              currentFrameData?.connections
                ? Array.from(
                    new Map(
                      currentFrameData.connections.flatMap(c => [
                        [c.name_from, { name: c.name_from, x: c.x1, y: c.y1, visibility: 0.9 }],
                        [c.name_to, { name: c.name_to, x: c.x2, y: c.y2, visibility: 0.9 }]
                      ])
                    ).values()
                  )
                : []
            }
            currentFrame={currentFrame}
            onFrameUpdate={handleFrameChange}
            totalFrames={trackingSession?.frames?.length || 1}
            videoFps={selectedVideo?.fps || 0}
            velocities={currentFrameData?.joint_velocities || {}}
            motionTrails={currentFrameData?.motion_trail || {}}
            selectedJoint={selectedJoint}
          />

          {status === 'completed' && trackingSession?.frames && (
            <>
              <FrameNavigator
                currentFrame={currentFrame}
                totalFrames={trackingSession.frames.length}
                onChange={handleFrameChange}
              />
              <PoseTimeline
                frames={trackingSession.frames}
                currentFrame={currentFrame}
                onChange={handleFrameChange}
              />
            </>
          )}
        </div>

        {/* RIGHT COLUMN: Controls and curves graphs */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Ingest selector */}
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
                No video files synced. Go to upload first.
              </p>
            )}
          </div>

          {/* Processing controls */}
          <div className="hud-glass-panel p-5 rounded-xl border border-hud-border space-y-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Ingestion Tracking Controls
            </h3>

            {status === 'no_pose' ? (
              <div className="p-3 rounded-lg bg-hud-danger/10 border border-hud-danger/30 text-hud-danger text-[10px] font-hud-mono">
                ⚠️ Pose coordinates missing. Run Pose Ingestion first.
              </div>
            ) : status === 'completed' ? (
              <div className="p-3 rounded-lg bg-hud-green/10 border border-hud-green/30 text-hud-green text-[10px] font-bold font-hud-mono">
                ✓ KINEMATIC VECTORS LOADED
              </div>
            ) : status === 'processing' ? (
              <div className="space-y-2">
                <span className="text-[10px] font-hud-mono text-hud-blue font-bold block uppercase">
                  CALCULATING VELOCITIES ({progress}%)
                </span>
                <div className="relative w-full h-1 bg-hud-dark rounded-full overflow-hidden">
                  <div className="absolute left-0 h-full bg-hud-blue rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-gray-500 font-hud-mono leading-relaxed">
                Clicking start will compute joint displacement velocity and acceleration vectors using pose keypoints history.
              </p>
            )}

            {status !== 'no_pose' && status !== 'processing' && (
              <Button onClick={handleStartTracking} loading={processing} className="w-full text-xs">
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Calculate Motion Vectors</span>
              </Button>
            )}
          </div>

          {/* Joint Selector dropdown */}
          {status === 'completed' && (
            <div className="hud-glass-panel p-4 rounded-xl border border-hud-border space-y-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Select Joint Focus
              </label>
              <select
                className="w-full px-3 py-2 bg-hud-dark border border-hud-border rounded-lg text-xs text-white cursor-pointer"
                value={selectedJoint}
                onChange={(e) => setSelectedJoint(e.target.value)}
              >
                <option value="LEFT_ANKLE">Left Ankle</option>
                <option value="RIGHT_ANKLE">Right Ankle</option>
                <option value="LEFT_WRIST">Left Wrist</option>
                <option value="RIGHT_WRIST">Right Wrist</option>
                <option value="Head">Head</option>
              </select>
            </div>
          )}

          {/* Telemetry charts */}
          {status === 'completed' && currentFrameData && (
            <>
              <VelocityGraph
                frames={trackingSession.frames}
                currentFrame={currentFrame}
                jointName={selectedJoint}
              />
              <MotionTrail
                trailData={currentFrameData.motion_trail?.[selectedJoint] || []}
                jointName={selectedJoint}
              />
            </>
          )}

        </div>

      </div>

      <Toast toast={toast} />

    </div>
  );
};

export default SkeletonTracking;
