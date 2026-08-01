import React from 'react';

const TimelineChart = () => {
  const events = [
    { time: '0.5s', event: 'Initial Contact', type: 'info' },
    { time: '1.2s', event: 'Max Knee Flexion', type: 'warning' },
    { time: '1.8s', event: 'Valgus Collapse Detected', type: 'danger' },
    { time: '2.5s', event: 'Take off', type: 'info' },
  ];

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
      <h3 className="text-lg font-bold text-white mb-6">Movement Timeline</h3>
      <div className="relative border-l-2 border-slate-600 ml-4 space-y-6">
        {events.map((evt, idx) => (
          <div key={idx} className="relative pl-6">
            <span className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-[#0F172A] ${
              evt.type === 'danger' ? 'bg-rose-500' : evt.type === 'warning' ? 'bg-amber-500' : 'bg-indigo-500'
            }`}></span>
            <div className="bg-white/5 p-3 rounded-lg border border-white/5">
              <span className="text-indigo-400 font-mono text-sm">{evt.time}</span>
              <p className="text-white mt-1">{evt.event}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimelineChart;
