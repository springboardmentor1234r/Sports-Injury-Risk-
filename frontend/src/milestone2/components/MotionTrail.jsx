import React, { useRef, useEffect } from 'react';

export const MotionTrail = ({ trailData, jointName = 'LEFT_ANKLE' }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !trailData || trailData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.parentElement.clientWidth || 300;
    canvas.height = 140;

    const w = canvas.width;
    const h = canvas.height;
    const pad = 20;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0f1015';
    ctx.fillRect(0, 0, w, h);

    // Extract X and Y coords
    const xs = trailData.map(pt => pt[0]);
    const ys = trailData.map(pt => pt[1]);

    const minX = Math.min(...xs, 0.0);
    const maxX = Math.max(...xs, 1.0);
    const minY = Math.min(...ys, 0.0);
    const maxY = Math.max(...ys, 1.0);

    const rangeX = maxX - minX || 0.1;
    const rangeY = maxY - minY || 0.1;

    // Draw Grid Lines
    ctx.strokeStyle = '#1a1b25';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, Math.min(w, h) / 3, 0, 2 * Math.PI);
    ctx.stroke();

    // Draw Motion trail path
    ctx.beginPath();
    ctx.strokeStyle = '#00e676'; // Neon green
    ctx.lineWidth = 2;

    trailData.forEach((pt, idx) => {
      // Map normalized coords [0-1] to canvas scale
      const cx = pad + ((pt[0] - minX) / rangeX) * (w - 2 * pad);
      const cy = pad + ((pt[1] - minY) / rangeY) * (h - 2 * pad);

      if (idx === 0) {
        ctx.moveTo(cx, cy);
      } else {
        ctx.lineTo(cx, cy);
      }
    });
    ctx.stroke();

    // Draw endpoints
    if (trailData.length > 0) {
      const lastPt = trailData[trailData.length - 1];
      const lx = pad + ((lastPt[0] - minX) / rangeX) * (w - 2 * pad);
      const ly = pad + ((lastPt[1] - minY) / rangeY) * (h - 2 * pad);
      
      ctx.fillStyle = '#00e676';
      ctx.beginPath();
      ctx.arc(lx, ly, 4, 0, 2 * Math.PI);
      ctx.fill();
    }

  }, [trailData, jointName]);

  return (
    <div className="hud-glass-panel p-4 rounded-xl border border-hud-border space-y-3">
      <div className="flex justify-between items-center text-xs">
        <span className="font-bold text-gray-400 uppercase tracking-wider">
          Motion Path Displacement ({jointName})
        </span>
        <span className="text-[9px] text-hud-green font-hud-mono font-bold">
          TRAIL RESOLVED
        </span>
      </div>
      <div className="w-full">
        <canvas ref={canvasRef} className="w-full rounded-lg" />
      </div>
    </div>
  );
};

export default MotionTrail;
