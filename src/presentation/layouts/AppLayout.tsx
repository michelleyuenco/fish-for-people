import React from 'react';
import { NavBar, type TabName } from '../components/NavBar';
import type { UserRole } from '../../domain/models/Service';

interface AppLayoutProps {
  children: React.ReactNode;
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
  pendingRequestCount: number;
  role: UserRole;
  title: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  activeTab,
  onTabChange,
  pendingRequestCount,
  role,
  title,
}) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top App Bar */}
      <header className="bg-primary text-white px-4 pt-safe sticky top-0 z-40 shadow-md">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <span className="text-xl">🐟</span>
            <span className="font-bold text-base">Fish for People</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
              {role === 'welcome-team' ? '🎖️ Welcome Team' : '🙏 Congregation'}
            </span>
          </div>
        </div>
        {/* Page title bar */}
        <div className="pb-3">
          <h1 className="text-sm text-white/70">{title}</h1>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-24">
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
      />
    </div>
  );
};
