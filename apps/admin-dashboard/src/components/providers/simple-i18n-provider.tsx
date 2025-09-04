'use client';

import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { useDirection } from '@/hooks/use-direction';
import { translations } from '@/lib/i18n/translations';

// Initialize i18next once
if (!i18n.isInitialized) {
  console.log('Initializing i18next with translations...');
  
  // Check if user has a saved language preference, otherwise default to English
  const savedLanguage = typeof window !== 'undefined' ? localStorage.getItem('i18nextLng') : null;
  const defaultLanguage = savedLanguage || 'en';
  
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: translations.en },
        he: { translation: translations.he },
        ar: { translation: translations.ar },
        es: { translation: translations.es },
        fr: { translation: translations.fr },
        de: { translation: translations.de },
      },
      lng: defaultLanguage, // Set default language
      fallbackLng: 'en',
      debug: false,
      interpolation: {
        escapeValue: false,
      },
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
      },
    });
  console.log('i18next initialized with language:', defaultLanguage);
}

export function SimpleI18nProvider({ children }: { children: React.ReactNode }) {
  // Apply direction based on language
  useDirection();

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}