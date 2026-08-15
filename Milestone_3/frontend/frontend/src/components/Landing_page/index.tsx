"use client";

import React from 'react';
import { Navbar } from './Navbar';
import { HeroSection } from './HeroSection';
import { HowItWorksSection } from './HowItWorksSection';
import { DiagnosticCapabilitiesSection } from './DiagnosticCapabilitiesSection';
import { BuiltForSection } from './BuiltForSection';
import { CtaSection } from './CtaSection';
import { Footer } from './Footer';

interface LandingPageProps {
  onLogin: () => void;
  onSignUp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onSignUp }) => {
  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] selection:bg-[#1d4ed8]/20 selection:text-[#1d4ed8]">
      <Navbar onLogin={onLogin} onSignUp={onSignUp} />
      <main className="pt-20 overflow-hidden">
        <HeroSection onLogin={onLogin} onSignUp={onSignUp} />
        <HowItWorksSection />
        <DiagnosticCapabilitiesSection />
        <BuiltForSection />
        <CtaSection onSignUp={onSignUp} />
      </main>
      <Footer />
    </div>
  );
};
