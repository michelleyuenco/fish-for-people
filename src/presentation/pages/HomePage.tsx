import React from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../../i18n';
import type { UserRole } from '../../domain/models/Service';

const ROLE_STORAGE_KEY = 'fish-for-people:last-role';

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

  const roleLabel = (role: UserRole) =>
    role === 'welcome-team'
      ? `🎖️ ${t('common.welcomeTeam')}`
      : `🙏 ${t('common.attending')}`;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      {/* Logo / Header */}
      <div className="mb-10 text-center">
        <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <span className="text-5xl">🐟</span>
        </div>
        <h1 className="text-3xl font-bold text-primary">{t('common.appName')}</h1>
        <p className="text-gray-500 mt-2 text-base">{t('common.welcomeTeam')}</p>
      </div>

      {/* Language picker */}
      <div className="flex gap-2 mb-6">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => i18n.changeLanguage(lang.code)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
              i18n.language === lang.code
                ? 'bg-primary text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {lang.label}
          </button>
        ))}
      </div>

      {/* Quick continue if last role known */}
      {lastRole && (
        <div className="w-full max-w-sm mb-2">
          <button
            onClick={() => handleSelectRole(lastRole)}
            className="w-full bg-accent/10 border border-accent/40 text-accent rounded-2xl p-4 text-center font-semibold transition-all hover:bg-accent/20 focus:outline-none focus:ring-4 focus:ring-accent/30"
          >
            {t('home.continueAs', { role: roleLabel(lastRole) })}
          </button>
          <p className="text-center text-xs text-gray-400 mt-1">{t('home.lastSession')}</p>
        </div>
      )}

      {/* Role Selection */}
      <div className="w-full max-w-sm space-y-4">
        <p className="text-center text-gray-600 font-semibold text-base mb-4">
          {lastRole ? t('home.switchRole') : t('home.whoAreYou')}
        </p>

        {/* Welcome Team button */}
        <button
          onClick={() => handleSelectRole('welcome-team')}
          className="w-full bg-primary text-white rounded-2xl p-5 text-left shadow-md active:scale-98 transition-all hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-primary/40"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
              🎖️
            </div>
            <div>
              <div className="font-bold text-xl">{t('common.welcomeTeam')}</div>
              <div className="text-white/80 text-sm mt-1 leading-snug">
                {t('home.welcomeTeamDesc')}
              </div>
            </div>
          </div>
        </button>

        {/* Congregation button */}
        <button
          onClick={() => handleSelectRole('congregation')}
          className="w-full bg-white border-2 border-primary text-primary rounded-2xl p-5 text-left shadow-sm active:scale-98 transition-all hover:bg-primary/5 focus:outline-none focus:ring-4 focus:ring-primary/40"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
              🙏
            </div>
            <div>
              <div className="font-bold text-xl text-primary">{t('common.imAttending')}</div>
              <div className="text-gray-500 text-sm mt-1 leading-snug">
                {t('home.attendingDesc')}
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Helper text */}
      <p className="text-sm text-gray-400 mt-10 text-center">
        {t('home.tapCard')}
      </p>
    </div>
  );
};
