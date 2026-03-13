import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { LANGUAGES } from '../../i18n';
import type { UserRole } from '../../domain/models/Service';
import type { LanguageCode } from '../../i18n';
import { STORAGE_KEYS } from '../../domain/constants/storageKeys';

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
  const lastRole = localStorage.getItem(STORAGE_KEYS.ROLE) as UserRole | null;
  const [showIchthys, setShowIchthys] = useState(false);
  const [hoveredRole, setHoveredRole] = useState<UserRole | null>(null);

  // Track language button positions for sliding indicator
  const langContainerRef = useRef<HTMLDivElement>(null);
  const langButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number } | null>(null);

  const updateIndicator = useCallback(() => {
    const container = langContainerRef.current;
    const activeBtn = langButtonRefs.current.get(i18n.language);
    if (container && activeBtn) {
      const containerRect = container.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();
      setIndicatorStyle({
        left: btnRect.left - containerRect.left,
        width: btnRect.width,
      });
    }
  }, [i18n.language]);

  useEffect(() => {
    document.title = 'Fish for People';
  }, []);

  useEffect(() => {
    // Update indicator position on language change and initial mount
    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [updateIndicator]);

  const handleSelectRole = (role: UserRole) => {
    localStorage.setItem(STORAGE_KEYS.ROLE, role);
    onSelectRole(role);
  };

  const handleLanguageChange = (code: LanguageCode) => {
    i18n.changeLanguage(code);
  };

  const isSelected = (role: UserRole) => lastRole === role;

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center px-5">
      {/* Top section — logo + language (fixed height, doesn't grow) */}
      <div className="flex-shrink-0 pt-[max(env(safe-area-inset-top,0px),1.5rem)] pb-2 text-center w-full max-w-sm">
        <motion.button
          onClick={() => setShowIchthys(true)}
          className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg"
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.05 }}
        >
          <span className="text-3xl">🐟</span>
        </motion.button>
        <h1 className="text-2xl font-bold text-primary">{t('common.appName')}</h1>

        {/* Language picker — pill with sliding indicator */}
        <div className="flex justify-center mt-2.5">
          <div
            ref={langContainerRef}
            className="relative inline-flex bg-gray-100 rounded-full p-0.5"
          >
            {/* Animated sliding indicator */}
            {indicatorStyle && (
              <motion.div
                className="absolute top-0.5 bottom-0.5 bg-primary rounded-full shadow-sm"
                animate={{ left: indicatorStyle.left, width: indicatorStyle.width }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            {LANGUAGES.map((lang) => {
              const isActive = i18n.language === lang.code;
              return (
                <button
                  key={lang.code}
                  ref={(el) => { if (el) langButtonRefs.current.set(lang.code, el); }}
                  onClick={() => handleLanguageChange(lang.code as LanguageCode)}
                  className={`relative z-10 px-4 py-1 rounded-full text-xs font-semibold transition-colors duration-200 ${
                    isActive ? 'text-white' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {lang.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Middle section — role selection (centered in remaining space) */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm py-4 min-h-0">
        {/* Fixed-height prompt area prevents layout shift when text changes */}
        <div className="h-8 flex items-center justify-center mb-4">
          <AnimatePresence mode="wait">
            <motion.p
              key={i18n.language + '-prompt'}
              className="text-center text-gray-500 font-medium text-sm"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
            >
              {t('home.rolePrompt')}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Role cards — fixed height, description uses absolute overlay */}
        <div className="grid grid-cols-2 gap-3 w-full">
          {/* Welcome Team button */}
          <div className="relative">
            <motion.button
              onClick={() => handleSelectRole('welcome-team')}
              onMouseEnter={() => setHoveredRole('welcome-team')}
              onMouseLeave={() => setHoveredRole(null)}
              whileTap={{ scale: 0.96 }}
              whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(27, 43, 94, 0.25)' }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              style={{ boxShadow: '0 4px 12px rgba(27, 43, 94, 0.2), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -2px 4px rgba(0,0,0,0.1)' }}
              className={`w-full rounded-2xl p-4 text-center focus:outline-none focus:ring-4 focus:ring-primary/40 ${
                isSelected('welcome-team')
                  ? 'bg-primary text-white ring-2 ring-accent'
                  : 'bg-primary text-white hover:bg-primary/90'
              }`}
            >
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl mx-auto mb-2">
                🙌
              </div>
              <div className="font-bold text-base leading-tight min-h-[2.5rem] flex items-center justify-center">
                <span>{t('common.welcomeTeam')}</span>
                {isSelected('welcome-team') && <span className="text-accent text-sm ml-1">✓</span>}
              </div>
            </motion.button>
            {/* Description tooltip — absolutely positioned, doesn't affect layout */}
            <AnimatePresence>
              {hoveredRole === 'welcome-team' && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 right-0 top-full mt-1.5 z-10 bg-primary/95 backdrop-blur-sm text-white/85 text-[11px] leading-snug italic rounded-xl px-3 py-2 shadow-lg pointer-events-none"
                >
                  {t('home.welcomeTeamDesc')}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Congregation button */}
          <div className="relative">
            <motion.button
              onClick={() => handleSelectRole('congregation')}
              onMouseEnter={() => setHoveredRole('congregation')}
              onMouseLeave={() => setHoveredRole(null)}
              whileTap={{ scale: 0.96 }}
              whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(27, 43, 94, 0.15)' }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              style={{ boxShadow: '0 4px 12px rgba(27, 43, 94, 0.08), inset 0 1px 0 rgba(255,255,255,0.8), inset 0 -2px 4px rgba(27, 43, 94, 0.04)' }}
              className={`w-full rounded-2xl p-4 text-center focus:outline-none focus:ring-4 focus:ring-primary/40 ${
                isSelected('congregation')
                  ? 'bg-white border-2 border-primary text-primary ring-2 ring-accent'
                  : 'bg-white border-2 border-primary text-primary hover:bg-primary/5'
              }`}
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-2xl mx-auto mb-2">
                🙏
              </div>
              <div className="font-bold text-base text-primary leading-tight min-h-[2.5rem] flex items-center justify-center">
                <span>{t('common.imAttending')}</span>
                {isSelected('congregation') && <span className="text-accent text-sm ml-1">✓</span>}
              </div>
            </motion.button>
            {/* Description tooltip — absolutely positioned, doesn't affect layout */}
            <AnimatePresence>
              {hoveredRole === 'congregation' && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 right-0 top-full mt-1.5 z-10 bg-white border border-gray-200 text-gray-500 text-[11px] leading-snug italic rounded-xl px-3 py-2 shadow-lg pointer-events-none"
                >
                  {t('home.attendingDesc')}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Bottom section — verse + footer (fixed height, doesn't grow) */}
      <div className="flex-shrink-0 pb-[max(env(safe-area-inset-bottom,0px),0.75rem)] text-center w-full max-w-sm">
        {/* Bible verse — fixed height to prevent layout shift on language change */}
        <div className="mb-3 px-2 min-h-[3.5rem] flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={i18n.language + '-verse'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-center"
            >
              <p className="text-xs text-gray-400 italic leading-relaxed">
                {t('home.bibleVerse')}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {t('home.bibleRef')}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* GitHub link */}
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-primary transition-colors"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
          {t('home.openSource')}
        </a>
      </div>

      {/* Ichthys modal */}
      <AnimatePresence>
        {showIchthys && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setShowIchthys(false)}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" />

            <motion.div
              className="bg-white rounded-3xl shadow-2xl max-w-sm w-full relative"
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-primary rounded-t-3xl px-5 pt-4 pb-3 text-center relative">
                <button
                  onClick={() => setShowIchthys(false)}
                  className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 active:bg-white/40 flex items-center justify-center text-white transition-all"
                  aria-label={t('common.close')}
                >
                  <span className="text-base leading-none">✕</span>
                </button>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-2xl">🐟</span>
                  <h2 className="text-lg font-bold text-white">{t('home.ichthysTitle')}</h2>
                </div>
                <p className="text-white/70 text-xs">{t('home.ichthysSubtitle')}</p>
              </div>

              <div className="px-4 py-3">
                {/* Intro */}
                <p className="text-xs text-gray-600 leading-relaxed text-center mb-2">
                  {t('home.ichthysIntro')}
                </p>

                {/* Acrostic table */}
                <table className="w-full border-collapse text-center">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider w-[12%]"></th>
                      <th className="py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider w-[30%]">{t('home.ichthysColGreek')}</th>
                      <th className="py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider w-[28%]">{t('home.ichthysColTranslit')}</th>
                      <th className="py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider w-[30%]">{t('home.ichthysColMeaning')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ICHTHYS_LETTERS.map((letter, i) => (
                      <tr key={letter.greek} className={i < ICHTHYS_LETTERS.length - 1 ? 'border-b border-gray-100' : ''}>
                        <td className="py-2 text-xl font-bold text-primary">{letter.greek}</td>
                        <td className="py-2 text-sm text-gray-500 italic">{letter.greekWord}</td>
                        <td className="py-2 text-xs text-gray-400">{t(letter.translitKey)}</td>
                        <td className="py-2 text-sm font-semibold text-gray-700">{t(letter.meaningKey)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
