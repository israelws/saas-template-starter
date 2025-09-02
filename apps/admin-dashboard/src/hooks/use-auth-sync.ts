import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { setCookie } from '@/lib/cookies';

/**
 * Hook to keep auth token synced between localStorage and cookies
 * This prevents middleware from redirecting when cookies are out of sync
 */
export function useAuthSync() {
  const token = useSelector((state: RootState) => state.auth.token);
  const pathname = usePathname();
  
  // Sync on every route change
  useEffect(() => {
    const syncToken = () => {
      const storedToken = localStorage.getItem('authToken');
      
      if (storedToken) {
        // Always set cookie on route change to ensure it's present
        console.log('[AuthSync] Syncing token on route change:', pathname);
        setCookie('authToken', storedToken, 7);
        
        // Also try server-side cookie set for reliability
        fetch('/api/auth/set-cookie', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: storedToken }),
        }).catch(err => console.error('[AuthSync] Server cookie set failed:', err));
      }
    };
    
    syncToken();
  }, [pathname]);
  
  useEffect(() => {
    // Sync token from localStorage to cookie on mount and when token changes
    const syncToken = () => {
      const storedToken = localStorage.getItem('authToken');
      
      if (storedToken) {
        // Check if cookie exists and matches
        const cookieToken = document.cookie
          .split('; ')
          .find(row => row.startsWith('authToken='))
          ?.split('=')[1];
        
        if (cookieToken !== storedToken) {
          console.log('[AuthSync] Syncing token to cookie');
          setCookie('authToken', storedToken, 7);
        }
      }
    };
    
    // Initial sync
    syncToken();
    
    // Sync on storage events (when localStorage changes in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authToken') {
        syncToken();
      }
    };
    
    // Sync periodically to ensure cookie doesn't expire
    const interval = setInterval(syncToken, 10000); // Every 10 seconds
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [token]);
  
  // Also sync before any navigation
  useEffect(() => {
    const originalPush = window.history.pushState;
    const originalReplace = window.history.replaceState;
    
    const syncBeforeNavigation = () => {
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        setCookie('authToken', storedToken, 7);
      }
    };
    
    window.history.pushState = function(...args) {
      syncBeforeNavigation();
      return originalPush.apply(window.history, args);
    };
    
    window.history.replaceState = function(...args) {
      syncBeforeNavigation();
      return originalReplace.apply(window.history, args);
    };
    
    return () => {
      window.history.pushState = originalPush;
      window.history.replaceState = originalReplace;
    };
  }, []);
}