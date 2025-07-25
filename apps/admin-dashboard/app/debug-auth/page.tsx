'use client';

import { useEffect, useState } from 'react';
import { getCookie } from '@/lib/cookies';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function DebugAuthPage() {
  const [clientAuth, setClientAuth] = useState<any>({});
  const [serverAuth, setServerAuth] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Get client-side auth info
    const cookieToken = getCookie('authToken');
    const localToken = localStorage.getItem('authToken');
    const refreshToken = localStorage.getItem('refreshToken');

    setClientAuth({
      cookieToken: cookieToken ? cookieToken.substring(0, 20) + '...' : null,
      localToken: localToken ? localToken.substring(0, 20) + '...' : null,
      refreshToken: refreshToken ? 'Present' : 'Missing',
      allCookies: document.cookie,
      cookieLength: document.cookie.length,
    });

    // Get server-side auth info
    fetch('/api/debug/auth')
      .then((res) => res.json())
      .then((data) => {
        setServerAuth(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch server auth info:', err);
        setLoading(false);
      });
  }, []);

  const testNavigation = async (path: string) => {
    console.log(`Testing navigation to ${path}`);
    router.push(path);
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Debug Information</h1>

      <div className="space-y-4">
        <div className="p-4 border rounded bg-blue-50">
          <h2 className="font-semibold mb-2">Client-Side Auth:</h2>
          <pre className="text-sm overflow-auto">{JSON.stringify(clientAuth, null, 2)}</pre>
        </div>

        <div className="p-4 border rounded bg-green-50">
          <h2 className="font-semibold mb-2">Server-Side Auth:</h2>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <pre className="text-sm overflow-auto">{JSON.stringify(serverAuth, null, 2)}</pre>
          )}
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">Navigation Tests:</h2>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => testNavigation('/dashboard')}>Dashboard</Button>
            <Button onClick={() => testNavigation('/dashboard/users')}>Users</Button>
            <Button onClick={() => testNavigation('/dashboard/organizations')}>
              Organizations
            </Button>
            <Button onClick={() => window.location.reload()}>Refresh Page</Button>
          </div>
        </div>

        <div className="flex gap-4">
          <Button onClick={() => router.push('/login')}>Go to Login</Button>
          <Button
            variant="destructive"
            onClick={() => {
              localStorage.clear();
              document.cookie.split(';').forEach((c) => {
                document.cookie = c
                  .replace(/^ +/, '')
                  .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
              });
              router.push('/login');
            }}
          >
            Clear All & Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
