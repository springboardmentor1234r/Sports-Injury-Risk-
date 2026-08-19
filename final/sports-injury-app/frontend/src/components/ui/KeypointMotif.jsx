// KeypointMotif — the app's one signature visual: a sparse pose-estimation
// skeleton (dots + connecting lines), directly referencing what this product
// actually does (joint/keypoint tracking from video). Used sparingly: auth
// screens and empty states only, never as generic decoration.

export default function KeypointMotif({ className = "" }) {
  const points = [
    [40, 20], [40, 55], [20, 40], [60, 40], // head, spine-top, L-shoulder, R-shoulder
    [40, 90], [15, 75], [65, 75], // spine-mid, L-elbow, R-elbow
    [5, 110], [75, 110], // L-wrist, R-wrist
    [40, 140], [25, 145], [55, 145], // pelvis, hips
    [20, 200], [60, 200], // knees
    [15, 250], [65, 250], // ankles
  ];
  const bones = [
    [0, 1], [1, 2], [1, 3], [1, 4], [4, 5], [4, 6], [5, 7], [6, 8],
    [4, 9], [9, 10], [9, 11], [10, 12], [11, 13], [12, 14], [13, 15],
  ];

  return (
    <svg
      viewBox="0 0 80 260"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {bones.map(([a, b], i) => (
        <line
          key={i}
          x1={points[a][0]} y1={points[a][1]}
          x2={points[b][0]} y2={points[b][1]}
          stroke="#22D3C7" strokeOpacity="0.35" strokeWidth="1"
        />
      ))}
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === 0 ? 5 : 3} fill="#22D3C7" fillOpacity="0.6" />
      ))}
    </svg>
  );
}
