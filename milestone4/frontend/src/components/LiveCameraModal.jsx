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

  const poseRef = useRef(null);
  const latestLandmarksRef = useRef(null);

  useEffect(() => {
    // Dynamically load MediaPipe Pose scripts from CDN
    let isMounted = true;
    const loadMediaPipe = async () => {
      try {
        if (!window.Pose) {
          const script1 = document.createElement('script');
          script1.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js';
          script1.crossOrigin = 'anonymous';
          document.body.appendChild(script1);

          const script2 = document.createElement('script');
          script2.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js';
          script2.crossOrigin = 'anonymous';
          document.body.appendChild(script2);

          await new Promise((resolve) => {
            script2.onload = resolve;
          });
        }

        if (window.Pose && isMounted) {
          if (poseRef.current) {
            try {
              poseRef.current.close();
            } catch (e) {
              console.error("Error closing existing Pose:", e);
            }
            poseRef.current = null;
          }
          const pose = new window.Pose({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
          });
          pose.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            enableSegmentation: false,
            minDetectionConfidence: 0.45,
            minTrackingConfidence: 0.45
          });
          pose.onResults((results) => {
            if (isMounted) {
              latestLandmarksRef.current = results.poseLandmarks || null;
            }
          });
          poseRef.current = pose;
        }
      } catch (err) {
        console.error("MediaPipe script loading error:", err);
      }
    };

    if (isOpen) {
      loadMediaPipe();
      startCamera();
    } else {
      stopCamera();
      if (poseRef.current) {
        try {
          poseRef.current.close();
        } catch (e) {
          console.error("Error closing Pose:", e);
        }
        poseRef.current = null;
      }
    }

    return () => {
      isMounted = false;
      stopCamera();
      if (poseRef.current) {
        try {
          poseRef.current.close();
        } catch (e) {
          console.error("Error closing Pose in cleanup:", e);
        }
        poseRef.current = null;
      }
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
    latestLandmarksRef.current = null;
  };

  // Standard MediaPipe Pose 33-Landmark Bone Connections
  const POSE_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8], [9, 10], // Head & Face
    [11, 12], // Shoulders
    [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], // Left Arm & Hand
    [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], // Right Arm & Hand
    [11, 23], [12, 24], [23, 24], // Torso / Hips
    [23, 25], [25, 27], [27, 29], [27, 31], // Left Leg
    [24, 26], [26, 28], [28, 30], [28, 32]  // Right Leg
  ];

  // Live real-time Canvas Skeleton Overlay Rendering Loop
  const startLiveTrackingCanvas = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    let lastPoseSendTime = 0;

    const renderLoop = async () => {
      if (!video || video.paused || video.ended) {
        animFrameRef.current = requestAnimationFrame(renderLoop);
        return;
      }

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const w = canvas.width;
      const h = canvas.height;

      // Draw real-time webcam video stream
      ctx.drawImage(video, 0, 0, w, h);

      // Send frame to MediaPipe Pose detector (~15-30 FPS)
      const now = Date.now();
      if (poseRef.current && (now - lastPoseSendTime > 40)) {
        lastPoseSendTime = now;
        try {
          await poseRef.current.send({ image: video });
        } catch (e) {
          // ignore transient frame send error
        }
      }

      const landmarks = latestLandmarksRef.current;

      if (landmarks && landmarks.length > 0) {
        // Draw Bone Connections ONLY for visible keypoints (visibility > 0.45)
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#eab308'; // Glowing Yellow Bone Connections
        ctx.shadowColor = '#fef08a';
        ctx.shadowBlur = 8;

        POSE_CONNECTIONS.forEach(([i, j]) => {
          const p1 = landmarks[i];
          const p2 = landmarks[j];
          if (
            p1 && p2 && 
            (p1.visibility === undefined || p1.visibility > 0.4) && 
            (p2.visibility === undefined || p2.visibility > 0.4)
          ) {
            ctx.beginPath();
            ctx.moveTo(p1.x * w, p1.y * h);
            ctx.lineTo(p2.x * w, p2.y * h);
            ctx.stroke();
          }
        });

        // Draw Red Joint Circle Nodes ONLY for joints visible in camera frame
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 10;

        landmarks.forEach((lm) => {
          if (lm && (lm.visibility === undefined || lm.visibility > 0.4)) {
            ctx.beginPath();
            ctx.arc(lm.x * w, lm.y * h, 6, 0, 2 * Math.PI);
            ctx.fillStyle = '#ef4444'; // Glowing Red Circle Nodes
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();
          }
        });

        ctx.shadowBlur = 0;
      }

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
