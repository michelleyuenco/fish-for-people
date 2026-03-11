import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../../i18n';
import type { UserRole } from '../../domain/models/Service';

const ROLE_STORAGE_KEY = 'fish-for-people:last-role';
const GITHUB_URL = 'https://github.com/michelleyuenco/fish-for-people';

const ICHTHYS_LETTERS: { greek: string; greekWord: string; translitKey: string; meaningKey: string }[] = [
  { greek: 'Ι', greekWord: 'Ἰησοῦς', translitKey: 'home.ichthysI', meaningKey: 'home.ichthysIMeaning' },
  { greek: 'Χ', greekWord: 'Χριστός', translitKey: 'home.ichthysCh', meaningKey: 'home.ichthysChMeaning' },
  { greek: 'Θ', greekWord: 'Θεοῦ', translitKey: 'home.ichthysTh', meaningKey: 'home.ichthysThMeaning' },
  { greek: 'Υ', greekWord: 'Υἱός', translitKey: 'home.ichthysU', meaningKey: 'home.ichthysUMeaning' },
  { greek: 'Σ', greekWord: 'Σωτήρ', translitKey: 'home.ichthysS', meaningKey: 'home.ichthysSMeaning' },
];

interface HomePageProps {
  onSelectRole: (role: UserRole) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onSelectRole }) => {
  const { t, i18n } = useTranslation();
  const lastRole = localStorage.getItem(ROLE_STORAGE_KEY) as UserRole | null;
  const [showIchthys, setShowIchthys] = useState(false);

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

        {/* Bible verse + Why the fish */}
        <div className="mt-6 text-center px-2">
          <p className="text-xs sm:text-sm text-gray-400 italic leading-relaxed">
            {t('home.bibleVerse')}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">
            {t('home.bibleRef')}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 pb-3 text-center flex flex-col items-center gap-1.5">
        <button
          onClick={() => setShowIchthys(true)}
          className="flex items-center gap-1 text-xs text-primary/60 hover:text-primary transition-colors"
        >
          <span>🐟</span>
          <span className="underline underline-offset-2">{t('home.whyTheFish')}</span>
        </button>
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

      {/* Ichthys modal */}
      {showIchthys && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200"
          onClick={() => setShowIchthys(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[85dvh] overflow-y-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with fish icon */}
            <div className="bg-primary rounded-t-3xl px-6 pt-6 pb-5 text-center relative">
              <button
                onClick={() => setShowIchthys(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 active:bg-white/40 flex items-center justify-center text-white transition-all"
                aria-label={t('common.close')}
              >
                <span className="text-lg leading-none">✕</span>
              </button>
              {/* Ichthys fish SVG */}
              <div className="w-16 h-16 mx-auto mb-3 bg-white/15 rounded-full flex items-center justify-center">
                <svg viewBox="0 0 80 48" className="w-11 h-11" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 24 C28 8, 52 8, 60 24 C52 40, 28 40, 12 24 Z" />
                  <circle cx="50" cy="21" r="2.5" fill="white" stroke="none" />
                  <path d="M60 24 L72 14 L72 34 Z" fill="none" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">{t('home.ichthysTitle')}</h2>
              <p className="text-white/70 text-sm mt-1">{t('home.ichthysSubtitle')}</p>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Intro */}
              <p className="text-sm text-gray-600 leading-relaxed">
                {t('home.ichthysIntro')}
              </p>

              {/* Acrostic table */}
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="py-2 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider w-10"></th>
                    <th className="py-2 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{t('home.ichthysColGreek')}</th>
                    <th className="py-2 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{t('home.ichthysColTranslit')}</th>
                    <th className="py-2 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{t('home.ichthysColMeaning')}</th>
                  </tr>
                </thead>
                <tbody>
                  {ICHTHYS_LETTERS.map((letter, i) => (
                    <tr key={letter.greek} className={i < ICHTHYS_LETTERS.length - 1 ? 'border-b border-gray-100' : ''}>
                      <td className="py-2.5 text-2xl font-bold text-primary text-center">{letter.greek}</td>
                      <td className="py-2.5 text-sm text-gray-500 italic">{letter.greekWord}</td>
                      <td className="py-2.5 text-xs text-gray-400">{t(letter.translitKey)}</td>
                      <td className="py-2.5 text-sm font-semibold text-gray-700 text-right">{t(letter.meaningKey)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
