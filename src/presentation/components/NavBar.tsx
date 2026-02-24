import React from 'react';
import { Badge } from './Badge';

export type TabName = 'seats' | 'requests' | 'headcount';

interface NavBarProps {
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
  pendingRequestCount: number;
  role: 'welcome-team' | 'congregation';
}

const tabs: { id: TabName; label: string; icon: string }[] = [
  { id: 'seats', label: 'Seats', icon: '🪑' },
  { id: 'requests', label: 'Requests', icon: '🙋' },
  { id: 'headcount', label: 'Headcount', icon: '🔢' },
];

export const NavBar: React.FC<NavBarProps> = ({
  activeTab,
  onTabChange,
  pendingRequestCount,
  role,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-inset-bottom">
      <div className="flex">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          // Hide seat tracker for congregation
          if (tab.id === 'seats' && role === 'congregation') {
            return null;
          }
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`nav-tab relative ${isActive ? 'active' : 'inactive'}`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.id === 'requests' && (
                <Badge count={pendingRequestCount} />
              )}
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-b-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
