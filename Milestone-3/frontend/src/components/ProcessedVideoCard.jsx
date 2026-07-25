import React from "react";

function ProcessedVideoCard({ videoPath }) {
  if (!videoPath) return null;

  // If it's already a full URL, use it.
  // Otherwise, prepend the backend URL.
  const videoURL = videoPath.startsWith("http")
    ? videoPath
    : `http://127.0.0.1:8000/${videoPath}`;

  return (
    <div className="card processed-video-card">
      <div className="card-header">
        <span className="card-icon">🎥</span>
        <h3>Processed Analysis Video</h3>
      </div>

      <p className="video-description">
        The AI has processed your uploaded video with pose estimation,
        joint angle detection, and injury risk analysis.
      </p>

      <div className="video-container">
        <video controls className="processed-video">
          <source src={videoURL} type="video/mp4" />
          Your browser does not support video playback.
        </video>
      </div>

      <div className="video-status">
        <span className="status-dot"></span>
        Processing completed successfully
      </div>
    </div>
  );
}

export default ProcessedVideoCard;