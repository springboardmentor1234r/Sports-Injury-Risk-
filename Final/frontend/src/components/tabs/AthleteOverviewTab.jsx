/**
 * AthleteOverviewTab.jsx
 * Athlete → "Overview" tab.
 * Shows: physical metrics card, video upload / live camera panel, latest analysis result.
 */

import React, { useRef, useState } from 'react';
import {
  FileDown, FileSpreadsheet, UploadCloud, Camera, Circle, Square,
} from 'lucide-react';
import { Video, ShieldAlert } from 'lucide-react';
import { API_BASE, processVideoClientSide, invalidateCache } from '../../hooks/useApi';

export default function AthleteOverviewTab({
  user, token, athleteProfile, latestAnalysis, setLatestAnalysis,
  setVideoHistory, setActiveTab, onUploadSuccess,
  downloadPdfReport, downloadExcelReport,
  isLiveCameraModalOpen, setIsLiveCameraModalOpen,
}) {
  const currentProfile = athleteProfile || { athlete_id: 'ATH-001', sport_type: '—', position: '—', age: '—', height: '—', weight: '—', assigned_coach: 'Not Assigned', assigned_physio: 'Not Assigned' };

  // Camera states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const cameraVideoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  // Upload states
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // ── Camera helpers ──────────────────────────────────────────────────────
  const startCamera = async () => {
    setIsCameraActive(true);
    setErrorMsg('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (cameraVideoRef.current) cameraVideoRef.current.srcObject = stream;
    } catch {
      setErrorMsg('Unable to access webcam. Check device permissions.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (cameraVideoRef.current?.srcObject) {
      cameraVideoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      cameraVideoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsRecording(false);
    clearInterval(recordingTimerRef.current);
    setRecordingSeconds(0);
  };

  const startRecording = () => {
    if (!cameraVideoRef.current?.srcObject) return;
    recordedChunksRef.current = [];
    const mr = new MediaRecorder(cameraVideoRef.current.srcObject, { mimeType: 'video/webm' });
    mr.ondataavailable = (e) => { if (e.data?.size > 0) recordedChunksRef.current.push(e.data); };
    mediaRecorderRef.current = mr;
    mr.start();
    setIsRecording(true);
    setRecordingSeconds(0);
    recordingTimerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
  };

  const stopRecordingAndAnalyze = () => {
    if (!mediaRecorderRef.current) return;
    setIsRecording(false);
    clearInterval(recordingTimerRef.current);
    mediaRecorderRef.current.onstop = async () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const liveFile = new File([blob], `live_capture_${Date.now()}.webm`, { type: 'video/webm' });
      await processFile(liveFile);
      stopCamera();
    };
    mediaRecorderRef.current.stop();
  };

  // ── Core upload + client-side pose estimation ───────────────────────────
  const processFile = async (file) => {
    if (!file) return;
    setUploading(true);
    setErrorMsg('');
    setProgress('Initializing MediaPipe Pose Engine...');
    try {
      const telemetry = await processVideoClientSide(
        file,
        athleteProfile?.height,
        setProgress,
      );

      const formData = new FormData();
      formData.append('file', file);
      formData.append('telemetry', JSON.stringify(telemetry));

      const res = await fetch(`${API_BASE}/api/videos/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Video processing failed.');

      setLatestAnalysis(data);
      setVideoHistory((prev) => [data, ...prev.filter((v) => (v.analysis_id || v._id) !== (data.analysis_id || data._id))]);

      // Invalidate caches so prediction / history tabs reload fresh data
      invalidateCache(
        `prediction-${user.role === 'Athlete' ? 'me' : 'selected'}`,
        `pred-history-${user.role === 'Athlete' ? 'me' : 'selected'}`,
        `recommendations-${user.role === 'Athlete' ? 'me' : 'selected'}`,
        'video-history',
      );
      onUploadSuccess?.();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to scan and upload video.');
    } finally {
      setUploading(false);
      setProgress('');
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) await processFile(file);
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="dashboard-overview-layout">
      {/* Physical Metrics Card */}
      <div className="content-hero-card animate-fade-in">
        <div className="hero-accent-strip" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 className="workspace-title">Welcome back, {user.fullname}!</h2>
            <p className="workspace-desc">Your biomechanics and injury metrics summary are listed below.</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => downloadPdfReport('me')} className="form-submit-btn"
              style={{ width: 'auto', padding: '8px 14px', marginTop: 0, backgroundColor: '#0f766e', fontSize: '0.85rem' }}>
              <FileDown size={16} /><span>Download PDF</span>
            </button>
            <button onClick={() => downloadExcelReport('me')} className="form-submit-btn"
              style={{ width: 'auto', padding: '8px 14px', marginTop: 0, backgroundColor: '#2563eb', fontSize: '0.85rem' }}>
              <FileSpreadsheet size={16} /><span>Export CSV</span>
            </button>
          </div>
        </div>

        <div className="metrics-grid">
          {[
            ['Athlete ID', currentProfile.athlete_id],
            ['Sport Type', currentProfile.sport_type],
            ['Position', currentProfile.position],
            ['Age', currentProfile.age && `${currentProfile.age} yrs`],
            ['Height', currentProfile.height && `${currentProfile.height} cm`],
            ['Weight', currentProfile.weight && `${currentProfile.weight} kg`],
            ['Assigned Coach', currentProfile.assigned_coach || 'Not Assigned'],
            ['Assigned Physio', currentProfile.assigned_physio || 'Not Assigned'],
          ].map(([label, val]) => (
            <div key={label} className="metric-card">
              <span className="metric-label">{label}</span>
              <span className="metric-value">{val || '—'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Upload + Analysis Row */}
      <div className="overview-widgets-row">
        {/* Video Upload Card */}
        <div className="content-hero-card video-upload-card animate-fade-in">
          <div className="hero-accent-strip" />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <h3 style={{ margin: 0 }}>Motion Video Capture &amp; ML Processing</h3>
              <p className="widget-subtitle-desc" style={{ margin: '4px 0 0' }}>
                Upload a video file OR record a live camera event for real-time biomechanics analysis.
              </p>
            </div>
            <button onClick={() => setIsLiveCameraModalOpen(true)} className="form-submit-btn"
              style={{ width: 'auto', padding: '8px 16px', margin: 0, backgroundColor: '#10b981', fontSize: '0.85rem' }}>
              <Camera size={16} /><span>Launch Live Motion Camera</span>
            </button>
          </div>

          {isCameraActive ? (
            <div style={{ position: 'relative', width: '100%', borderRadius: 8, overflow: 'hidden', backgroundColor: '#000', marginBottom: 12 }}>
              <video ref={cameraVideoRef} autoPlay playsInline style={{ width: '100%', height: 240, objectFit: 'cover' }} />
              <div style={{ position: 'absolute', top: 12, right: 12 }}>
                {isRecording && (
                  <div style={{ backgroundColor: 'rgba(220,38,38,0.9)', color: '#fff', padding: '4px 10px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Circle size={10} fill="#fff" className="pulse-high" />
                    <span>REC {String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:{String(recordingSeconds % 60).padStart(2, '0')}</span>
                  </div>
                )}
              </div>
              <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 12 }}>
                {!isRecording ? (
                  <button onClick={startRecording} style={{ padding: '8px 18px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: 20, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Circle size={14} fill="white" /><span>Start Recording</span>
                  </button>
                ) : (
                  <button onClick={stopRecordingAndAnalyze} style={{ padding: '8px 18px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: 20, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Square size={14} fill="white" /><span>Stop &amp; Analyze</span>
                  </button>
                )}
                <button onClick={stopCamera} style={{ padding: '8px 14px', backgroundColor: '#475569', color: '#fff', border: 'none', borderRadius: 20, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <label className="upload-dropzone" style={{ cursor: 'pointer', display: 'block' }}>
              <UploadCloud size={40} className="upload-dropzone-icon" />
              <p>Drag and drop your file here, or click to browse</p>
              <input type="file" accept="video/*" onChange={handleFileChange} disabled={uploading} className="file-input-hidden" />
            </label>
          )}

          {errorMsg && (
            <div style={{ marginTop: 10, padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: '0.85rem' }}>
              {errorMsg}
            </div>
          )}

          {uploading && (
            <div className="upload-processing-spinner" style={{ marginTop: 12 }}>
              <div className="loading-spinner" />
              <span>{progress || 'Running MediaPipe Pose Estimation & ML Risk Engine...'}</span>
            </div>
          )}
        </div>

        {/* Latest Analysis Result */}
        {latestAnalysis ? (
          <div className="content-hero-card video-analysis-summary-card animate-scale-in">
            <div className="hero-accent-strip" />
            <div className="summary-header">
              <span className="summary-title-label">Latest Assessment Result</span>
              <h4>{latestAnalysis.filename}</h4>
              <div className="analysis-id-badge">ID: {latestAnalysis.analysis_id}</div>
            </div>
            <div className="outcome-metrics-grid">
              <div className="outcome-metric-box">
                <span className="outcome-label">Movement Score</span>
                <span className="outcome-value score-optimal">{latestAnalysis.scores?.movement_quality_score}%</span>
              </div>
              <div className="outcome-metric-box">
                <span className="outcome-label">Injury Risk</span>
                <span className={`outcome-value ${latestAnalysis.scores?.injury_risk_score > 40 ? 'score-warning' : 'score-safe'}`}>
                  {latestAnalysis.scores?.injury_risk_score}%
                </span>
              </div>
            </div>
            <div className="summary-actions-container">
              <button onClick={() => setActiveTab('MovementAnalysis')} className="summary-btn btn-primary">
                <Video size={16} /><span>Analyze Joint Angles</span>
              </button>
              <button onClick={() => setActiveTab('InjuryRisk')} className="summary-btn btn-secondary">
                <ShieldAlert size={16} /><span>View Risk Diagnostics</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="content-hero-card empty-analysis-summary animate-fade-in">
            <div className="hero-accent-strip" />
            <h3>No Analysis Completed</h3>
            <p>Upload a sports movement video above. Our neural network calibration engine will construct your body wireframe and joint flexion profiles.</p>
          </div>
        )}
      </div>
    </div>
  );
}
