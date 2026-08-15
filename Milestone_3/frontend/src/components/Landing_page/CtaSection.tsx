"use client";

import React from 'react';
import { ArrowRight } from 'lucide-react';

interface CtaSectionProps {
  onSignUp: () => void;
}

export const CtaSection: React.FC<CtaSectionProps> = ({ onSignUp }) => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-20 lg:py-32">
      <div className="bg-[#101c2e] text-white p-10 sm:p-14 md:p-20 text-center relative overflow-hidden rounded-3xl shadow-2xl">
        {/* Abstract BG pattern */}
        <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#4069f2] rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#1d4ed8] rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>
        </div>

        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            Start managing risk today.
          </h2>
          <p className="text-lg sm:text-xl text-[#bbc7df] mb-10 font-light">
            Free to try. No lab equipment. No complicated setup.
          </p>

          <button 
            onClick={onSignUp}
            className="bg-[#1d4ed8] text-white px-10 py-5 rounded-xl font-bold text-base sm:text-lg hover:bg-[#2563eb] active:scale-95 transition-all mb-8 shadow-xl shadow-[#1d4ed8]/30 inline-flex items-center gap-2 group"
          >
            Get Started Now
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <p className="text-xs text-[#bbc7df] max-w-xl mx-auto opacity-70 leading-relaxed">
            MoveIQ is an AI-assisted movement screening tool, not a medical diagnosis. Consult a physiotherapist or doctor for professional evaluation.
          </p>
        </div>
      </div>
    </section>
  );
};
