import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-[#c5c6cd]/60 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col items-center md:items-start gap-2">
          <img 
            alt="MoveIQ Logo" 
            className="w-auto object-contain h-8 opacity-90" 
            src="/logo.png" 
          />
          <p className="text-xs font-medium text-[#45474c]">
            &copy; {new Date().getFullYear()} MoveIQ Injury Risk Management. All rights reserved.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-8">
          <a className="text-xs font-semibold text-[#45474c] hover:text-[#1d4ed8] transition-colors" href="#">
            Privacy Policy
          </a>
          <a className="text-xs font-semibold text-[#45474c] hover:text-[#1d4ed8] transition-colors" href="#">
            Terms of Service
          </a>
          <a className="text-xs font-semibold text-[#45474c] hover:text-[#1d4ed8] transition-colors" href="#">
            Contact Support
          </a>
        </div>
      </div>
    </footer>
  );
};
