import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import zhTW from './locales/zh-TW.json';
import zhCN from './locales/zh-CN.json';

export const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'zh-TW', label: '繁' },
  { code: 'zh-CN', label: '简' },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      'zh-TW': { translation: zhTW },
      'zh-CN': { translation: zhCN },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'fish-for-people:lang',
      caches: ['localStorage'],
    },
  });

export default i18n;
