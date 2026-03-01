import React, { useState, useEffect } from 'react';
import { NavBar, type TabName, type HeadcountStatus } from '../components/NavBar';
import type { UserRole } from '../../domain/models/Service';

const LARGE_TEXT_KEY = 'fish-for-people:large-text';

interface AppLayoutProps {
  children: React.ReactNode;
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
  pendingRequestCount: number;
  role: UserRole;
  title: string;
  onChangeRole?: () => void;
  headcountStatus?: HeadcountStatus;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  activeTab,
  onTabChange,
  pendingRequestCount,
  role,
  title,
  onChangeRole,
  headcountStatus,
}) => {
  const [largeText, setLargeText] = useState(() => {
    return localStorage.getItem(LARGE_TEXT_KEY) === 'true';
  });

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    if (largeText) {
      document.documentElement.classList.add('large-text');
    } else {
      document.documentElement.classList.remove('large-text');
    }
    localStorage.setItem(LARGE_TEXT_KEY, String(largeText));
  }, [largeText]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Skip to main content (visible on keyboard focus only) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded-xl focus:font-semibold focus:text-sm"
      >
        Skip to main content
      </a>

      {/* Top App Bar */}
      <header className="bg-primary text-white px-4 pt-safe sticky top-0 z-40 shadow-md">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <span className="text-xl">🐟</span>
            <span className="font-bold text-base">Fish for People</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Text size toggle */}
            <button
              onClick={() => setLargeText((v) => !v)}
              className="text-xs bg-white/15 hover:bg-white/25 active:bg-white/35 px-2 py-1.5 rounded-full transition-all font-bold"
              aria-label={largeText ? 'Switch to normal text size' : 'Switch to large text size'}
              title={largeText ? 'Normal text' : 'Large text'}
            >
              {largeText ? 'A−' : 'A+'}
            </button>
            {/* Tappable role badge — tap to switch role */}
            <button
              onClick={onChangeRole}
              className="text-xs bg-white/20 hover:bg-white/30 active:bg-white/40 px-3 py-1.5 rounded-full transition-all flex items-center gap-1 font-medium"
              aria-label="Switch role"
              title="Tap to switch role"
            >
              <span>{role === 'welcome-team' ? '🎖️ Welcome Team' : '🙏 Attending'}</span>
              <span className="text-white/60 text-[10px]">▾</span>
            </button>
          </div>
        </div>
        {/* Page title bar */}
        <div className="pb-3">
          <h1 className="text-sm text-white/70">{title}</h1>
        </div>
      </header>

      {/* Offline indicator */}
      {!isOnline && (
        <div className="bg-danger text-white text-xs font-semibold text-center py-2 flex items-center justify-center gap-2">
          <span>📵</span>
          <span>No internet connection — changes may not sync</span>
        </div>
      )}

      {/* Main content */}
      <main id="main-content" className="flex-1 overflow-y-auto pb-24" tabIndex={-1}>
        <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
          {children}
        </div>
      </main>

      {/* Bottom Nav */}
      <NavBar
        activeTab={activeTab}
        onTabChange={onTabChange}
        pendingRequestCount={pendingRequestCount}
        role={role}
        headcountStatus={headcountStatus}
      />
    </div>
  );
};
