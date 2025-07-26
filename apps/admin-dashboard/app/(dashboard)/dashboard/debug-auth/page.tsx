'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';

export default function DebugAuthPage() {
  const { user, token } = useAuth();
  const [userDetails, setUserDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        if (user?.id) {
          const response = await api.get(`/users/${user.id}`);
          setUserDetails(response.data);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch user details');
      }
    };

    fetchUserDetails();
  }, [user]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Debug Authentication</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Current User</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>User Details from API</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-red-600">Error: {error}</div>
          ) : (
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(userDetails, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>JWT Token (first 100 chars)</CardTitle>
        </CardHeader>
        <CardContent>
          <code className="text-sm break-all">
            {token ? token.substring(0, 100) + '...' : 'No token'}
          </code>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Policy Access</CardTitle>
        </CardHeader>
        <CardContent>
          <button
            onClick={async () => {
              try {
                const response = await api.get('/abac/policies');
                console.log('Policy response:', response.data);
                alert('Success! Check console for response');
              } catch (err: any) {
                console.error('Policy error:', err.response?.data || err);
                alert(`Error: ${err.response?.data?.message || err.message}`);
              }
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Test Policy API
          </button>
        </CardContent>
      </Card>
    </div>
  );
}