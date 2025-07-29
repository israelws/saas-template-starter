'use client';

import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { useDirection } from '@/hooks/use-direction';
import { TranslationManager } from '@/lib/translations/manager';

// Check if i18n is already initialized
if (!i18n.isInitialized) {
  // Initialize i18next
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {},
      fallbackLng: 'en',
      debug: false,
      ns: ['translation'],
      defaultNS: 'translation',
      interpolation: {
        escapeValue: false,
      },
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
      },
    });
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const loadTranslations = async () => {
      // Ensure translations are synced first
      if (typeof window !== 'undefined' && !localStorage.getItem('translations')) {
        const { syncTranslations } = await import('@/lib/translations/sync');
        syncTranslations();
      }
      
      // Load translations from our Translation Manager
      const manager = TranslationManager.getInstance();
      
      // Ensure manager is initialized
      await manager.ensureInitialized();
      
      const languages = ['en', 'he', 'ar', 'es', 'fr', 'de'] as const;
      
      // Get all translations
      const allTranslations = manager.getAllTranslations();
      console.log(`Loading ${allTranslations.length} translations into i18next`);
      
      // Build resources for each language
      languages.forEach(lang => {
        const resources: Record<string, any> = {};
        
        allTranslations.forEach(entry => {
          const keys = entry.key.split('.');
          let current = resources;
          
          for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
              current[keys[i]] = {};
            }
            current = current[keys[i]];
          }
          
          current[keys[keys.length - 1]] = entry.translations[lang] || entry.translations.en;
        });
        
        console.log(`Adding ${Object.keys(resources).length} root keys for language: ${lang}`);
        i18n.addResourceBundle(lang, 'translation', resources, true, true);
      });
      
      setIsInitialized(true);
    };
    
    loadTranslations();
  }, []);

  // Apply direction based on language
  useDirection();

  if (!isInitialized) {
    return <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading translations...</p>
      </div>
    </div>;
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}