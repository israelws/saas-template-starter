'use client';

import { useEffect } from 'react';

export function ClearAndSync() {
  useEffect(() => {
    const initTranslations = async () => {
      // Check if we need to clear and sync
      if (typeof window !== 'undefined' && !localStorage.getItem('translations_initialized')) {
        console.log('Clearing and syncing translations...');
        
        // Clear any existing translations
        localStorage.removeItem('translations');
        
        // Import and run sync
        const { syncTranslations } = await import('@/lib/translations/sync');
        syncTranslations();
        
        // Mark as initialized
        localStorage.setItem('translations_initialized', 'true');
        
        // Reload to apply changes
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    };
    
    initTranslations();
  }, []);
  
  return null;
}