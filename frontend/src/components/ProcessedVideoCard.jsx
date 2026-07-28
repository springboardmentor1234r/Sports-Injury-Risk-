import React from "react";

function ProcessedVideoCard({ videoPath }) {
  if (!videoPath) return null;

  const videoURL = videoPath.startsWith("http")
    ? videoPath
    : `http://127.0.0.1:8000/${videoPath}`;

  return (
    <div className="card processed-video-card">

      <div className="card-header">
        <span className="card-icon"></span>
        <h3>Processed Analysis Video</h3>
      </div>

      <p className="video-description">
        AI pose estimation, joint angle detection and injury analysis completed successfully.
      </p>

      <video
        controls
        className="processed-video"
      >
        <source
          src={videoURL}
          type="video/mp4"
        />
      </video>

      <div className="video-success">

        <span className="success-dot"></span>

        <span>Analysis Completed</span>

      </div>

    </div>
  );
}

export default ProcessedVideoCard;