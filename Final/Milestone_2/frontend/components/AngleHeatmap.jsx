import React, { useRef, useEffect } from 'react';

export const AngleHeatmap = ({ frames, currentFrame }) => {
  const canvasRef = useRef(null);

  const angleKeys = ['knee_flexion_left', 'knee_flexion_right', 'knee_valgus_left', 'knee_valgus_right'];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !frames || frames.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.parentElement.clientWidth || 300;
    canvas.height = 140;

    const w = canvas.width;
    const h = canvas.height;
    const padding = 20;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0f1015';
    ctx.fillRect(0, 0, w, h);

    const rowHeight = (h - 2 * padding) / angleKeys.length;
    const colWidth = (w - 2 * padding) / frames.length;

    // Draw Heatmap Blocks
    frames.forEach((f, fIdx) => {
      angleKeys.forEach((key, kIdx) => {
        const val = f.joint_angles?.[key] || 0.0;
        
        // Normalize color intensity based on angle value
        // Flexion: 0-140 degrees. Valgus: 0-25 degrees.
        const maxLimit = key.includes('valgus') ? 20.0 : 130.0;
        const normVal = Math.min(1.0, val / maxLimit);

        // Green -> Yellow -> Red transition
        let color = '';
        if (normVal < 0.5) {
          const greenAmt = 255;
          const redAmt = Math.round(normVal * 2 * 255);
          color = `rgb(${redAmt}, ${greenAmt}, 30)`;
        } else {
          const redAmt = 255;
          const greenAmt = Math.round((1.0 - normVal) * 2 * 255);
          color = `rgb(${redAmt}, ${greenAmt}, 30)`;
        }

        ctx.fillStyle = color;
        ctx.fillRect(
          padding + fIdx * colWidth,
          padding + kIdx * rowHeight,
          Math.max(1, colWidth),
          rowHeight - 1
        );
      });
    });

    // Draw active frame cursor
    if (currentFrame >= 0 && currentFrame < frames.length) {
      const cursorX = padding + currentFrame * colWidth;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cursorX, padding);
      ctx.lineTo(cursorX, h - padding);
      ctx.stroke();
    }

  }, [frames, currentFrame]);

  return (
    <div className="hud-glass-panel p-4 rounded-xl border border-hud-border space-y-3">
      <div className="flex justify-between items-center text-xs">
        <span className="font-bold text-gray-400 uppercase tracking-wider">
          Kinetic Flexion Intensity Heatmap
        </span>
        <span className="text-[9px] text-hud-blue font-hud-mono font-bold">
          4 AXES RESOLVED
        </span>
      </div>
      <div className="w-full">
        <canvas ref={canvasRef} className="w-full rounded-lg" />
      </div>
      <div className="flex justify-between text-[9px] text-gray-500 font-hud-mono">
        <span>L/R KNEE FLEXION</span>
        <span>L/R KNEE VALGUS</span>
      </div>
    </div>
  );
};

export default AngleHeatmap;
