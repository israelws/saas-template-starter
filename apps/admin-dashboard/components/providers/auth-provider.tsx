'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setupAuthInterceptor } from '@/lib/auth-interceptor';
import { loginSuccess } from '@/store/slices/authSlice';
import { api } from '@/lib/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const dispatch = useDispatch();

  useEffect(() => {
    // Setup auth interceptor
    setupAuthInterceptor();

    // Check for existing session
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      const refreshToken = localStorage.getItem('refreshToken');

      if (token && refreshToken) {
        try {
          // Validate token by fetching user profile
          const response = await api.get('/auth/me');
          dispatch(
            loginSuccess({
              user: response.data,
              token,
            }),
          );
        } catch (error) {
          // Token invalid, try refresh
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          router.push('/login');
        }
      }
    };

    checkAuth();
  }, [dispatch, router]);

  return <>{children}</>;
}
