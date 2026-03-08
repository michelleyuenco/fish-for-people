import React from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from './Badge';

export type TabName = 'seats' | 'requests' | 'headcount';
export type HeadcountStatus = 'idle' | 'one-submitted' | 'ready' | 'discrepancy';

interface NavBarProps {
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
  pendingRequestCount: number;
  role: 'welcome-team' | 'congregation';
  headcountStatus?: HeadcountStatus;
}

const headcountDot: Record<HeadcountStatus, { color: string; show: boolean }> = {
  idle: { color: '', show: false },
  'one-submitted': { color: 'bg-warning', show: true },
  ready: { color: 'bg-success', show: true },
  discrepancy: { color: 'bg-danger', show: true },
};

export const NavBar: React.FC<NavBarProps> = ({
  activeTab,
  onTabChange,
  pendingRequestCount,
  role,
  headcountStatus = 'idle',
}) => {
  const { t } = useTranslation();

  const tabs: { id: TabName; label: string; sublabel: string; icon: string }[] = [
    { id: 'seats', label: t('nav.seats'), sublabel: t('nav.floorPlan'), icon: '🪑' },
    { id: 'requests', label: t('nav.requests'), sublabel: t('nav.getHelp'), icon: '🙋' },
    { id: 'headcount', label: t('nav.count'), sublabel: t('nav.attendance'), icon: '🔢' },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-inset-bottom"
      aria-label={t('nav.mainNav')}
    >
      <div className="flex" role="tablist" aria-label="App sections">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          if ((tab.id === 'seats' || tab.id === 'headcount') && role === 'congregation') {
            return null;
          }
          const badgeCount = tab.id === 'requests' ? pendingRequestCount : 0;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              aria-label={`${tab.label}${badgeCount > 0 ? `, ${t('nav.pending', { count: badgeCount })}` : ''}`}
              className={`nav-tab relative ${isActive ? 'active' : 'inactive'}`}
            >
              <span className="relative inline-block">
                <span className="text-xl" aria-hidden="true">{tab.icon}</span>
                {tab.id === 'requests' && (
                  <Badge count={pendingRequestCount} className="-top-2 -right-3" />
                )}
              </span>
              <span className="text-xs font-semibold">{tab.label}</span>
              <span className="text-[9px] text-current opacity-60 -mt-1">{tab.sublabel}</span>
              {tab.id === 'headcount' && headcountDot[headcountStatus].show && (
                <span
                  className={`absolute top-1 right-3 w-2.5 h-2.5 rounded-full ${headcountDot[headcountStatus].color}`}
                  role="status"
                />
              )}
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-b-full" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
