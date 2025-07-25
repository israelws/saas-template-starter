'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams?.get('email') || '';
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !code) return;

    setIsVerifying(true);
    try {
      await api.post('/auth/verify-email', { email, code });

      toast({
        title: 'Email verified successfully',
        description: 'You can now sign in to your account.',
      });

      router.push('/login');
    } catch (error) {
      toast({
        title: 'Verification failed',
        description: 'Invalid or expired verification code. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) return;

    setIsResending(true);
    try {
      await api.post('/auth/resend-confirmation', { email });
      toast({
        title: 'Verification code sent',
        description: 'Please check your email for the new verification code.',
      });
    } catch (error) {
      toast({
        title: 'Failed to resend code',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 h-6 w-6"
          >
            <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
          </svg>
          Acme Inc
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;The verification process was quick and secure. I appreciate the extra layer of
              security for my account.&rdquo;
            </p>
            <footer className="text-sm">Jordan Lee</footer>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <Card className="p-6">
            <div className="flex flex-col space-y-2 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Icons.mail className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
              <p className="text-sm text-muted-foreground">We sent a verification code to</p>
              {email && <p className="text-sm font-medium mb-2">{email}</p>}
              <p className="text-sm text-muted-foreground">
                Enter the 6-digit code from your email below
              </p>
            </div>

            <form onSubmit={handleVerify} className="mt-6">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="code" className="sr-only">
                    Verification Code
                  </Label>
                  <Input
                    id="code"
                    placeholder="000000"
                    type="text"
                    autoCapitalize="none"
                    autoComplete="one-time-code"
                    autoCorrect="off"
                    disabled={isVerifying || isResending}
                    value={code}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setCode(value.slice(0, 6));
                    }}
                    className="text-center text-2xl font-mono tracking-[0.5em] h-14"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    required
                  />
                </div>
                <Button type="submit" disabled={isVerifying || !code || code.length !== 6}>
                  {isVerifying && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                  Verify Email
                </Button>
              </div>
            </form>

            <div className="mt-6 space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Didn&apos;t receive the code?
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={handleResendCode}
                disabled={isResending || !email}
              >
                {isResending ? (
                  <>
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Resend verification code'
                )}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Wrong email?{' '}
                <Link href="/register" className="underline underline-offset-4 hover:text-primary">
                  Go back to sign up
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
