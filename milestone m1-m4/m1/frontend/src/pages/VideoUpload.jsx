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
  useEffect(() => {
    const fetchVideos = async () => {
      setLoadingVideos(true);
      setErrorMsg('');
      try {
        if (isAthlete) {
          const res = await videoAPI.getVideos();
          setVideos(res.data);
        } else if (selectedAthleteId) {
          const res = await videoAPI.getVideos(selectedAthleteId);
          setVideos(res.data);
        }
      } catch (err) {
        console.error(err);
        setErrorMsg("Failed to synchronize video indexes.");
      } finally {
        setLoadingVideos(false);
      }
    };

    if (isAthlete || selectedAthleteId) {
      fetchVideos();
    }
  }, [isAthlete, selectedAthleteId]);

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
      // Basic type validation
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
      setSuccessMsg(`Video "${title}" uploaded and queued for joint analysis!`);
      
      // Reset form
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

  // Map mock model outcomes for user visual wow-factor
  const getMockStatusText = (source, status) => {
    if (status === 'uploaded') {
      return {
        text: 'Analyzing biomechanics...',
        badge: 'rehab', // Amber indicator
        desc: 'Detecting skeletal models'
      };
    }
    
    const formats = {
      'coco': '17 2D skeleton joints matching COCO schema',
      'human3.6m': '32 3D skeleton keypoints matched (H36M standard)',
      'mpii': '16 2D skeleton joint structures indexed (MPII standard)',
      'sportspose': '16 3D biomechanic joints matched (SportsPose standard)',
      'custom': 'Custom keypoints analysis successfully processed'
    };

    return {
      text: 'Analysis Completed',
      badge: 'recovered', // Green indicator
      desc: formats[source.toLowerCase()] || formats['custom']
    };
  };

  return (
    <div>
      {/* Staff directory toggle */}
      {!isAthlete && (
        <div className="card" style={{ marginBottom: '2rem', padding: '1.25rem 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ color: 'var(--color-secondary)' }}>Athlete Video Vault</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Staff access mode: viewing motion captures and biomechanical posture models.</p>
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

      {/* Global Alerts */}
      {errorMsg && (
        <div style={{
          backgroundColor: 'rgba(255, 75, 75, 0.1)',
          border: '1px solid rgba(255, 75, 75, 0.2)',
          color: 'var(--color-danger)',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.85rem',
          marginBottom: '2rem'
        }}>
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div style={{
          backgroundColor: 'rgba(14, 219, 137, 0.1)',
          border: '1px solid rgba(14, 219, 137, 0.2)',
          color: 'var(--color-success)',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.85rem',
          marginBottom: '2rem'
        }}>
          {successMsg}
        </div>
      )}

      <div className="dashboard-grid">
        
        {/* LEFT COLUMN: UPLOAD CONTROLS (Only for athletes) */}
        <div className="dashboard-side">
          {isAthlete ? (
            <div className="card">
              <h3 style={{ marginBottom: '1.25rem', color: 'var(--color-primary)' }}>Upload Training Video</h3>
              
              <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* Drag Drop Area */}
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
                  <div className="upload-icon">✦</div>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                    {selectedFile ? selectedFile.name : "Drag & Drop video here"}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` : "Supports MP4, MOV, AVI up to 50MB"}
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Video Title</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Back Squat Reps"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Format Mapping (Pose Target)</label>
                  <select
                    className="form-select"
                    value={datasetSource}
                    onChange={(e) => setDatasetSource(e.target.value)}
                  >
                    <option value="custom">Standard / Custom Video</option>
                    <option value="coco">COCO Keypoint Alignment</option>
                    <option value="human3.6m">Human3.6M 3D Alignment</option>
                    <option value="mpii">MPII Joint Alignment</option>
                    <option value="sportspose">SportsPose Biomechanics</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Description / Remarks</label>
                  <textarea
                    className="form-textarea"
                    rows="3"
                    placeholder="Provide details on posture goals or biomechanic points..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  disabled={uploading}
                >
                  {uploading ? "Ingesting payload..." : "Initiate Biomechanic Log"}
                </button>

              </form>
            </div>
          ) : (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center', height: '100%', minHeight: '300px' }}>
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                <p style={{ fontSize: '1.25rem', color: 'var(--color-secondary)', fontWeight: 600 }}>Coach Viewer Panel</p>
                <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Upload features are restricted to active athletes. Choose an athlete profile above to monitor and audit their submitted motion recordings.</p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: VIDEO ARCHIVES */}
        <div className="dashboard-main">
          <div className="card">
            <h3 style={{ marginBottom: '0.2rem' }}>Athlete Motion Captures</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '2rem' }}>Listing athletic feeds mapped to coordinate models for training fine-tunes.</p>

            {loadingVideos ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{
                  display: 'inline-block',
                  width: '30px',
                  height: '30px',
                  border: '3px solid var(--border-glass)',
                  borderTopColor: 'var(--color-primary)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Syncing video catalog...</p>
              </div>
            ) : videos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                No video recordings registered for this profile.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {videos.map(video => {
                  const statusInfo = getMockStatusText(video.dataset_source, video.status);
                  return (
                    <div
                      key={video.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '180px 1fr',
                        gap: '1.5rem',
                        borderBottom: '1px solid var(--border-glass)',
                        paddingBottom: '1.5rem'
                      }}
                    >
                      {/* Video Player Mockup Container */}
                      <div
                        style={{
                          height: '110px',
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid var(--border-glass)',
                          borderRadius: 'var(--radius-md)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        <span style={{ fontSize: '1.5rem', opacity: 0.7 }}>▶</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem', textTransform: 'uppercase' }}>
                          Preview Clip
                        </span>
                        
                        {/* Mapped target watermark badge */}
                        <div
                          style={{
                            position: 'absolute',
                            top: 4,
                            left: 4,
                            fontSize: '0.55rem',
                            background: 'rgba(0, 242, 254, 0.15)',
                            border: '1px solid var(--color-primary)',
                            padding: '1px 4px',
                            borderRadius: '3px',
                            color: '#fff',
                            textTransform: 'uppercase',
                            fontWeight: 600
                          }}
                        >
                          {video.dataset_source}
                        </div>
                      </div>

                      {/* Video Details */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <h4 style={{ fontSize: '1.1rem' }}>{video.title}</h4>
                          <span className={`badge badge-${statusInfo.badge}`}>
                            {statusInfo.text}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                          {video.description || 'No description provided.'}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-secondary)', marginTop: '0.5rem', fontWeight: 500 }}>
                          {statusInfo.desc}
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          <span>File Path: <code>{video.file_path}</code></span>
                          <span>•</span>
                          <span>Uploaded: {new Date(video.uploaded_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default VideoUpload;
