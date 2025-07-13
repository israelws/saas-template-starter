'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { getCookie } from '@/lib/cookies';
import { api } from '@/lib/api';

export default function TestAuthPage() {
  const auth = useSelector((state: RootState) => state.auth);
  const [testResults, setTestResults] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runTests = async () => {
      const results: any = {
        timestamp: new Date().toISOString(),
        redux: {
          isAuthenticated: auth.isAuthenticated,
          hasUser: !!auth.user,
          hasToken: !!auth.token,
          tokenLength: auth.token?.length || 0
        },
        localStorage: {
          authToken: !!localStorage.getItem('authToken'),
          refreshToken: !!localStorage.getItem('refreshToken'),
          userData: !!localStorage.getItem('userData'),
          tokenLength: localStorage.getItem('authToken')?.length || 0
        },
        cookies: {
          authToken: !!getCookie('authToken'),
          tokenLength: getCookie('authToken')?.length || 0,
          allCookies: document.cookie
        },
        apiTest: {
          status: 'pending',
          error: null
        }
      };

      // Test API call
      try {
        const response = await api.get('/auth/me');
        results.apiTest = {
          status: 'success',
          statusCode: response.status,
          hasData: !!response.data,
          userId: response.data?.id
        };
      } catch (error: any) {
        results.apiTest = {
          status: 'failed',
          statusCode: error.response?.status,
          error: error.message,
          errorData: error.response?.data
        };
      }

      setTestResults(results);
      setLoading(false);
    };

    runTests();
  }, [auth]);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Authentication Test Page</h1>
      
      {loading ? (
        <p>Running tests...</p>
      ) : (
        <div className="space-y-4">
          <div className="p-4 border rounded">
            <h2 className="font-semibold mb-2">Test Results:</h2>
            <pre className="text-sm bg-gray-50 p-4 rounded overflow-auto">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </div>
          
          <div className="p-4 border rounded">
            <h2 className="font-semibold mb-2">Recommendations:</h2>
            {!testResults.redux.isAuthenticated && (
              <p className="text-red-600">❌ Redux not authenticated - auth state not initialized</p>
            )}
            {!testResults.localStorage.authToken && (
              <p className="text-red-600">❌ No auth token in localStorage</p>
            )}
            {!testResults.cookies.authToken && (
              <p className="text-red-600">❌ No auth token cookie</p>
            )}
            {testResults.apiTest.status === 'failed' && (
              <p className="text-red-600">❌ API call failed - {testResults.apiTest.error}</p>
            )}
            {testResults.redux.isAuthenticated && testResults.localStorage.authToken && testResults.cookies.authToken && testResults.apiTest.status === 'success' && (
              <p className="text-green-600">✅ All authentication checks passed!</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}