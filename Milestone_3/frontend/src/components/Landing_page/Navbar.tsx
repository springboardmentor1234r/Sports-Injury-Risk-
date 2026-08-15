"use client";

import React from 'react';

interface NavbarProps {
  onLogin: () => void;
  onSignUp: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onLogin, onSignUp }) => {
  return (
    <nav className="fixed top-0 w-full z-50 bg-[#f8f9ff]/80 backdrop-blur-md border-b border-[#c5c6cd] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-4 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img 
            alt="MoveIQ Logo" 
            className="w-auto object-contain h-10 md:h-12 drop-shadow-xs" 
            src="/logo.png" 
          />
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          <a 
            className="text-xs font-bold uppercase tracking-wider text-[#1d4ed8] border-b-2 border-[#1d4ed8] py-1 cursor-pointer" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            Platform
          </a>
          <a 
            className="text-xs font-bold uppercase tracking-wider text-[#45474c] hover:text-[#1d4ed8] transition-colors duration-200 cursor-pointer" 
            href="#how-it-works"
          >
            How It Works
          </a>
          <a 
            className="text-xs font-bold uppercase tracking-wider text-[#45474c] hover:text-[#1d4ed8] transition-colors duration-200 cursor-pointer" 
            href="#built-for"
          >
            Roles
          </a>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button 
            onClick={onLogin}
            className="px-4 py-2 text-xs md:text-sm font-bold text-[#101c2e] hover:text-[#1d4ed8] transition-colors"
          >
            Sign In
          </button>
          <button 
            onClick={onSignUp}
            className="bg-[#1d4ed8] text-white px-5 py-2.5 rounded-lg text-xs md:text-sm font-bold hover:bg-[#1e40af] active:scale-95 transition-all shadow-md shadow-[#1d4ed8]/20"
          >
            Sign Up Free
          </button>
        </div>
      </div>
    </nav>
  );
};
