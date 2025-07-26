export interface TranslationResource {
  [key: string]: string | TranslationResource;
}

export interface LanguageResource {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  direction: 'ltr' | 'rtl';
  translations: TranslationResource;
}

export interface TranslationKey {
  key: string;
  defaultValue: string;
  description?: string;
  category?: string;
  maxLength?: number;
}

export interface TranslationEntry {
  id: string;
  key: string;
  translations: {
    [languageCode: string]: string;
  };
  description?: string;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type SupportedLanguage = 'en' | 'he' | 'ar' | 'es' | 'fr' | 'de';

export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, LanguageResource> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    direction: 'ltr',
    translations: {},
  },
  he: {
    code: 'he',
    name: 'Hebrew',
    nativeName: 'עברית',
    flag: '🇮🇱',
    direction: 'rtl',
    translations: {},
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇸🇦',
    direction: 'rtl',
    translations: {},
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    direction: 'ltr',
    translations: {},
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    direction: 'ltr',
    translations: {},
  },
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    direction: 'ltr',
    translations: {},
  },
};