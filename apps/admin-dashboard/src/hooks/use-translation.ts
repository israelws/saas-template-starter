import { useTranslation as useI18nTranslation } from 'react-i18next';

/**
 * Custom hook that wraps i18next useTranslation
 */
export function useTranslation() {
  return useI18nTranslation();
}