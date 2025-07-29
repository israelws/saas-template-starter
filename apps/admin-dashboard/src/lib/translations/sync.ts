import { TranslationManager } from './manager';
import { TranslationEntry } from './types';
import { extractedTranslations } from './extract';
import { extractedTranslationsExtended } from './extract-extended';
import { extractedTranslationsPolicies } from './extract-policies';

/**
 * Sync extracted translations with the Translation Manager
 */
export function syncTranslations() {
  const manager = TranslationManager.getInstance();
  
  // Combine all extracted translations
  const allTranslations = [
    ...extractedTranslations,
    ...extractedTranslationsExtended,
    ...extractedTranslationsPolicies,
  ];

  console.log(`Starting sync of ${allTranslations.length} translation keys`);

  // Add all entries to the manager
  allTranslations.forEach(entry => {
    manager.setTranslation({
      key: entry.key,
      translations: entry.translations,
      description: entry.description,
      category: entry.category,
    });
  });

  console.log(`Synced ${allTranslations.length} translation keys successfully`);
  
  // Force save to localStorage
  if (typeof window !== 'undefined') {
    const data = manager.getAllTranslations();
    localStorage.setItem('translations', JSON.stringify(data));
    console.log('Translations saved to localStorage');
  }
}

// Run sync on first load
if (typeof window !== 'undefined' && !localStorage.getItem('translations')) {
  syncTranslations();
}