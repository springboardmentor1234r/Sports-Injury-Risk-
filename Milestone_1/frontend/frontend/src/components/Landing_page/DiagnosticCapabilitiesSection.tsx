import React from 'react';

export const DiagnosticCapabilitiesSection: React.FC = () => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-20 lg:py-32">
      <span className="text-[#1d4ed8] font-bold text-[11px] tracking-widest uppercase mb-3 block text-center md:text-left">
        DIAGNOSTIC CAPABILITIES
      </span>
      <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0b1c30] mb-12 text-center md:text-left">
        Everything you need to prevent injury
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Card 1: Real-time movement analysis */}
        <div className="bg-white border border-[#c5c6cd] rounded-2xl overflow-hidden group hover:-translate-y-2 hover:shadow-xl transition-all duration-300 flex flex-col">
          <div className="h-52 bg-[#e5eeff] p-6 border-b border-[#c5c6cd] relative overflow-hidden flex items-center justify-center">
            {/* Simulated UI: Bar Chart */}
            <div className="w-full h-full bg-white rounded-xl border border-[#c5c6cd]/80 p-4 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center mb-2">
                <div className="w-24 h-3 bg-[#e5eeff] rounded-full"></div>
                <div className="w-12 h-3 bg-[#1d4ed8]/20 rounded-full"></div>
              </div>
              <div className="flex gap-2.5 items-end flex-1 pt-2">
                <div className="flex-1 h-24 bg-[#eff4ff] rounded-lg flex items-end p-2 gap-1.5 border border-[#c5c6cd]/40">
                  <div className="flex-1 bg-[#1d4ed8]/70 h-[60%] rounded-sm group-hover:h-[75%] transition-all duration-500"></div>
                  <div className="flex-1 bg-[#1d4ed8]/70 h-[85%] rounded-sm group-hover:h-[95%] transition-all duration-500"></div>
                  <div className="flex-1 bg-[#1d4ed8]/70 h-[45%] rounded-sm group-hover:h-[60%] transition-all duration-500"></div>
                  <div className="flex-1 bg-[#1d4ed8]/70 h-[90%] rounded-sm group-hover:h-[80%] transition-all duration-500"></div>
                </div>
                <div className="w-14 h-24 bg-[#eff4ff] rounded-lg border border-[#c5c6cd]/40 flex flex-col justify-center items-center gap-1.5 p-1">
                  <div className="w-8 h-2 bg-[#1d4ed8]/30 rounded-full"></div>
                  <div className="w-6 h-2 bg-[#101c2e]/20 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
          <div className="p-8 flex-1 flex flex-col justify-between">
            <div>
              <h3 className="font-serif text-2xl font-bold text-[#0b1c30] mb-3">
                Real-time movement analysis
              </h3>
              <p className="text-base text-[#45474c] leading-relaxed">
                Joint angles, symmetry, and balance assessed frame-by-frame across the full movement.
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Injury risk scoring */}
        <div className="bg-white border border-[#c5c6cd] rounded-2xl overflow-hidden group hover:-translate-y-2 hover:shadow-xl transition-all duration-300 flex flex-col">
          <div className="h-52 bg-[#e5eeff] p-6 border-b border-[#c5c6cd] relative overflow-hidden flex items-center justify-center">
            {/* Simulated UI: Risk Circle */}
            <div className="w-full h-full bg-white rounded-xl border border-[#c5c6cd]/80 p-4 shadow-sm flex items-center justify-center relative overflow-hidden">
              <div className="relative w-28 h-28 rounded-full border-8 border-[#1d4ed8]/15 flex items-center justify-center shadow-inner">
                <div className="absolute inset-0 rounded-full border-8 border-[#1d4ed8] border-t-transparent -rotate-45 group-hover:rotate-0 transition-transform duration-700"></div>
                <div className="flex flex-col items-center">
                  <span className="font-black text-3xl text-[#0b1c30]">94</span>
                  <span className="text-[10px] font-bold uppercase text-[#11801c] tracking-wider">Health</span>
                </div>
              </div>
            </div>
          </div>
          <div className="p-8 flex-1 flex flex-col justify-between">
            <div>
              <h3 className="font-serif text-2xl font-bold text-[#0b1c30] mb-3">
                Injury risk scoring
              </h3>
              <p className="text-base text-[#45474c] leading-relaxed">
                A weighted risk formula flags biomechanical deviations and generates a precise risk category.
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Team management */}
        <div className="bg-white border border-[#c5c6cd] rounded-2xl overflow-hidden group hover:-translate-y-2 hover:shadow-xl transition-all duration-300 flex flex-col">
          <div className="h-52 bg-[#e5eeff] p-6 border-b border-[#c5c6cd] relative overflow-hidden flex items-center justify-center">
            {/* Simulated UI: Roster List */}
            <div className="w-full h-full bg-white rounded-xl border border-[#c5c6cd]/80 shadow-sm overflow-hidden flex flex-col justify-center">
              <div className="bg-[#eff4ff] px-4 py-2.5 flex items-center justify-between border-b border-[#c5c6cd]/40">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-[#ba1a1a] rounded-full animate-pulse"></div>
                  <span className="text-xs font-bold text-[#0b1c30]">Team Risk Monitor</span>
                </div>
                <div className="w-16 h-2 bg-[#1d4ed8]/20 rounded-full"></div>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-[#c5c6cd]/40 pb-2">
                  <div className="w-32 h-2.5 bg-[#101c2e]/15 rounded-full"></div>
                  <div className="w-12 h-4 bg-[#ba1a1a]/15 text-[#ba1a1a] text-[10px] font-bold rounded flex items-center justify-center">High Risk</div>
                </div>
                <div className="flex justify-between items-center border-b border-[#c5c6cd]/40 pb-2">
                  <div className="w-24 h-2.5 bg-[#101c2e]/15 rounded-full"></div>
                  <div className="w-12 h-4 bg-[#11801c]/15 text-[#11801c] text-[10px] font-bold rounded flex items-center justify-center">Optimal</div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="w-28 h-2.5 bg-[#101c2e]/15 rounded-full"></div>
                  <div className="w-12 h-4 bg-[#11801c]/15 text-[#11801c] text-[10px] font-bold rounded flex items-center justify-center">Optimal</div>
                </div>
              </div>
            </div>
          </div>
          <div className="p-8 flex-1 flex flex-col justify-between">
            <div>
              <h3 className="font-serif text-2xl font-bold text-[#0b1c30] mb-3">
                Team management
              </h3>
              <p className="text-base text-[#45474c] leading-relaxed">
                Coaches see the full team ranked by risk level, updated after every session.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
