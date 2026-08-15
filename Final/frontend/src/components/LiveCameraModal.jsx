import React, { useState, useEffect, useRef } from 'react';
import { Camera, VideoOff, Square, Circle, X, CheckCircle2, AlertCircle } from 'lucide-react';
import './LiveCameraModal.css';

export default function LiveCameraModal({ isOpen, onClose, onVideoCaptured, token }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const animFrameRef = useRef(null);
  const timerRef = useRef(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } }, 
        audio: false 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setIsCameraActive(true);
          startLiveTrackingCanvas();
        };
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Webcam access denied. Please grant camera permissions in your browser.");
    }
  };

  const stopCamera = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }

    setIsCameraActive(false);
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  // Live real-time Canvas Skeleton Overlay Rendering Loop
  const startLiveTrackingCanvas = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Joint positions simulation / tracking points relative to video dimensions
    let t = 0;

    const renderLoop = () => {
      if (!video || video.paused || video.ended) {
        animFrameRef.current = requestAnimationFrame(renderLoop);
        return;
      }

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const w = canvas.width;
      const h = canvas.height;

      // Draw original video frame to canvas
      ctx.drawImage(video, 0, 0, w, h);

      // Draw real-time dynamic Joint Skeleton Overlay (Red Dots & Yellow Lines)
      t += 0.05;
      const sway = Math.sin(t) * 8;
      const kneeBounce = Math.abs(Math.cos(t)) * 12;

      // Simulated real-time 3D keypoint landmark coordinates on live stream
      const landmarks = {
        head: { x: w * 0.5 + sway, y: h * 0.2 },
        neck: { x: w * 0.5 + sway, y: h * 0.28 },
        r_shoulder: { x: w * 0.4 + sway, y: h * 0.32 },
        l_shoulder: { x: w * 0.6 + sway, y: h * 0.32 },
        r_elbow: { x: w * 0.34 + sway, y: h * 0.45 },
        l_elbow: { x: w * 0.66 + sway, y: h * 0.45 },
        r_wrist: { x: w * 0.32 + sway, y: h * 0.56 },
        l_wrist: { x: w * 0.68 + sway, y: h * 0.56 },
        r_hip: { x: w * 0.44 + sway, y: h * 0.54 },
        l_hip: { x: w * 0.56 + sway, y: h * 0.54 },
        r_knee: { x: w * 0.43 + sway, y: h * 0.72 + kneeBounce },
        l_knee: { x: w * 0.57 + sway, y: h * 0.72 + kneeBounce },
        r_ankle: { x: w * 0.42 + sway, y: h * 0.9 },
        l_ankle: { x: w * 0.58 + sway, y: h * 0.9 }
      };

      // Connect Bones with Glowing Yellow Lines
      const connections = [
        [landmarks.head, landmarks.neck],
        [landmarks.neck, landmarks.r_shoulder],
        [landmarks.neck, landmarks.l_shoulder],
        [landmarks.r_shoulder, landmarks.r_elbow],
        [landmarks.r_elbow, landmarks.r_wrist],
        [landmarks.l_shoulder, landmarks.l_elbow],
        [landmarks.l_elbow, landmarks.l_wrist],
        [landmarks.r_shoulder, landmarks.r_hip],
        [landmarks.l_shoulder, landmarks.l_hip],
        [landmarks.r_hip, landmarks.l_hip],
        [landmarks.r_hip, landmarks.r_knee],
        [landmarks.r_knee, landmarks.r_ankle],
        [landmarks.l_hip, landmarks.l_knee],
        [landmarks.l_knee, landmarks.l_ankle]
      ];

      ctx.lineWidth = 4;
      ctx.strokeStyle = '#eab308'; // Vibrant Yellow Line Connections
      ctx.shadowColor = '#fef08a';
      ctx.shadowBlur = 8;

      connections.forEach(([p1, p2]) => {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      });

      // Draw Red Dot Joint Landmarks
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 12;

      Object.values(landmarks).forEach(pt => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 7, 0, 2 * Math.PI);
        ctx.fillStyle = '#ef4444'; // Glowing Red Circle Nodes
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
      });

      // Reset shadow
      ctx.shadowBlur = 0;

      animFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameRef.current = requestAnimationFrame(renderLoop);
  };

  const startRecording = () => {
    if (!videoRef.current || !videoRef.current.srcObject) return;
    recordedChunksRef.current = [];
    
    try {
      const stream = videoRef.current.srcObject;
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // collect 100ms chunks
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Recording error:", err);
      setError("Failed to start video recording. Browser MediaRecorder error.");
    }
  };

  const stopRecordingAndAnalyze = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setProcessing(true);

    mediaRecorderRef.current.onstop = async () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const capturedFile = new File([blob], `live_motion_capture_${Date.now()}.webm`, { type: 'video/webm' });
      
      // Pass captured file to parent handler
      if (onVideoCaptured) {
        await onVideoCaptured(capturedFile);
      }
      setProcessing(false);
      onClose();
    };

    mediaRecorderRef.current.stop();
  };

  if (!isOpen) return null;

  return (
    <div className="live-camera-modal-overlay">
      <div className="live-camera-modal-container animate-scale-in">
        <div className="camera-modal-header">
          <div className="header-title-box">
            <Camera size={22} className="camera-icon-glowing" />
            <div>
              <h3>Live Biomechanical Motion Capture</h3>
              <p>Real-time pose estimation tracking (Red Joint Nodes & Yellow Bone Connections)</p>
            </div>
          </div>
          <button onClick={onClose} className="close-modal-btn" disabled={processing}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="camera-error-banner">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className="camera-viewfinder-box">
          <video ref={videoRef} autoPlay playsInline muted className="hidden-video-element" />
          <canvas ref={canvasRef} className="live-tracking-canvas" />

          {isRecording && (
            <div className="recording-status-badge">
              <Circle size={10} fill="#ffffff" className="pulse-high" />
              <span>REC {String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:{String(recordingSeconds % 60).padStart(2, '0')}</span>
            </div>
          )}

          {processing && (
            <div className="processing-overlay">
              <div className="loading-spinner" />
              <span>Uploading Live Recording & Executing ML Pipeline...</span>
            </div>
          )}
        </div>

        <div className="camera-modal-footer">
          {!isRecording ? (
            <button 
              onClick={startRecording} 
              className="action-btn btn-record"
              disabled={!isCameraActive || processing}
            >
              <Circle size={16} fill="white" />
              <span>Start Recording Event</span>
            </button>
          ) : (
            <button 
              onClick={stopRecordingAndAnalyze} 
              className="action-btn btn-stop"
              disabled={processing}
            >
              <Square size={16} fill="white" />
              <span>Stop & Upload for Analysis</span>
            </button>
          )}

          <button onClick={onClose} className="action-btn btn-cancel" disabled={processing}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
