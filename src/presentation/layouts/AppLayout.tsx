import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { type TabName } from '../components/NavBar';
import { LANGUAGES } from '../../i18n';
import type { UserRole } from '../../domain/models/Service';

const LARGE_TEXT_KEY = 'fish-for-people:large-text';
const HANDEDNESS_KEY = 'fish-for-people:handedness';

interface AppLayoutProps {
  children: React.ReactNode;
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
  pendingRequestCount: number;
  role: UserRole;
  title: string;
  onChangeRole?: () => void;
  onOpenFloorPlan?: () => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  activeTab,
  onTabChange,
  pendingRequestCount,
  role,
  title,
  onChangeRole,
  onOpenFloorPlan,
}) => {
  const { t, i18n } = useTranslation();
  const [largeText, setLargeText] = useState(() => {
    return localStorage.getItem(LARGE_TEXT_KEY) === 'true';
  });
  const [leftHanded, setLeftHanded] = useState(() => {
    return localStorage.getItem(HANDEDNESS_KEY) === 'left';
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    localStorage.setItem(HANDEDNESS_KEY, leftHanded ? 'left' : 'right');
    window.dispatchEvent(new Event('handedness-change'));
  }, [leftHanded]);

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

  // Update browser tab title
  useEffect(() => {
    document.title = title ? `${title} | Fish for People` : 'Fish for People';
  }, [title]);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleClick);
    return () => document.removeEventListener('pointerdown', handleClick);
  }, [menuOpen]);

  const roleLabel = role === 'welcome-team'
    ? `🙌 ${t('common.welcomeTeam')}`
    : `🙏 ${t('common.attending')}`;

  const tabs: { id: TabName; label: string; icon: string }[] = [
    { id: 'seats', label: t('nav.seats'), icon: '🪑' },
    { id: 'requests', label: t('nav.requests'), icon: '🙋' },
    { id: 'headcount', label: t('nav.count'), icon: '🔢' },
  ];

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Skip to main content (visible on keyboard focus only) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded-xl focus:font-semibold focus:text-sm"
      >
        {t('common.skipToMain')}
      </a>

      {/* Top App Bar */}
      <header className="bg-primary text-white px-4 pt-safe sticky top-0 z-40 shadow-md">
        <div className="flex items-center justify-between h-14">
          {/* Logo + page title (mobile) / app name (desktop) */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => onChangeRole?.()}
              className="flex items-center gap-2 hover:opacity-80 active:opacity-60 transition-opacity flex-shrink-0"
              aria-label={t('common.appName')}
            >
              <span className="text-2xl">🐟</span>
              <span className="hidden md:inline text-lg font-bold tracking-tight">{t('common.appName')}</span>
            </button>
            <span className="md:hidden text-sm text-white/80 font-medium truncate">{title}</span>
          </div>

          {/* Desktop inline nav tabs (welcome team only, md+) */}
          {role === 'welcome-team' && (
            <nav className="hidden md:flex items-center gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.id === 'requests' && pendingRequestCount > 0 && (
                    <span className="bg-danger text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {pendingRequestCount}
                    </span>
                  )}
                </button>
              ))}
              {onOpenFloorPlan && (
                <button
                  onClick={onOpenFloorPlan}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all"
                >
                  <span>🗺️</span>
                  <span>{t('common.floorPlan')}</span>
                </button>
              )}
            </nav>
          )}

          <div className="flex items-center gap-2">
            {/* Mobile pending request badge (below md, welcome team only) */}
            {role === 'welcome-team' && pendingRequestCount > 0 && (
              <button
                onClick={() => { onTabChange('requests'); }}
                className="md:hidden flex items-center gap-1.5 bg-danger/90 hover:bg-danger active:bg-danger/80 text-white px-3 py-1.5 rounded-full transition-all animate-pulse"
                aria-label={t('nav.pending', { count: pendingRequestCount })}
              >
                <span className="text-sm">🙋</span>
                <span className="text-sm font-bold">{pendingRequestCount}</span>
              </button>
            )}

            {/* Desktop language buttons (md+) */}
            <div className="hidden md:flex items-center gap-1">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => i18n.changeLanguage(lang.code)}
                  className={`px-2 py-1 rounded-md text-xs font-semibold transition-all ${
                    i18n.language === lang.code
                      ? 'bg-white/25 text-white'
                      : 'text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            {/* Desktop text size toggle (md+) */}
            <button
              onClick={() => setLargeText((v) => !v)}
              className="hidden md:flex items-center gap-0.5 px-2 py-1 rounded-md text-white/60 hover:bg-white/10 hover:text-white transition-all"
              title={t('common.textSize')}
            >
              <span className="text-[10px] font-bold leading-none">A</span>
              <span className="text-sm font-bold leading-none">A</span>
            </button>

            {/* Desktop role switcher (md+) */}
            <button
              onClick={() => onChangeRole?.()}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-sm"
            >
              <span>🔄</span>
              <span className="text-white/80 text-xs">{role === 'welcome-team' ? t('common.welcomeTeam') : t('common.attending')}</span>
            </button>

            {/* Mobile hamburger menu (below md) */}
            <div className="relative md:hidden" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="bg-white/15 hover:bg-white/25 active:bg-white/35 w-10 h-10 rounded-full transition-all flex items-center justify-center"
                aria-label={t('common.menu')}
                aria-expanded={menuOpen}
              >
                {menuOpen ? (
                  <span className="text-lg font-bold">✕</span>
                ) : (
                  <span className="text-xl">☰</span>
                )}
              </button>

              {/* Dropdown menu (mobile only) */}
              {menuOpen && (
                <div className="absolute right-0 top-12 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Role */}
                  <button
                    onClick={() => { onChangeRole?.(); setMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-all border-b border-gray-100"
                  >
                    <span className="text-lg w-7 text-center">🔄</span>
                    <div className="text-left flex-1">
                      <div className="text-sm font-semibold text-gray-800">{roleLabel}</div>
                      <div className="text-[10px] text-gray-400">{t('common.switchRole')}</div>
                    </div>
                    <span className="text-gray-300 text-xs">▸</span>
                  </button>

                  {/* Navigation items (welcome team only) */}
                  {role === 'welcome-team' && (
                    <div className="border-b border-gray-100">
                      {tabs.map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => { onTabChange(tab.id); setMenuOpen(false); }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 active:bg-gray-100 transition-all ${
                            activeTab === tab.id ? 'bg-primary/5' : ''
                          }`}
                        >
                          <span className="text-lg w-7 text-center">{tab.icon}</span>
                          <span className={`text-sm flex-1 text-left ${activeTab === tab.id ? 'font-bold text-primary' : 'text-gray-700'}`}>
                            {tab.label}
                          </span>
                          {tab.id === 'requests' && pendingRequestCount > 0 && (
                            <span className="bg-danger text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                              {pendingRequestCount}
                            </span>
                          )}
                          {activeTab === tab.id && (
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          )}
                        </button>
                      ))}
                      {onOpenFloorPlan && (
                        <button
                          onClick={() => { onOpenFloorPlan(); setMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 active:bg-gray-100 transition-all"
                        >
                          <span className="text-lg w-7 text-center">🗺️</span>
                          <span className="text-sm text-gray-700">{t('common.floorPlan')}</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Language selector */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('common.language')}</div>
                    <div className="flex gap-1.5">
                      {LANGUAGES.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => i18n.changeLanguage(lang.code)}
                          className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                            i18n.language === lang.code
                              ? 'bg-primary text-white shadow-sm'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Text size toggle */}
                  <button
                    onClick={() => setLargeText((v) => !v)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-all border-b border-gray-100"
                  >
                    <span className="w-7 flex items-center justify-center gap-0.5">
                      <span className="text-xs font-bold text-gray-600 leading-none">A</span>
                      <span className="text-base font-bold text-gray-600 leading-none">A</span>
                    </span>
                    <span className="text-sm text-gray-700 flex-1 text-left">
                      {t('common.textSize')}
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      largeText ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {largeText ? t('common.largeText') : t('common.normalText')}
                    </span>
                  </button>

                  {/* Handedness toggle */}
                  <button
                    onClick={() => setLeftHanded((v) => !v)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-all"
                  >
                    <span className="text-lg w-7 text-center">🙌</span>
                    <span className="text-sm text-gray-700 flex-1 text-left">
                      {t('common.handedness')}
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      leftHanded ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {leftHanded ? t('common.leftHanded') : t('common.rightHanded')}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Page title bar — desktop only */}
        <div className="hidden md:block pb-3">
          <h1 className="text-sm text-white/70">{title}</h1>
        </div>
      </header>

      {/* Offline indicator */}
      {!isOnline && (
        <div className="bg-danger text-white text-xs font-semibold text-center py-2 flex items-center justify-center gap-2">
          <span>📵</span>
          <span>{t('common.noInternet')}</span>
        </div>
      )}

      {/* Main content */}
      <main id="main-content" className="flex-1 overflow-y-auto" tabIndex={-1}>
        <div className="max-w-lg md:max-w-3xl lg:max-w-5xl mx-auto px-4 py-4 pb-20 space-y-4">
          {children}
        </div>
      </main>

    </div>
  );
};
