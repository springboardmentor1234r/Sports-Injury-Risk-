import React, { useState, useEffect } from 'react';
import { Upload, Video, CheckCircle, AlertCircle, PlayCircle, Loader2 } from 'lucide-react';
import { athleteAPI, videoAPI } from '../services/api';

const STAGES = [
  '1. Uploading video file (0-200 MB)',
  '2. Validating MP4/MOV/AVI/WEBM format & headers',
  '3. Extracting keyframes & optical flow vectors',
  '4. Detecting human body pose (MediaPipe / OpenCV)',
  '5. Tracking 33 keypoint landmarks across frames',
  '6. Calculating 3D joint angles (Knee, Hip, Trunk)',
  '7. Analyzing movement symmetry & valgus ratio',
  '8. Running IsolationForest anomaly detection engine',
  '9. Evaluating 6 Random Forest injury prediction models',
  '10. Computing overall weighted injury risk score',
  '11. Generating personalized AI corrective exercises',
  '12. Saving analysis report to database'
];

const VideoUpload = ({ user, onAnalysisComplete }) => {
  const [athletes, setAthletes] = useState([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchAthletes();
  }, [user]);

  const fetchAthletes = async () => {
    try {
      if (user?.role === 'athlete' && user?.athlete_id) {
        setSelectedAthleteId(user.athlete_id);
      } else {
        const res = await athleteAPI.getAll();
        setAthletes(res.data);
        if (res.data.length > 0) {
          setSelectedAthleteId(res.data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      validateAndSetFile(selected);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const validateAndSetFile = (f) => {
    const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase();
    const validExts = ['.mp4', '.mov', '.avi', '.webm'];
    if (!validExts.includes(ext)) {
      setErrorMsg(`Invalid file format '${ext}'. Allowed: MP4, MOV, AVI, WEBM`);
      return;
    }
    const sizeMb = f.size / (1024 * 1024);
    if (sizeMb > 200) {
      setErrorMsg(`File size (${sizeMb.toFixed(1)} MB) exceeds maximum allowed 200 MB limit.`);
      return;
    }
    setErrorMsg('');
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const handleAnalyze = async () => {
    if (!selectedAthleteId || (!file && !previewUrl)) return;
    setIsAnalyzing(true);
    setStageIndex(0);
    setProgressPercent(5);
    setErrorMsg('');

    // Simulate multi-step progress bar animation
    const interval = setInterval(() => {
      setStageIndex((prev) => {
        if (prev < STAGES.length - 1) {
          const next = prev + 1;
          setProgressPercent(Math.round(((next + 1) / STAGES.length) * 90));
          return next;
        }
        return prev;
      });
    }, 450);

    try {
      const formData = new FormData();
      formData.append('athlete_id', selectedAthleteId);
      formData.append('video_name', file ? file.name : 'Movement_Analysis_Session.mp4');

      if (file) {
        formData.append('video_filename', file.name);
      } else {
        formData.append('video_filename', 'demo_sprint.mp4');
      }

      const res = await videoAPI.analyze(formData);
      clearInterval(interval);
      setProgressPercent(100);
      setStageIndex(STAGES.length - 1);

      setTimeout(() => {
        setIsAnalyzing(false);
        if (onAnalysisComplete) {
          onAnalysisComplete(res.data);
        }
      }, 600);
    } catch (err) {
      clearInterval(interval);
      setIsAnalyzing(false);
      setErrorMsg(err.response?.data?.detail || 'An error occurred during video analysis.');
    }
  };

  return (
    <div className="card">
      <h2 className="card-title">
        <Video size={20} color="#15803D" />
        <span>AI Video Biomechanics Upload & Lab</span>
      </h2>

      {/* Error Banner */}
      {errorMsg && (
        <div style={styles.errorBanner}>
          <AlertCircle size={18} color="#B91C1C" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Controls Form */}
      <div style={{ marginBottom: '1.25rem' }}>
        <label className="form-label">Select Athlete for Analysis</label>
        {user?.role === 'athlete' ? (
          <div style={styles.athleteTag}>
            <span>{user.full_name} (Logged-in Athlete)</span>
          </div>
        ) : (
          <select
            className="form-select"
            value={selectedAthleteId}
            onChange={(e) => setSelectedAthleteId(e.target.value)}
            disabled={isAnalyzing}
          >
            {athletes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} — {a.sport_type} ({a.position})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Drag & Drop Upload Area */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        style={styles.dropZone}
      >
        {previewUrl ? (
          <div style={styles.previewContainer}>
            <video src={previewUrl} controls style={styles.videoPreview} />
            <div style={styles.fileMeta}>
              <CheckCircle size={16} color="#15803D" />
              <span>{file ? file.name : 'Sample_Athlete_Movement.mp4'}</span>
              <button onClick={() => { setFile(null); setPreviewUrl(''); }} style={styles.clearBtn}>
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div style={styles.dropContent}>
            <div style={styles.uploadIconCircle}>
              <Upload size={32} color="#15803D" />
            </div>
            <p style={styles.dropTitle}>Drag & Drop Movement Video Here</p>
            <p style={styles.dropSub}>Supported Formats: MP4, MOV, AVI, WEBM (Max 200 MB)</p>
            <label className="btn btn-outline" style={{ marginTop: '0.75rem' }}>
              <span>Browse Video File</span>
              <input
                type="file"
                accept=".mp4,.mov,.avi,.webm"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        )}
      </div>

      {/* Multi-stage Progress Bar */}
      {isAnalyzing && (
        <div style={styles.progressContainer}>
          <div style={styles.progressHeader}>
            <span style={styles.stageTitle}>{STAGES[stageIndex]}</span>
            <span style={styles.percentText}>{progressPercent}%</span>
          </div>
          <div style={styles.track}>
            <div style={{ ...styles.fill, width: `${progressPercent}%` }} />
          </div>
          <div style={styles.loadingPulse}>
            <Loader2 size={16} className="spinner" />
            <span>Processing OpenCV keypoints & MediaPipe landmarks...</span>
          </div>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={handleAnalyze}
        disabled={isAnalyzing || !selectedAthleteId}
        className="btn btn-primary"
        style={{ width: '100%', marginTop: '1.25rem', padding: '0.85rem' }}
      >
        {isAnalyzing ? (
          <>
            <Loader2 size={18} className="spinner" />
            <span>Analyzing Video Biomechanics...</span>
          </>
        ) : (
          <>
            <PlayCircle size={18} />
            <span>Start AI Injury Risk Analysis</span>
          </>
        )}
      </button>
    </div>
  );
};

const styles = {
  errorBanner: {
    padding: '0.75rem 1rem',
    backgroundColor: '#FEE2E2',
    color: '#B91C1C',
    borderRadius: '8px',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.85rem',
    fontWeight: '600',
  },
  athleteTag: {
    padding: '0.75rem 1rem',
    backgroundColor: '#DCFCE7',
    color: '#15803D',
    borderRadius: '8px',
    fontWeight: '700',
    fontSize: '0.9rem',
  },
  dropZone: {
    border: '2px dashed #CBD5E1',
    borderRadius: '12px',
    padding: '1.5rem',
    textAlign: 'center',
    backgroundColor: '#FAFAFA',
    transition: 'border-color 0.2s ease',
  },
  dropContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  uploadIconCircle: {
    width: '60px',
    height: '60px',
    backgroundColor: '#DCFCE7',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '0.75rem',
  },
  dropTitle: {
    fontWeight: '700',
    fontSize: '1rem',
    color: '#1F2937',
  },
  dropSub: {
    fontSize: '0.8rem',
    color: '#6B7280',
    marginTop: '0.25rem',
  },
  previewContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
  },
  videoPreview: {
    maxWidth: '100%',
    maxHeight: '260px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  fileMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#1F2937',
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    color: '#EF4444',
    fontSize: '0.8rem',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  progressContainer: {
    marginTop: '1.25rem',
    padding: '1rem',
    backgroundColor: '#F0FDF4',
    border: '1px solid #DCFCE7',
    borderRadius: '10px',
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.5rem',
  },
  stageTitle: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#15803D',
  },
  percentText: {
    fontSize: '0.85rem',
    fontWeight: '800',
    color: '#15803D',
  },
  track: {
    height: '10px',
    backgroundColor: '#DCFCE7',
    borderRadius: '9999px',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#15803D',
    transition: 'width 0.3s ease',
  },
  loadingPulse: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginTop: '0.75rem',
    fontSize: '0.78rem',
    color: '#166534',
  },
};

export default VideoUpload;
