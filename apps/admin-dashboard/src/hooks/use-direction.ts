import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const RTL_LOCALES = ['he', 'ar'];

export function useDirection() {
  const { i18n } = useTranslation();
  const locale = i18n.language;
  const isRTL = RTL_LOCALES.includes(locale || 'en');

  useEffect(() => {
    const dir = isRTL ? 'rtl' : 'ltr';
    const html = document.documentElement;
    
    // Set direction on HTML element
    html.setAttribute('dir', dir);
    
    // Add/remove RTL class for Tailwind
    if (isRTL) {
      html.classList.add('rtl');
      html.classList.remove('ltr');
    } else {
      html.classList.add('ltr');
      html.classList.remove('rtl');
    }
  }, [isRTL]);

  return { isRTL, direction: isRTL ? 'rtl' : 'ltr' };
}