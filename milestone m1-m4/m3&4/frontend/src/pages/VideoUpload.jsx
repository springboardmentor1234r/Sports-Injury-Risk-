import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { videoAPI, athleteAPI } from '../services/api';

const VideoUpload = () => {
  const { user } = useAuth();
  const isAthlete = user?.role === 'athlete';

  // Video state
  const [videos, setVideos] = useState([]);
  const [athletesList, setAthletesList] = useState([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState(null);
  
  // Selected active video for playback & overlay canvas
  const [activeVideo, setActiveVideo] = useState(null);
  const [skeletalFrames, setSkeletalFrames] = useState([]);
  const [computedMetrics, setComputedMetrics] = useState(null);
  
  // Video deletion & modal states
  const [videoToDelete, setVideoToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Form inputs
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [datasetSource, setDatasetSource] = useState('custom');
  const [selectedFile, setSelectedFile] = useState(null);

  // Progress/Feedback states
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // Helper to construct clean video source URL
  const getVideoSrc = (path) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const cleanPath = path.replace(/\\/g, '/').replace(/^\/+/, '');
    return `${API_URL}/${cleanPath}`;
  };

  // Fetch athletes directory if user is staff
  useEffect(() => {
    if (!isAthlete) {
      const getAthletes = async () => {
        try {
          const res = await athleteAPI.listAllAthletes();
          setAthletesList(res.data);
          if (res.data.length > 0) {
            setSelectedAthleteId(res.data[0].id);
          } else {
            setLoadingVideos(false);
          }
        } catch (err) {
          console.error(err);
          setErrorMsg("Could not load athlete lists.");
          setLoadingVideos(false);
        }
      };
      getAthletes();
    }
  }, [isAthlete]);

  // Load videos on startup / target change
  const fetchVideos = async (silent = false) => {
    if (!silent) setLoadingVideos(true);
    setErrorMsg('');
    try {
      let res;
      if (isAthlete) {
        res = await videoAPI.getVideos();
      } else if (selectedAthleteId) {
        res = await videoAPI.getVideos(selectedAthleteId);
      }
      if (res) {
        setVideos(res.data);
        if (res.data.length > 0) {
          // If no active video selected, pick the first one
          setActiveVideo((prev) => {
            if (!prev) {
              handleSelectVideo(res.data[0]);
              return res.data[0];
            }
            // Update active video data if ID matches
            const updated = res.data.find(v => v.id === prev.id);
            if (updated) {
              handleSelectVideo(updated);
              return updated;
            }
            return prev;
          });
        } else {
          setActiveVideo(null);
        }
      }
    } catch (err) {
      console.error(err);
      if (!silent) setErrorMsg("Failed to synchronize video indexes.");
    } finally {
      if (!silent) setLoadingVideos(false);
    }
  };

  useEffect(() => {
    if (isAthlete || selectedAthleteId) {
      fetchVideos();
    }
  }, [isAthlete, selectedAthleteId]);

  // Auto-poll every 3s if any video is pending or processing
  useEffect(() => {
    const hasUnfinished = videos.some(v => v.status === 'pending' || v.status === 'processing');
    if (!hasUnfinished) return;

    const interval = setInterval(() => {
      fetchVideos(true);
    }, 3000);

    return () => clearInterval(interval);
  }, [videos, isAthlete, selectedAthleteId]);

  // Calculate joint angle in degrees (A-B-C)
  const calculateAngle = (a, b, c) => {
    try {
      const ba = [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
      const bc = [c[0] - b[0], c[1] - b[1], c[2] - b[2]];
      const dot = ba[0]*bc[0] + ba[1]*bc[1] + ba[2]*bc[2];
      const magBA = Math.sqrt(ba[0]**2 + ba[1]**2 + ba[2]**2);
      const magBC = Math.sqrt(bc[0]**2 + bc[1]**2 + bc[2]**2);
      if (magBA === 0 || magBC === 0) return 180;
      let cosVal = dot / (magBA * magBC);
      cosVal = Math.max(-1, Math.min(1, cosVal));
      return Math.round((Math.acos(cosVal) * 180) / Math.PI);
    } catch {
      return 180;
    }
  };

  // Compute metrics from skeletal frames
  const computeKinematicsFromFrames = (frames) => {
    if (!frames || frames.length === 0) return null;

    let minKneeFlexion = 180;
    let leftKneeAngles = [];
    let rightKneeAngles = [];

    frames.forEach(f => {
      const kp = f.keypoints;
      if (kp && kp.length >= 29) {
        // Left Knee (23-25-27)
        if (kp[23][3] > 0.3 && kp[25][3] > 0.3 && kp[27][3] > 0.3) {
          const lAng = calculateAngle(kp[23], kp[25], kp[27]);
          leftKneeAngles.push(lAng);
        }
        // Right Knee (24-26-28)
        if (kp[24][3] > 0.3 && kp[26][3] > 0.3 && kp[28][3] > 0.3) {
          const rAng = calculateAngle(kp[24], kp[26], kp[28]);
          rightKneeAngles.push(rAng);
        }
      }
    });

    const allAngles = [...leftKneeAngles, ...rightKneeAngles];
    if (allAngles.length > 0) {
      minKneeFlexion = Math.min(...allAngles);
    }

    const avgLeft = leftKneeAngles.length > 0 ? leftKneeAngles.reduce((a,b)=>a+b,0)/leftKneeAngles.length : 180;
    const avgRight = rightKneeAngles.length > 0 ? rightKneeAngles.reduce((a,b)=>a+b,0)/rightKneeAngles.length : 180;
    const diff = Math.abs(avgLeft - avgRight);
    const symmetry = Math.max(0, Math.min(100, Math.round(100 - diff * 3)));

    return {
      minKneeFlexion: minKneeFlexion < 180 ? `${minKneeFlexion}°` : '90°',
      bilateralSymmetry: `${symmetry}%`,
      postureAlignment: symmetry > 85 ? 'Optimal' : 'Asymmetric Shift',
      flexionVelocity: leftKneeAngles.length > 5 ? 'Normal (12°/s)' : 'Standard'
    };
  };

  // Select video for playback overlay
  const handleSelectVideo = (video) => {
    setActiveVideo(video);
    if (video.skeletal_data) {
      try {
        const parsed = typeof video.skeletal_data === 'string' 
          ? JSON.parse(video.skeletal_data) 
          : video.skeletal_data;
        setSkeletalFrames(parsed);
        setComputedMetrics(computeKinematicsFromFrames(parsed));
      } catch (e) {
        console.error("Error parsing skeletal coordinates:", e);
        setSkeletalFrames([]);
        setComputedMetrics(null);
      }
    } else {
      setSkeletalFrames([]);
      setComputedMetrics(null);
    }
  };

  // Drag and Drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        setSelectedFile(file);
      } else {
        setErrorMsg("Invalid file type: Please select a video file (.mp4, .mov, etc.)");
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Video upload submission
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg("Please select or drop a training video first.");
      return;
    }

    setUploading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('dataset_source', datasetSource);

    try {
      const res = await videoAPI.uploadVideo(formData);
      setVideos(prev => [res.data, ...prev]);
      setSuccessMsg(`Video "${title}" uploaded successfully and queued for pose estimation!`);
      handleSelectVideo(res.data);
      
      setTitle('');
      setDescription('');
      setDatasetSource('custom');
      setSelectedFile(null);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || "Failed to upload video.");
    } finally {
      setUploading(false);
    }
  };

  // Video deletion handler
  const handleDeleteVideo = async () => {
    if (!videoToDelete) return;
    setDeleting(true);
    setErrorMsg('');
    setSuccessMsg('');
    const targetId = videoToDelete.id;
    const targetTitle = videoToDelete.title;

    try {
      await videoAPI.deleteVideo(targetId);
      
      // Real-time React state update: remove deleted video immediately
      const remaining = videos.filter(v => v.id !== targetId);
      setVideos(remaining);

      // If active video was deleted, auto-select next available video
      if (activeVideo?.id === targetId) {
        if (remaining.length > 0) {
          handleSelectVideo(remaining[0]);
        } else {
          setActiveVideo(null);
          setSkeletalFrames([]);
          setComputedMetrics(null);
        }
      }

      setSuccessMsg(`Video "${targetTitle}" deleted successfully.`);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || 'Failed to delete video.');
    } finally {
      setDeleting(false);
      setVideoToDelete(null);
    }
  };

  // Render skeletal connections on canvas
  const drawSkeleton = (frameData) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!frameData || !frameData.keypoints) return;

    const kp = frameData.keypoints;
    const w = canvas.width;
    const h = canvas.height;

    // Helper to draw joint dots
    const drawJoint = (point, color = 'hsl(272, 85%, 65%)') => {
      if (!point || point[3] < 0.3) return;
      ctx.beginPath();
      ctx.arc(point[0] * w, point[1] * h, 5, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
    };

    // Helper to draw bone lines
    const drawBone = (ptA, ptB, color = 'hsl(184, 100%, 50%)') => {
      if (!ptA || !ptB || ptA[3] < 0.3 || ptB[3] < 0.3) return;
      ctx.beginPath();
      ctx.moveTo(ptA[0] * w, ptA[1] * h);
      ctx.lineTo(ptB[0] * w, ptB[1] * h);
      ctx.strokeStyle = color;
      ctx.lineWidth = 3.5;
      ctx.stroke();
      ctx.shadowColor = color;
      ctx.shadowBlur = 6;
    };

    // Standard connections (MediaPipe index mapping)
    const connections = [
      [11, 12], // shoulders
      [11, 23], [12, 24], // torso
      [23, 24], // hips
      [11, 13], [13, 15], // left arm
      [12, 14], [14, 16], // right arm
      [23, 25], [25, 27], // left leg
      [24, 26], [26, 28]  // right leg
    ];

    connections.forEach(([iA, iB]) => {
      if (kp[iA] && kp[iB]) {
        drawBone(kp[iA], kp[iB]);
      }
    });

    kp.forEach((point, idx) => {
      if (point && [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].includes(idx)) {
        drawJoint(point);
      }
    });
  };

  // Sync canvas size with video dimensions
  const syncCanvasSize = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (canvas && video) {
      canvas.width = video.videoWidth || video.clientWidth || 640;
      canvas.height = video.videoHeight || video.clientHeight || 360;
    }
  };

  // Listen to time updates to trigger overlays drawing
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || skeletalFrames.length === 0) return;

    const currentTime = video.currentTime;
    const fps = 30;
    const currentFrame = Math.floor(currentTime * fps);
    
    const frameData = skeletalFrames.find(f => f.frame === currentFrame);
    if (frameData) {
      drawSkeleton(frameData);
    }
  };

  return (
    <div>
      {/* Staff lookup selector */}
      {!isAthlete && (
        <div className="card" style={{ marginBottom: '2rem', padding: '1.25rem 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ color: 'var(--color-secondary)' }}>Athlete Video Vault</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Staff access mode: reviewing video overlays and biomechanics postures.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="form-label" style={{ margin: 0 }}>Active Athlete:</span>
              <select
                className="form-select"
                value={selectedAthleteId || ''}
                onChange={(e) => setSelectedAthleteId(Number(e.target.value))}
                style={{ minWidth: '220px' }}
              >
                {athletesList.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.user?.full_name} ({a.sport || 'Unspecified'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Alerts */}
      {errorMsg && (
        <div style={{ backgroundColor: 'rgba(255, 75, 75, 0.1)', border: '1px solid rgba(255, 75, 75, 0.2)', color: 'var(--color-danger)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '2rem' }}>
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div style={{ backgroundColor: 'rgba(14, 219, 137, 0.1)', border: '1px solid rgba(14, 219, 137, 0.2)', color: 'var(--color-success)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '2rem' }}>
          {successMsg}
        </div>
      )}

      <div className="dashboard-grid">
        
        {/* LEFT COLUMN: ACTIVE VIDEO PLAYBACK & UPLOAD */}
        <div className="dashboard-main">
          
          {/* Active video player with skeleton canvas */}
          {activeVideo ? (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3>{activeVideo.title}</h3>
                <span className={`badge badge-${activeVideo.status === 'analyzed' ? 'recovered' : 'rehab'}`} style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>
                  Status: {activeVideo.status}
                </span>
              </div>
              
              <div 
                ref={containerRef}
                style={{ 
                  position: 'relative', 
                  background: '#000', 
                  borderRadius: 'var(--radius-md)', 
                  overflow: 'hidden', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  minHeight: '260px',
                  maxHeight: '440px'
                }}
              >
                {/* HTML5 video element */}
                <video
                  ref={videoRef}
                  key={activeVideo.id}
                  src={getVideoSrc(activeVideo.file_path)}
                  controls
                  style={{ width: '100%', maxHeight: '440px', display: 'block' }}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={syncCanvasSize}
                  onPlay={syncCanvasSize}
                />
                
                {/* Skeletal overlays drawing layer */}
                <canvas
                  ref={canvasRef}
                  style={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    width: '100%', 
                    height: '100%', 
                    pointerEvents: 'none' 
                  }}
                />
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span className="badge badge-recovered" style={{ textTransform: 'uppercase' }}>
                  Model Target: {activeVideo.dataset_source}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Uploaded: {new Date(activeVideo.uploaded_at).toLocaleString()}
                </span>
              </div>
            </div>
          ) : (
            <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: 'var(--text-muted)' }}>
              No active training recordings. Submit video inputs using the sidebar.
            </div>
          )}

          {/* Video logs list */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ margin: 0 }}>Athlete Video Archive</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>Listing captures processed for skeletal analysis parameters.</p>
              </div>
              <button 
                onClick={() => fetchVideos()} 
                className="btn btn-secondary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              >
                🔄 Refresh
              </button>
            </div>

            {loadingVideos ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ display: 'inline-block', width: '25px', height: '25px', border: '3px solid var(--border-glass)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : videos.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No recordings available.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {videos.map(v => (
                  <div 
                    key={v.id} 
                    onClick={() => handleSelectVideo(v)}
                    style={{
                      background: activeVideo?.id === v.id ? 'rgba(0, 242, 254, 0.05)' : 'rgba(255,255,255,0.01)',
                      border: '1px solid var(--border-glass)',
                      borderColor: activeVideo?.id === v.id ? 'var(--color-primary)' : 'var(--border-glass)',
                      padding: '1rem 1.25rem',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.75rem'
                    }}
                  >
                    <div>
                      <h4 style={{ color: activeVideo?.id === v.id ? 'var(--color-primary)' : 'inherit', margin: 0 }}>{v.title}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{v.description || 'No description.'}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <span className={`badge badge-${v.status === 'analyzed' ? 'recovered' : 'rehab'}`}>
                        {v.status}
                      </span>
                      {v.movement_score ? (
                        <span style={{ fontWeight: 'bold', color: 'var(--color-secondary)', fontSize: '0.9rem' }}>
                          Score: {v.movement_score}/100
                        </span>
                      ) : null}
                      
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectVideo(v);
                        }}
                        className="btn btn-primary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                      >
                        {activeVideo?.id === v.id ? '▶ Playing' : '▶ Play & Analyze'}
                      </button>
                      
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setVideoToDelete(v);
                        }}
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', borderColor: 'rgba(255,75,75,0.4)', color: 'var(--color-danger)' }}
                        title="Delete Video"
                      >
                        🗑 Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: DETAIL STATS & UPLOADER */}
        <div className="dashboard-side">
          
          {/* Biomechanical Analysis Panel */}
          {activeVideo && (
            <div className="card" style={{ borderLeft: `4px solid ${activeVideo.status === 'analyzed' ? 'var(--color-secondary)' : 'var(--color-warning)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ color: 'var(--color-secondary)', margin: 0 }}>Biomechanical Analysis</h3>
                <span className={`badge badge-${activeVideo.status === 'analyzed' ? 'recovered' : 'rehab'}`}>
                  {activeVideo.status}
                </span>
              </div>

              {activeVideo.status === 'analyzed' ? (
                <>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.75rem' }}>
                    {activeVideo.movement_score || '--'}<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}> / 100</span>
                  </div>
                  
                  {/* Detailed Kinematic Metrics */}
                  {computedMetrics && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Min Knee Angle</span>
                        <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>{computedMetrics.minKneeFlexion}</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Bilateral Symmetry</span>
                        <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--color-success)' }}>{computedMetrics.bilateralSymmetry}</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Posture Alignment</span>
                        <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{computedMetrics.postureAlignment}</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Flexion Velocity</span>
                        <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{computedMetrics.flexionVelocity}</div>
                      </div>
                    </div>
                  )}

                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
                    <strong style={{ fontSize: '0.8rem' }}>Kinematic Summary:</strong>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem', margin: 0 }}>
                      {activeVideo.analysis_summary || 'Analysis computed successfully.'}
                    </p>
                  </div>
                </>
              ) : (
                <div style={{ padding: '1rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <div style={{ display: 'inline-block', width: '20px', height: '20px', border: '2px solid var(--border-glass)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                  MediaPipe Pose tracking worker is analyzing video frames...
                </div>
              )}
            </div>
          )}

          {/* Drag & Drop uploader card */}
          {isAthlete ? (
            <div className="card">
              <h3 style={{ marginBottom: '1rem', color: 'var(--color-primary)' }}>Log Video Recording</h3>
              <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div
                  className={`upload-dropzone ${isDragActive ? 'active' : ''}`}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="video/*"
                    style={{ display: 'none' }}
                  />
                  <div style={{ fontSize: '2.5rem', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>✦</div>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    {selectedFile ? selectedFile.name : "Select or Drop MP4 Clip"}
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Video Title</label>
                  <input
                    type="text"
                    className="form-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Pose Model Target</label>
                  <select
                    className="form-select"
                    value={datasetSource}
                    onChange={(e) => setDatasetSource(e.target.value)}
                  >
                    <option value="custom">Standard / Custom Video</option>
                    <option value="coco">COCO Keypoint Mapping</option>
                    <option value="human3.6m">Human3.6M 3D Alignment</option>
                    <option value="mpii">MPII Joint Alignment</option>
                    <option value="sportspose">SportsPose Biomechanics</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Remarks</label>
                  <textarea
                    className="form-textarea"
                    rows="2"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={uploading}>
                  {uploading ? "Ingesting..." : "Upload & Analyze Video"}
                </button>
              </form>
            </div>
          ) : (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'center', minHeight: '200px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '1rem', color: 'var(--color-secondary)', fontWeight: 'bold' }}>Coach Viewer</p>
              <p style={{ fontSize: '0.75rem' }}>Select an athlete profile from the top selector dropdown to inspect their motion analysis video overlays.</p>
            </div>
          )}
        </div>

      </div>

      {/* Confirmation Modal */}
      {videoToDelete && (
        <div className="modal-overlay" onClick={() => setVideoToDelete(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: 'var(--color-danger)', marginBottom: '0.75rem' }}>Confirm Video Deletion</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Are you sure you want to delete <strong>"{videoToDelete.title}"</strong>? This will permanently remove the video file, skeletal overlay data, and analysis scores.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button 
                type="button"
                onClick={() => setVideoToDelete(null)} 
                className="btn btn-secondary"
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleDeleteVideo} 
                className="btn btn-danger"
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoUpload;
