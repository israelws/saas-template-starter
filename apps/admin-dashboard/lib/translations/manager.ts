import { TranslationResource, TranslationKey, TranslationEntry, SupportedLanguage } from './types';

export class TranslationManager {
  private static instance: TranslationManager;
  private translations: Map<string, TranslationEntry> = new Map();
  private categories: Set<string> = new Set();
  private initPromise: Promise<void> | null = null;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initPromise = this.initializeTranslations();
    }
  }
  
  private async initializeTranslations() {
    // Check if we need to sync translations
    if (!localStorage.getItem('translations')) {
      console.log('No translations in localStorage, syncing...');
      // Import sync function dynamically to avoid circular dependencies
      const { syncTranslations } = await import('./sync');
      syncTranslations();
    }
    
    // Always load translations after potential sync
    this.loadTranslations();
  }
  
  async ensureInitialized() {
    if (this.initPromise) {
      await this.initPromise;
    }
  }

  static getInstance(): TranslationManager {
    if (!TranslationManager.instance) {
      TranslationManager.instance = new TranslationManager();
    }
    return TranslationManager.instance;
  }

  /**
   * Load translations from localStorage or default files
   */
  private loadTranslations(): void {
    const stored = localStorage.getItem('translations');
    if (stored) {
      const data = JSON.parse(stored);
      data.forEach((entry: TranslationEntry) => {
        this.translations.set(entry.key, entry);
        if (entry.category) {
          this.categories.add(entry.category);
        }
      });
    } else {
      // Initialize with default translations
      this.initializeDefaultTranslations();
    }
  }

  /**
   * Save translations to localStorage
   */
  private saveTranslations(): void {
    const data = Array.from(this.translations.values());
    localStorage.setItem('translations', JSON.stringify(data));
  }

  /**
   * Initialize with default translations from existing files
   */
  private initializeDefaultTranslations(): void {
    // This would be populated from the existing translation files
    // For now, we'll add some sample entries
    const defaultEntries: TranslationEntry[] = [
      {
        id: '1',
        key: 'navigation.dashboard',
        translations: {
          en: 'Dashboard',
          he: 'לוח בקרה',
          ar: 'لوحة القيادة',
          es: 'Panel',
          fr: 'Tableau de bord',
          de: 'Dashboard',
        },
        category: 'navigation',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Add more default entries as needed
    ];

    defaultEntries.forEach(entry => {
      this.translations.set(entry.key, entry);
      if (entry.category) {
        this.categories.add(entry.category);
      }
    });

    this.saveTranslations();
  }

  /**
   * Get all translations
   */
  getAllTranslations(): TranslationEntry[] {
    const translations = Array.from(this.translations.values());
    if (translations.length === 0 && typeof window !== 'undefined') {
      console.warn('No translations loaded in manager');
    }
    return translations;
  }

  /**
   * Get translations by category
   */
  getTranslationsByCategory(category: string): TranslationEntry[] {
    return Array.from(this.translations.values()).filter(
      entry => entry.category === category
    );
  }

  /**
   * Get all categories
   */
  getCategories(): string[] {
    return Array.from(this.categories);
  }

  /**
   * Get a specific translation
   */
  getTranslation(key: string): TranslationEntry | undefined {
    return this.translations.get(key);
  }

  /**
   * Add or update a translation
   */
  setTranslation(entry: Omit<TranslationEntry, 'id' | 'createdAt' | 'updatedAt'>): void {
    const existing = this.translations.get(entry.key);
    
    const newEntry: TranslationEntry = {
      ...entry,
      id: existing?.id || Date.now().toString(),
      createdAt: existing?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    this.translations.set(entry.key, newEntry);
    if (entry.category) {
      this.categories.add(entry.category);
    }

    this.saveTranslations();
  }

  /**
   * Delete a translation
   */
  deleteTranslation(key: string): boolean {
    const deleted = this.translations.delete(key);
    if (deleted) {
      this.saveTranslations();
    }
    return deleted;
  }

  /**
   * Export translations to JSON
   */
  exportTranslations(): string {
    const data = this.getAllTranslations();
    return JSON.stringify(data, null, 2);
  }

  /**
   * Export translations by language
   */
  exportByLanguage(language: SupportedLanguage): string {
    const result: TranslationResource = {};
    
    this.translations.forEach(entry => {
      const keys = entry.key.split('.');
      let current: any = result;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = entry.translations[language] || '';
    });

    return JSON.stringify(result, null, 2);
  }

  /**
   * Import translations from JSON
   */
  importTranslations(json: string, merge = true): void {
    try {
      const data = JSON.parse(json) as TranslationEntry[];
      
      if (!merge) {
        this.translations.clear();
        this.categories.clear();
      }

      data.forEach(entry => {
        this.translations.set(entry.key, {
          ...entry,
          createdAt: new Date(entry.createdAt),
          updatedAt: new Date(entry.updatedAt),
        });
        if (entry.category) {
          this.categories.add(entry.category);
        }
      });

      this.saveTranslations();
    } catch (error) {
      throw new Error('Invalid JSON format');
    }
  }

  /**
   * Search translations
   */
  searchTranslations(query: string): TranslationEntry[] {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.translations.values()).filter(entry => {
      // Search in key
      if (entry.key.toLowerCase().includes(lowercaseQuery)) {
        return true;
      }
      
      // Search in translations
      return Object.values(entry.translations).some(
        translation => translation.toLowerCase().includes(lowercaseQuery)
      );
    });
  }

  /**
   * Get missing translations for a language
   */
  getMissingTranslations(language: SupportedLanguage): TranslationEntry[] {
    return Array.from(this.translations.values()).filter(
      entry => !entry.translations[language] || entry.translations[language].trim() === ''
    );
  }

  /**
   * Get translation statistics
   */
  getStatistics() {
    const languages: SupportedLanguage[] = ['en', 'he', 'ar', 'es', 'fr', 'de'];
    const totalKeys = this.translations.size;
    
    const stats = languages.map(lang => {
      const translated = Array.from(this.translations.values()).filter(
        entry => entry.translations[lang] && entry.translations[lang].trim() !== ''
      ).length;
      
      return {
        language: lang,
        translated,
        missing: totalKeys - translated,
        percentage: totalKeys > 0 ? Math.round((translated / totalKeys) * 100) : 0,
      };
    });

    return {
      totalKeys,
      languages: stats,
      categories: Array.from(this.categories),
    };
  }
}