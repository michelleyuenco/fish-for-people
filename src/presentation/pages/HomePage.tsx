import React from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../../i18n';
import type { UserRole } from '../../domain/models/Service';

const ROLE_STORAGE_KEY = 'fish-for-people:last-role';
const GITHUB_URL = 'https://github.com/michelleyuenco/fish-for-people';

interface HomePageProps {
  onSelectRole: (role: UserRole) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onSelectRole }) => {
  const { t, i18n } = useTranslation();
  const lastRole = localStorage.getItem(ROLE_STORAGE_KEY) as UserRole | null;

  const handleSelectRole = (role: UserRole) => {
    localStorage.setItem(ROLE_STORAGE_KEY, role);
    onSelectRole(role);
  };

  const isSelected = (role: UserRole) => lastRole === role;

  return (
    <div className="h-[100dvh] bg-background flex flex-col items-center px-6 overflow-hidden">
      {/* Centering wrapper — uses padding-bottom to visually shift content upward */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm pb-12">
        {/* Logo + language */}
        <div className="flex-shrink-0 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
            <span className="text-3xl sm:text-4xl">🐟</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary">{t('common.appName')}</h1>
          <p className="text-gray-500 mt-1 text-sm">{t('common.welcomeTeam')}</p>
        </div>

        {/* Language picker */}
        <div className="flex gap-2 my-3 flex-shrink-0">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => i18n.changeLanguage(lang.code)}
              className={`px-3 py-1 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                i18n.language === lang.code
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>

        {/* Role Selection */}
        <div className="w-full">
          <p className="text-center text-gray-600 font-semibold text-sm sm:text-base mb-3">
            {lastRole ? t('home.switchRole') : t('home.whoAreYou')}
          </p>

          <div className="space-y-3">
            {/* Welcome Team button */}
            <button
              onClick={() => handleSelectRole('welcome-team')}
              className={`w-full rounded-2xl p-4 text-left transition-all active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-primary/40 ${
                isSelected('welcome-team')
                  ? 'bg-primary text-white shadow-lg ring-2 ring-accent'
                  : 'bg-primary text-white shadow-md hover:bg-primary/90'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 sm:w-14 sm:h-14 bg-white/20 rounded-xl flex items-center justify-center text-2xl sm:text-3xl flex-shrink-0">
                  🎖️
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-lg sm:text-xl flex items-center gap-2">
                    {t('common.welcomeTeam')}
                    {isSelected('welcome-team') && <span className="text-accent text-sm">✓</span>}
                  </div>
                  <div className="text-white/80 text-xs sm:text-sm mt-0.5 leading-snug">
                    {t('home.welcomeTeamDesc')}
                  </div>
                </div>
              </div>
            </button>

            {/* Congregation button */}
            <button
              onClick={() => handleSelectRole('congregation')}
              className={`w-full rounded-2xl p-4 text-left transition-all active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-primary/40 ${
                isSelected('congregation')
                  ? 'bg-white border-2 border-primary text-primary shadow-lg ring-2 ring-accent'
                  : 'bg-white border-2 border-primary text-primary shadow-sm hover:bg-primary/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 sm:w-14 sm:h-14 bg-primary/10 rounded-xl flex items-center justify-center text-2xl sm:text-3xl flex-shrink-0">
                  🙏
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-lg sm:text-xl text-primary flex items-center gap-2">
                    {t('common.imAttending')}
                    {isSelected('congregation') && <span className="text-accent text-sm">✓</span>}
                  </div>
                  <div className="text-gray-500 text-xs sm:text-sm mt-0.5 leading-snug">
                    {t('home.attendingDesc')}
                  </div>
                </div>
              </div>
            </button>
          </div>

          {/* Helper text */}
          <p className="text-xs text-gray-400 mt-3 text-center">
            {t('home.tapCard')}
          </p>
        </div>

        {/* Bible verse */}
        <div className="mt-6 text-center px-2">
          <p className="text-xs sm:text-sm text-gray-400 italic leading-relaxed">
            {t('home.bibleVerse')}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">
            {t('home.bibleRef')}
          </p>
        </div>
      </div>

      {/* Footer: GitHub link */}
      <div className="flex-shrink-0 pb-3 text-center">
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-primary transition-colors"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
          Open Source — Contribute on GitHub
        </a>
      </div>
    </div>
  );
};
