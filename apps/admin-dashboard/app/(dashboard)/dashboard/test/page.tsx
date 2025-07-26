'use client';

import { useTranslation } from 'react-i18next';

export default function TestPage() {
  const { t, i18n } = useTranslation();
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Translation Test</h1>
      
      <div className="space-y-2 mb-4">
        <p>Current language: <strong>{i18n.language}</strong></p>
        <p>Is initialized: <strong>{i18n.isInitialized ? 'Yes' : 'No'}</strong></p>
        <p>Available languages: <strong>{i18n.languages?.join(', ') || 'None'}</strong></p>
      </div>
      
      <div className="space-y-2 mb-4">
        <p>Raw t function result for 'dashboard.title': <strong>{t('dashboard.title')}</strong></p>
        <p>Raw t function result for 'navigation.dashboard': <strong>{t('navigation.dashboard')}</strong></p>
      </div>
      
      <div className="space-y-2">
        <button 
          onClick={() => i18n.changeLanguage('en')}
          className="px-4 py-2 bg-blue-500 text-white rounded mr-2"
        >
          English
        </button>
        <button 
          onClick={() => i18n.changeLanguage('he')}
          className="px-4 py-2 bg-blue-500 text-white rounded mr-2"
        >
          Hebrew
        </button>
        <button 
          onClick={() => i18n.changeLanguage('ar')}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Arabic
        </button>
      </div>
      
      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h2 className="font-bold mb-2">Debug Info:</h2>
        <pre className="text-xs overflow-auto">{JSON.stringify({
          language: i18n.language,
          languages: i18n.languages,
          hasLoadedNamespace: i18n.hasLoadedNamespace('translation'),
          resourcesLoaded: Object.keys(i18n.store?.data || {})
        }, null, 2)}</pre>
      </div>
    </div>
  );
}