import React from 'react';

const HIGHLIGHTED_LANDMARKS = [
  'Head', 'LEFT_SHOULDER', 'RIGHT_SHOULDER', 'LEFT_ELBOW', 'RIGHT_ELBOW',
  'LEFT_WRIST', 'RIGHT_WRIST', 'LEFT_HIP', 'RIGHT_HIP', 'LEFT_KNEE',
  'RIGHT_KNEE', 'LEFT_ANKLE', 'RIGHT_ANKLE', 'LEFT_FOOT_INDEX', 'RIGHT_FOOT_INDEX'
];

export const LandmarkTable = ({ landmarks }) => {
  const getFormatLabel = (rawName) => {
    // Convert e.g. LEFT_SHOULDER to Left Shoulder
    return rawName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <div className="hud-glass-panel p-5 rounded-xl border border-hud-border space-y-4">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Landmark Coordinates (Current Frame)
      </h3>

      <div className="overflow-y-auto max-h-[220px] rounded-lg border border-hud-border bg-hud-dark/20 pr-1">
        <table className="w-full text-left text-[10px] font-hud-mono text-gray-400 border-collapse">
          <thead>
            <tr className="bg-hud-dark/60 text-[9px] uppercase tracking-wider text-hud-blue border-b border-hud-border sticky top-0">
              <th className="p-2">Joint Landmark</th>
              <th className="p-2">X</th>
              <th className="p-2">Y</th>
              <th className="p-2">Z</th>
              <th className="p-2 text-right">Visibility</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hud-border/40 text-gray-300">
            {landmarks && landmarks.length > 0 ? (
              landmarks.map((lm, idx) => {
                const percent = Math.round(lm.visibility * 100);
                return (
                  <tr key={idx} className="hover:bg-hud-blue/5">
                    <td className="p-2 font-sans font-semibold text-white">
                      {getFormatLabel(lm.name)}
                    </td>
                    <td className="p-2">{lm.x.toFixed(4)}</td>
                    <td className="p-2">{lm.y.toFixed(4)}</td>
                    <td className="p-2">{lm.z.toFixed(4)}</td>
                    <td className={`p-2 text-right font-bold ${
                      percent >= 80 
                        ? 'text-hud-green' 
                        : percent >= 50 
                          ? 'text-hud-warning' 
                          : 'text-hud-danger'
                    }`}>
                      {percent}%
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="5" className="p-6 text-center text-gray-500 uppercase text-[9px]">
                  No joint telemetry tracked on this frame.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LandmarkTable;
