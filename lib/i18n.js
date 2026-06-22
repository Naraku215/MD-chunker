import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from '../locales/en/translation.json';
import zhCNTranslation from '../locales/zh-CN/translation.json';

const isServer = typeof window === 'undefined';
const i18nInstance = i18n.createInstance();

if (!i18nInstance.isInitialized) {
  if (!isServer) {
    i18nInstance.use(LanguageDetector);
  }

  i18nInstance
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: enTranslation },
        'zh-CN': { translation: zhCNTranslation },
        zh: { translation: zhCNTranslation }
      },
      supportedLngs: ['en', 'zh', 'zh-CN'],
      fallbackLng: 'zh-CN',
      lng: isServer ? 'zh-CN' : undefined,
      interpolation: { escapeValue: false },
      detection: isServer ? undefined : {
        order: ['localStorage', 'navigator'],
        lookupLocalStorage: 'i18nextLng',
        caches: ['localStorage'],
        convertDetectedLanguage: (lng) => {
          if (!lng) return lng;
          const normalized = String(lng).toLowerCase();
          if (normalized === 'zh' || normalized.startsWith('zh-')) return 'zh-CN';
          return lng;
        }
      }
    });
}

export default i18nInstance;
