import React from 'react';
import { Search, Upload, HelpCircle, Menu } from 'lucide-react';
import { NotificationBell } from '../NotificationBell';

import { ChatWidget } from '../ChatWidget';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  setActiveTab: (tab: string) => void;
  onOpenMobileMenu?: () => void;
  onOpenSettings?: () => void;
  onOpenSupport?: () => void;
  coachName?: string;
  coachTitle?: string;
  avatarUrl?: string;
  token?: string;
  userId?: number | string;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  setActiveTab,
  onOpenMobileMenu,
  onOpenSettings,
  onOpenSupport,
  coachName = "Coach",
  coachTitle = "MoveIQ Coach",
  avatarUrl,
  token,
  userId
}) => {
  return (
    <header className="sticky top-0 right-0 w-full z-30 flex justify-between items-center px-6 py-4 bg-[#f7f9fd]/90 backdrop-blur-md border-b border-[#c3c6d8]">
      <div className="flex items-center gap-4 flex-1">
        {/* Mobile menu button */}
        <button 
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-lg text-[#424656] hover:bg-[#e0e2e6] transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Title */}
        <span className="text-xl font-extrabold text-[#191c1f] hidden sm:inline-block">
          MoveIQ Coach
        </span>

        {/* Global Search Bar */}
        <div className="relative w-full max-w-xs md:max-w-md focus-within:ring-2 focus-within:ring-[#004ccd]/20 rounded-full transition-all duration-200 ml-0 sm:ml-4">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-[#737687]" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search athletes, teams, reports..."
            className="block w-full pl-10 pr-4 py-2 border border-[#c3c6d8] rounded-full text-sm bg-white placeholder-[#737687] focus:outline-none focus:border-[#004ccd] focus:ring-1 focus:ring-[#004ccd] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs text-[#737687] hover:text-[#191c1f]"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Trailing Actions & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {token && (
          <>
            <ChatWidget token={token} role="coach" userId={userId} />
            <NotificationBell token={token} />
          </>
        )}
        
        <button
          onClick={() => setActiveTab('upload_video')}
          title="Upload Video"
          className="p-2 rounded-full text-[#424656] hover:text-[#004ccd] hover:bg-[#f2f4f8] transition-colors"
        >
          <Upload className="w-5 h-5" />
        </button>

        <button
          onClick={onOpenSupport}
          title="Support & Help"
          className="p-2 rounded-full text-[#424656] hover:text-[#004ccd] hover:bg-[#f2f4f8] transition-colors"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        <div className="h-6 w-px bg-[#c3c6d8] mx-1 hidden sm:block"></div>

        {/* Coach Profile */}
        <div 
          onClick={onOpenSettings}
          className="flex items-center gap-3 cursor-pointer group pl-1"
        >
          <div className="text-right hidden md:block">
            <p className="text-xs font-bold text-[#191c1f] group-hover:text-[#004ccd] transition-colors leading-tight">
              {coachName}
            </p>
            <p className="text-[11px] text-[#424656] leading-tight">
              {coachTitle}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full overflow-hidden border border-[#c3c6d8] group-hover:border-[#004ccd] transition-colors shrink-0 flex items-center justify-center bg-[#004ccd] text-white font-bold text-sm">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={coachName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              coachName.charAt(0).toUpperCase()
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
