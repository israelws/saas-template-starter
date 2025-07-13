'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Auth Error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h2 className="text-2xl font-semibold">Authentication Error</h2>
      <p className="text-gray-600">{error.message || 'An error occurred during authentication.'}</p>
      <Button onClick={() => reset()}>
        Try again
      </Button>
    </div>
  );
}