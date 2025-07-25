'use client';

import { useEffect } from 'react';
import { ErrorBoundary } from '@/components/error-boundary';

export default function LoginDebugPage() {
  useEffect(() => {
    console.log('LoginDebugPage mounted');
    return () => {
      console.log('LoginDebugPage unmounted');
    };
  }, []);

  return (
    <ErrorBoundary>
      <div style={{ padding: '20px', minHeight: '100vh' }}>
        <h1>Debug Login Page</h1>
        <p>Testing step by step...</p>

        <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc' }}>
          <h2>Step 1: Basic Rendering</h2>
          <p>✓ If you see this, basic rendering works</p>
        </div>

        <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc' }}>
          <h2>Step 2: Testing Imports</h2>
          <TestImports />
        </div>
      </div>
    </ErrorBoundary>
  );
}

function TestImports() {
  useEffect(() => {
    console.log('TestImports component mounted');
  }, []);

  try {
    // Test basic imports
    const { cn } = require('@/lib/utils');
    console.log('✓ Utils import works');

    // Test UI components
    const { Button } = require('@/components/ui/button');
    console.log('✓ Button import works');

    const { Input } = require('@/components/ui/input');
    console.log('✓ Input import works');

    const { Card } = require('@/components/ui/card');
    console.log('✓ Card import works');

    // Test icons
    const { Icons } = require('@/components/icons');
    console.log('✓ Icons import works');

    // Test hooks
    const { useToast } = require('@/hooks/use-toast');
    console.log('✓ useToast import works');

    // Test Redux
    const { useDispatch } = require('react-redux');
    console.log('✓ Redux import works');

    // Test store
    const { store } = require('@/store');
    console.log('✓ Store import works');

    return (
      <div>
        <p>✓ All imports successful</p>
        <Button>Test Button</Button>
      </div>
    );
  } catch (error: any) {
    console.error('Import error:', error);
    return (
      <div style={{ color: 'red' }}>
        <p>✗ Import failed: {error.message}</p>
      </div>
    );
  }
}
