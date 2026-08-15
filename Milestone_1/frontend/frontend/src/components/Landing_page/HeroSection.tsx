"use client";

import React from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';

interface HeroSectionProps {
  onLogin: () => void;
  onSignUp: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onLogin, onSignUp }) => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-16 md:py-24 lg:py-32">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Left Text Content */}
        <div className="space-y-6 md:space-y-8">
          <div className="inline-block px-3.5 py-1.5 bg-[#1d4ed8]/10 border border-[#1d4ed8]/20 rounded-full">
            <span className="text-[#1d4ed8] font-bold text-[11px] tracking-widest uppercase">
              AI-POWERED BIOMECHANICS
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-bold text-[#0b1c30] leading-[1.15] tracking-tight">
            MoveIQ &mdash; See risk before it becomes an injury.
          </h1>

          <p className="text-base sm:text-lg text-[#45474c] max-w-xl leading-relaxed">
            MoveIQ analyzes athlete movement videos using computer vision and biomechanical scoring to identify injury risk factors before they cause harm. Built for athletes and coaches who want data, not guesswork.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <button 
              onClick={onSignUp}
              className="bg-[#1d4ed8] text-white px-8 py-4 rounded-xl font-bold text-sm md:text-base hover:bg-[#1e40af] active:scale-95 transition-all shadow-lg shadow-[#1d4ed8]/25 flex items-center gap-2 group"
            >
              Sign Up Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={onLogin}
              className="border-2 border-[#101c2e] text-[#101c2e] px-8 py-4 rounded-xl font-bold text-sm md:text-base hover:bg-[#e5eeff] transition-all"
            >
              Sign In
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 pt-6 sm:pt-8 border-t border-[#c5c6cd]/60">
            <div className="flex items-center gap-2 text-[#45474c]">
              <CheckCircle2 className="text-[#1d4ed8] w-5 h-5 shrink-0" />
              <span className="font-medium text-xs sm:text-sm">No lab equipment needed</span>
            </div>
            <div className="flex items-center gap-2 text-[#45474c]">
              <CheckCircle2 className="text-[#1d4ed8] w-5 h-5 shrink-0" />
              <span className="font-medium text-xs sm:text-sm">Results in minutes</span>
            </div>
            <div className="flex items-center gap-2 text-[#45474c]">
              <CheckCircle2 className="text-[#1d4ed8] w-5 h-5 shrink-0" />
              <span className="font-medium text-xs sm:text-sm">Built for real sports</span>
            </div>
          </div>
        </div>

        {/* Right Hero Image */}
        <div className="relative group">
          <div className="absolute -inset-4 bg-gradient-to-tr from-[#1d4ed8]/10 to-[#4069f2]/10 rounded-3xl blur-2xl group-hover:from-[#1d4ed8]/20 group-hover:to-[#4069f2]/20 transition-all duration-500"></div>
          <div className="relative border border-[#c5c6cd]/80 rounded-2xl overflow-hidden bg-white shadow-xl p-3 sm:p-4">
            <img 
              alt="Athlete movement analysis visualization" 
              className="w-full h-auto max-h-[560px] object-cover rounded-xl shadow-inner transform group-hover:scale-[1.01] transition-transform duration-700" 
              src="/hero-biomechanics.jpg" 
            />
          </div>
        </div>
      </div>
    </section>
  );
};
