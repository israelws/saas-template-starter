import { AxiosError, AxiosRequestConfig } from 'axios';
import { store } from '@/store';
import { loginSuccess, logout } from '@/store/slices/authSlice';
import { api, authAPI } from './api';
import { logTokenStatus } from './token-utils';
import { setCookie } from './cookies';

interface FailedRequest {
  resolve: (token: string | null) => void;
  reject: (error: any) => void;
}

let isRefreshing = false;
let failedQueue: FailedRequest[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const setupAuthInterceptor = () => {
  // Request interceptor to add auth token
  api.interceptors.request.use(
    (config) => {
      const state = store.getState();
      const token = state.auth.token || localStorage.getItem('authToken');

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Add organization context if available
      const currentOrg = state.organization.currentOrganization;
      if (currentOrg && config.headers) {
        config.headers['X-Organization-Id'] = currentOrg.id;
      }

      return config;
    },
    (error) => Promise.reject(error),
  );

  // Response interceptor to handle token refresh
  api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

      if (error.response?.status === 401 && !originalRequest._retry) {
        console.log('401 error detected for URL:', originalRequest.url);
        console.log(
          'Current token in localStorage:',
          localStorage.getItem('authToken')?.substring(0, 20) + '...',
        );

        // Skip refresh for certain endpoints
        if (originalRequest.url?.includes('/auth/refresh')) {
          return Promise.reject(error);
        }

        if (isRefreshing) {
          // If already refreshing, queue this request
          console.log('Request queued while refreshing token for URL:', originalRequest.url);
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              console.log('Processing queued request for URL:', originalRequest.url);
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              return api(originalRequest);
            })
            .catch((err) => {
              console.error('Queued request failed for URL:', originalRequest.url, err);
              return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const refreshToken = localStorage.getItem('refreshToken');

        if (!refreshToken) {
          console.log('No refresh token available');
          // Don't logout immediately - let the user try to login again
          return Promise.reject(error);
        }

        try {
          console.log(
            'Attempting to refresh token with refresh token:',
            refreshToken?.substring(0, 20) + '...',
          );

          // Debug current token status
          logTokenStatus();

          const response = await authAPI.refreshToken(refreshToken);
          console.log('Refresh response:', { status: response.status, hasData: !!response.data });
          const { accessToken } = response.data;

          // Update access token in localStorage (refresh token remains the same)
          localStorage.setItem('authToken', accessToken);

          // Set cookie using the setCookie function
          setCookie('authToken', accessToken, 7);

          // Also set via server for reliability
          try {
            await fetch('/api/auth/set-cookie', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: accessToken }),
            });
          } catch (e) {
            console.error('Failed to set server cookie:', e);
          }

          // Update token in store
          const state = store.getState();
          store.dispatch(
            loginSuccess({
              user: state.auth.user!,
              token: accessToken,
            }),
          );

          // Process queued requests
          processQueue(null, accessToken);

          // Retry original request
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }

          console.log(
            'Token refreshed successfully, retrying original request for URL:',
            originalRequest.url,
          );
          console.log('Retry request headers:', originalRequest.headers);
          console.log('New access token (first 50 chars):', accessToken?.substring(0, 50));

          // Set a timeout to catch if the retry still fails
          const retryPromise = api(originalRequest);

          // Add a catch to handle if the refreshed token still doesn't work
          return retryPromise.catch((retryError) => {
            if (retryError?.response?.status === 401) {
              console.error('Refreshed token still rejected by backend. Forcing logout...');
              store.dispatch(logout());
              localStorage.removeItem('authToken');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('userData');
              document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
              window.location.href = '/login';
            }
            throw retryError;
          });
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          console.error('Refresh error details:', {
            status: refreshError?.response?.status,
            data: refreshError?.response?.data,
            message: refreshError?.message,
          });
          processQueue(refreshError, null);

          // Only logout if refresh token is truly invalid (401/403)
          const status = (refreshError as any)?.response?.status;
          if (status === 401 || status === 403) {
            console.log('Refresh token expired, forcing logout...');
            store.dispatch(logout());
            // Clear all auth data
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('userData');
            document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

            // Force redirect to login
            window.location.href = '/login';
          }

          // Let the auth provider handle navigation
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    },
  );
};
