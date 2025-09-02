'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { policyAPI, authAPI } from '@/lib/api';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

export default function TestAuthPage() {
  const [results, setResults] = useState<any[]>([]);
  const authState = useSelector((state: RootState) => state.auth);
  const orgState = useSelector((state: RootState) => state.organization);

  const addResult = (test: string, status: 'success' | 'error', details: any) => {
    setResults(prev => [...prev, { test, status, details, timestamp: new Date().toISOString() }]);
  };

  const testAuthMe = async () => {
    try {
      const response = await authAPI.validateToken();
      addResult('Auth Me', 'success', response.data);
    } catch (error: any) {
      addResult('Auth Me', 'error', error.response?.data || error.message);
    }
  };

  const testGetPolicies = async () => {
    try {
      const response = await policyAPI.getAll();
      addResult('Get Policies', 'success', { count: response.data?.data?.length || 0 });
    } catch (error: any) {
      addResult('Get Policies', 'error', error.response?.data || error.message);
    }
  };

  const testGetSinglePolicy = async () => {
    try {
      // First get all policies
      const allPolicies = await policyAPI.getAll();
      if (allPolicies.data?.data?.length > 0) {
        const policyId = allPolicies.data.data[0].id;
        const response = await policyAPI.getById(policyId);
        addResult('Get Single Policy', 'success', { id: policyId, name: response.data.name });
      } else {
        addResult('Get Single Policy', 'error', 'No policies found to test');
      }
    } catch (error: any) {
      addResult('Get Single Policy', 'error', error.response?.data || error.message);
    }
  };

  const checkLocalStorage = () => {
    const authToken = localStorage.getItem('authToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const orgId = localStorage.getItem('currentOrganizationId');
    const userData = localStorage.getItem('userData');
    
    addResult('LocalStorage Check', 'success', {
      hasAuthToken: !!authToken,
      authTokenPrefix: authToken?.substring(0, 20),
      hasRefreshToken: !!refreshToken,
      currentOrgId: orgId,
      hasUserData: !!userData,
    });
  };

  const checkCookies = () => {
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    addResult('Cookies Check', 'success', {
      hasAuthToken: !!cookies.authToken,
      authTokenPrefix: cookies.authToken?.substring(0, 20),
      allCookies: Object.keys(cookies),
    });
  };

  const checkReduxStore = () => {
    addResult('Redux Store Check', 'success', {
      isAuthenticated: authState.isAuthenticated,
      hasUser: !!authState.user,
      userId: authState.user?.id,
      hasToken: !!authState.token,
      tokenPrefix: authState.token?.substring(0, 20),
      currentOrg: orgState.currentOrganization?.name,
      orgId: orgState.currentOrganization?.id,
    });
  };

  const runAllTests = async () => {
    setResults([]);
    checkLocalStorage();
    checkCookies();
    checkReduxStore();
    await testAuthMe();
    await testGetPolicies();
    await testGetSinglePolicy();
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Authentication Debug Panel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={runAllTests}>Run All Tests</Button>
              <Button variant="outline" onClick={checkLocalStorage}>Check LocalStorage</Button>
              <Button variant="outline" onClick={checkCookies}>Check Cookies</Button>
              <Button variant="outline" onClick={checkReduxStore}>Check Redux</Button>
              <Button variant="outline" onClick={testAuthMe}>Test Auth Me</Button>
              <Button variant="outline" onClick={testGetPolicies}>Test Policies</Button>
            </div>

            <div className="mt-6 space-y-2">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded border ${
                    result.status === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="font-semibold">
                    {result.status === 'success' ? '✅' : '❌'} {result.test}
                  </div>
                  <pre className="text-xs mt-2 overflow-auto">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                  <div className="text-xs text-gray-500 mt-1">{result.timestamp}</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}