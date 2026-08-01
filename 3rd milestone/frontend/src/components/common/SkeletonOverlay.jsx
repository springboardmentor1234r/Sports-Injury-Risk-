import React, { useRef, useEffect } from 'react';

const POSE_CONNECTIONS = [
  [5, 7], [7, 9], [6, 8], [8, 10], // arms
  [5, 6], [5, 11], [6, 12], [11, 12], // torso
  [11, 13], [13, 15], [12, 14], [14, 16] // legs
];

export default function SkeletonOverlay({ videoElement, poseData, width, height }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !poseData) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, width, height);

    // Draw lines
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#00ff00';
    POSE_CONNECTIONS.forEach(([startIdx, endIdx]) => {
      const start = poseData[startIdx];
      const end = poseData[endIdx];
      if (start && end && start.score > 0.5 && end.score > 0.5) {
        ctx.beginPath();
        ctx.moveTo(start.x * width, start.y * height);
        ctx.lineTo(end.x * width, end.y * height);
        ctx.stroke();
      }
    });

    // Draw points
    ctx.fillStyle = '#ff0000';
    poseData.forEach((point) => {
      if (point.score > 0.5) {
        ctx.beginPath();
        ctx.arc(point.x * width, point.y * height, 4, 0, 2 * Math.PI);
        ctx.fill();
      }
    });
  }, [poseData, width, height]);

  return (
    <canvas 
      ref={canvasRef} 
      width={width} 
      height={height} 
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
    />
  );
}
