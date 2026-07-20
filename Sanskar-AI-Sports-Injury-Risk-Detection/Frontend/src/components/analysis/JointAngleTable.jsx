import React from 'react';
import { formatAngle } from './analysisFormatters';

const JOINTS = [
  ['leftElbow', 'Left Elbow'], ['rightElbow', 'Right Elbow'], ['leftKnee', 'Left Knee'], ['rightKnee', 'Right Knee'],
];

const JointAngleTable = ({ frames }) => (
  <section className="glass-panel rounded-2xl border border-slate-800 p-5 sm:p-6">
    <h2 className="text-lg font-bold text-white">Joint Angle Table</h2><p className="mt-1 text-sm text-slate-400">Angles returned for each extracted frame.</p>
    <div className="mt-5 overflow-x-auto rounded-xl border border-slate-800"><table className="min-w-full text-left text-sm"><thead className="bg-slate-950/80 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-4 py-3">Frame</th>{JOINTS.map(([, label]) => <th key={label} className="px-4 py-3">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-800 bg-slate-900/30">{frames?.length ? frames.map((frame, index) => <tr key={frame.framePath || index} className="text-slate-300"><td className="px-4 py-3 font-medium text-white">{index + 1}</td>{JOINTS.map(([key]) => <td key={key} className="px-4 py-3">{formatAngle(frame?.jointAngles?.[key])}</td>)}</tr>) : <tr><td colSpan="5" className="px-4 py-6 text-center text-slate-400">No frame angles returned.</td></tr>}</tbody></table></div>
  </section>
);

export default JointAngleTable;

