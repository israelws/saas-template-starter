import { useState, useEffect, useCallback } from 'react';
import { TranslationManager } from './manager';
import { TranslationEntry, SupportedLanguage } from './types';

const manager = TranslationManager.getInstance();

export function useTranslationManager() {
  const [translations, setTranslations] = useState<TranslationEntry[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [statistics, setStatistics] = useState<any>(null);

  const loadData = useCallback(() => {
    setTranslations(manager.getAllTranslations());
    setCategories(manager.getCategories());
    setStatistics(manager.getStatistics());
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const setTranslation = useCallback((entry: Omit<TranslationEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    manager.setTranslation(entry);
    loadData();
  }, [loadData]);

  const deleteTranslation = useCallback((key: string) => {
    manager.deleteTranslation(key);
    loadData();
  }, [loadData]);

  const searchTranslations = useCallback((query: string) => {
    if (!query) {
      return manager.getAllTranslations();
    }
    return manager.searchTranslations(query);
  }, []);

  const getTranslationsByCategory = useCallback((category: string) => {
    if (!category || category === 'all') {
      return manager.getAllTranslations();
    }
    return manager.getTranslationsByCategory(category);
  }, []);

  const getMissingTranslations = useCallback((language: SupportedLanguage) => {
    return manager.getMissingTranslations(language);
  }, []);

  const exportTranslations = useCallback(() => {
    return manager.exportTranslations();
  }, []);

  const exportByLanguage = useCallback((language: SupportedLanguage) => {
    return manager.exportByLanguage(language);
  }, []);

  const importTranslations = useCallback((json: string, merge = true) => {
    manager.importTranslations(json, merge);
    loadData();
  }, [loadData]);

  return {
    translations,
    categories,
    statistics,
    setTranslation,
    deleteTranslation,
    searchTranslations,
    getTranslationsByCategory,
    getMissingTranslations,
    exportTranslations,
    exportByLanguage,
    importTranslations,
    refresh: loadData,
  };
}