'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Provider that ensures auth cookies are always synced with localStorage
 * This runs at the root level before any other components
 */
export function CookieSyncProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Sync cookies on mount and route changes
  useEffect(() => {
    const syncAuthCookie = () => {
      const token = localStorage.getItem('authToken');
      
      if (token) {
        // Set cookie with proper format
        const expires = new Date();
        expires.setTime(expires.getTime() + 7 * 24 * 60 * 60 * 1000);
        document.cookie = `authToken=${token}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
        
        // Also sync to server for SSR
        fetch('/api/auth/set-cookie', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        }).catch(() => {
          // Silently fail - cookie is already set client-side
        });
        
        console.log('[CookieSync] Token synced for path:', pathname);
      }
    };

    // Sync immediately
    syncAuthCookie();
  }, [pathname]);

  // Also sync periodically to prevent expiration
  useEffect(() => {
    const interval = setInterval(() => {
      const token = localStorage.getItem('authToken');
      if (token) {
        const expires = new Date();
        expires.setTime(expires.getTime() + 7 * 24 * 60 * 60 * 1000);
        document.cookie = `authToken=${token}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
      }
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, []);

  return <>{children}</>;
}