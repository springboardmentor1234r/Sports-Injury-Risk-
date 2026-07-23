import React, { useRef, useEffect } from 'react';

export const VelocityGraph = ({ frames, currentFrame, jointName = 'LEFT_ANKLE' }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !frames || frames.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = canvas.parentElement.clientWidth || 400;
    canvas.height = 140;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 20;

    // Clear background
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#0f1015'; // Dark theme panel
    ctx.fillRect(0, 0, width, height);

    // Extract velocities
    const velocities = frames.map(f => f.joint_velocities?.[jointName] || 0.0);
    const maxVal = Math.max(...velocities, 0.1);

    // Draw grid lines
    ctx.strokeStyle = '#1e2030';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const y = padding + (i * (height - 2 * padding)) / 3;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw velocity line path
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#00a3ff'; // Neon HUD blue

    const xStep = (width - 2 * padding) / (frames.length - 1 || 1);

    frames.forEach((f, idx) => {
      const val = f.joint_velocities?.[jointName] || 0.0;
      const x = padding + idx * xStep;
      const y = height - padding - (val / maxVal) * (height - 2 * padding);
      if (idx === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw active frame cursor
    if (currentFrame >= 0 && currentFrame < frames.length) {
      const activeX = padding + currentFrame * xStep;
      ctx.strokeStyle = '#ff1744'; // Neon indicator red
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(activeX, padding);
      ctx.lineTo(activeX, height - padding);
      ctx.stroke();

      // Current values indicator dot
      const val = frames[currentFrame].joint_velocities?.[jointName] || 0.0;
      const activeY = height - padding - (val / maxVal) * (height - 2 * padding);
      ctx.fillStyle = '#ff1744';
      ctx.beginPath();
      ctx.arc(activeX, activeY, 4, 0, 2 * Math.PI);
      ctx.fill();
    }

  }, [frames, currentFrame, jointName]);

  return (
    <div className="hud-glass-panel p-4 rounded-xl border border-hud-border space-y-3">
      <div className="flex justify-between items-center text-xs">
        <span className="font-bold text-gray-400 uppercase tracking-wider">
          Velocity Telemetry ({jointName})
        </span>
        <span className="text-[10px] text-hud-blue font-hud-mono font-bold">
          {frames?.[currentFrame]?.joint_velocities?.[jointName]?.toFixed(2) || '0.00'} U/S
        </span>
      </div>
      <div className="w-full">
        <canvas ref={canvasRef} className="w-full rounded-lg" />
      </div>
    </div>
  );
};

export default VelocityGraph;
