import React from 'react';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      num: '1',
      title: 'Upload',
      desc: 'Capture movement on any smartphone.'
    },
    {
      num: '2',
      title: 'AI Extraction',
      desc: 'Skeleton mapping in real-time.'
    },
    {
      num: '3',
      title: 'Risk Scoring',
      desc: 'Validation against clinical data.'
    },
    {
      num: '4',
      title: 'Recommendations',
      desc: 'Targeted corrective drills.'
    }
  ];

  return (
    <section id="how-it-works" className="bg-[#eff4ff] py-20 lg:py-32 border-y border-[#c5c6cd]/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 text-center">
        <span className="text-[#1d4ed8] font-bold text-[11px] tracking-widest uppercase mb-3 block">
          CLINICAL PROCESS WORKFLOW
        </span>
        <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0b1c30] mb-16">
          From video to insight in minutes
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-6 relative">
          {steps.map((step, idx) => (
            <div key={idx} className="flex flex-col items-center relative group">
              {/* Connector line on desktop for steps 1 to 3 */}
              {idx < 3 && (
                <div className="hidden md:block absolute top-6 left-[60%] w-[80%] h-0.5 bg-[#c5c6cd]/80 z-0"></div>
              )}

              {/* Number Circle */}
              <div className="w-12 h-12 bg-[#101c2e] text-white flex items-center justify-center rounded-full mb-6 relative z-10 font-black text-lg shadow-md group-hover:scale-110 group-hover:bg-[#1d4ed8] transition-all duration-300">
                {step.num}
              </div>

              <h3 className="font-serif text-xl font-bold text-[#0b1c30] mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-[#45474c] max-w-[200px] leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
