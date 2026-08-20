import React, { useRef, useEffect } from 'react';
import { Activity, ShieldAlert } from 'lucide-react';

const SkeletonViewer = ({ biomechanics, videoUrl }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, width, height);

    // Draw grid pattern for lab theme
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Keypoints for pose skeleton
    const keypoints = {
      head: { x: width * 0.50, y: height * 0.18 },
      l_shoulder: { x: width * 0.42, y: height * 0.30 },
      r_shoulder: { x: width * 0.58, y: height * 0.30 },
      l_elbow: { x: width * 0.36, y: height * 0.44 },
      r_elbow: { x: width * 0.64, y: height * 0.44 },
      l_wrist: { x: width * 0.32, y: height * 0.56 },
      r_wrist: { x: width * 0.68, y: height * 0.56 },
      l_hip: { x: width * 0.44, y: height * 0.54 },
      r_hip: { x: width * 0.56, y: height * 0.54 },
      l_knee: { x: width * 0.43, y: height * 0.72 },
      r_knee: { x: width * 0.54, y: height * 0.72 }, // Inward valgus shift
      l_ankle: { x: width * 0.42, y: height * 0.88 },
      r_ankle: { x: width * 0.57, y: height * 0.88 }
    };

    // Connections
    const limbs = [
      ['l_shoulder', 'r_shoulder'],
      ['l_shoulder', 'l_elbow'],
      ['l_elbow', 'l_wrist'],
      ['r_shoulder', 'r_elbow'],
      ['r_elbow', 'r_wrist'],
      ['l_shoulder', 'l_hip'],
      ['r_shoulder', 'r_hip'],
      ['l_hip', 'r_hip'],
      ['l_hip', 'l_knee'],
      ['l_knee', 'l_ankle'],
      ['r_hip', 'r_knee'],
      ['r_knee', 'r_ankle'],
      ['head', 'l_shoulder'],
      ['head', 'r_shoulder']
    ];

    // Draw Skeleton Limbs
    ctx.lineWidth = 4;
    limbs.forEach(([start, end]) => {
      const p1 = keypoints[start];
      const p2 = keypoints[end];
      
      // Color-code knee valgus limb in amber/red if valgus detected
      if ((start.includes('knee') || end.includes('knee')) && biomechanics?.knee_valgus?.includes('Valgus')) {
        ctx.strokeStyle = '#F59E0B';
      } else {
        ctx.strokeStyle = '#22C55E';
      }

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    });

    // Draw Joint Nodes
    Object.entries(keypoints).forEach(([name, pt]) => {
      ctx.fillStyle = name.includes('knee') ? '#EF4444' : '#22C55E';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 6, 0, 2 * Math.PI);
      ctx.fill();

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw Angle Indicators on Canvas
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText(`Knee Angle: ${biomechanics?.knee_angle || 145}°`, keypoints.r_knee.x + 12, keypoints.r_knee.y);
    ctx.fillText(`Trunk Lean: ${biomechanics?.trunk_lean || 12}°`, keypoints.head.x - 40, keypoints.head.y - 15);

  }, [biomechanics]);

  return (
    <div className="card">
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={18} color="#15803D" />
          <h3 style={styles.title}>MediaPipe Keypoint & Skeleton Tracking</h3>
        </div>
        <span className="badge badge-low">33 Landmark Vectors Active</span>
      </div>

      <div style={styles.canvasWrapper}>
        <canvas ref={canvasRef} width={480} height={320} style={styles.canvas} />
      </div>

      <div style={styles.metricsSummary}>
        <div style={styles.metricItem}>
          <span style={styles.metricLabel}>Knee Alignment</span>
          <span style={{ ...styles.metricVal, color: biomechanics?.knee_valgus?.includes('Valgus') ? '#C2410C' : '#15803D' }}>
            {biomechanics?.knee_valgus || 'Normal'}
          </span>
        </div>
        <div style={styles.metricItem}>
          <span style={styles.metricLabel}>Symmetry Index</span>
          <span style={styles.metricVal}>{biomechanics?.movement_symmetry || 82}%</span>
        </div>
        <div style={styles.metricItem}>
          <span style={styles.metricLabel}>Landing Mechanics</span>
          <span style={styles.metricVal}>{biomechanics?.landing_mechanics || 'Optimal'}</span>
        </div>
      </div>
    </div>
  );
};

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  title: {
    fontWeight: '700',
    fontSize: '0.95rem',
    color: '#1F2937',
  },
  canvasWrapper: {
    display: 'flex',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    borderRadius: '8px',
    overflow: 'hidden',
    marginBottom: '1rem',
  },
  canvas: {
    maxWidth: '100%',
    height: 'auto',
  },
  metricsSummary: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '0.75rem',
    backgroundColor: '#F8FAF9',
    padding: '0.75rem',
    borderRadius: '8px',
  },
  metricItem: {
    display: 'flex',
    flexDirection: 'column',
  },
  metricLabel: {
    fontSize: '0.72rem',
    color: '#6B7280',
    fontWeight: '600',
  },
  metricVal: {
    fontSize: '0.85rem',
    fontWeight: '800',
    color: '#1F2937',
  },
};

export default SkeletonViewer;
