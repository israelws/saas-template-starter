'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setupAuthInterceptor } from '@/lib/auth-interceptor';
import { loginSuccess } from '@/store/slices/authSlice';
import { api } from '@/lib/api';
import { setCookie, getCookie } from '@/lib/cookies';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Setup auth interceptor
    setupAuthInterceptor();

    // Check for existing session
    const initAuth = async () => {
      const token = localStorage.getItem('authToken');
      const refreshToken = localStorage.getItem('refreshToken');
      const cookieToken = getCookie('authToken');

      // Ensure cookie is synchronized with localStorage
      if (token && !cookieToken) {
        console.log('Syncing cookie with localStorage token');
        setCookie('authToken', token, 7);
      }

      if (token && refreshToken) {
        try {
          // First try to use stored user data for faster initialization
          const storedUserData = localStorage.getItem('userData');
          if (storedUserData) {
            try {
              const userData = JSON.parse(storedUserData);
              dispatch(
                loginSuccess({
                  user: userData,
                  token,
                }),
              );
            } catch (e) {
              console.error('Failed to parse stored user data:', e);
            }
          }

          // Then validate token by fetching user profile
          const response = await api.get('/auth/me');
          dispatch(
            loginSuccess({
              user: response.data,
              token,
            }),
          );
          
          // Update stored user data
          localStorage.setItem('userData', JSON.stringify(response.data));
          
          // Ensure cookie is set for middleware
          setCookie('authToken', token, 7);
        } catch (error: any) {
          console.error('Auth validation failed:', error);
          
          // Only clear auth if we're not on a public page
          const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];
          const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
          
          if (!isPublicPath) {
            // Clear invalid tokens
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('userData');
            document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            
            // Don't redirect if we're already on a public page
            if (!isPublicPath) {
              router.push('/login');
            }
          }
        }
      }
      
      setIsInitialized(true);
    };

    initAuth();
  }, [dispatch, router, pathname]);

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
