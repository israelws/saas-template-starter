import { LoginForm } from '@/components/auth/login-form';
import { Card } from '@/components/ui/card';
import Image from 'next/image';

export default function LoginPage() {
  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex items-center">
          <Image
            src="/logo_main.png"
            alt="Logo"
            width={200}
            height={60}
            className="h-12 w-auto"
            priority
          />
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;This platform has revolutionized how we manage our multi-organization structure
              and permissions. The ABAC system is incredibly powerful.&rdquo;
            </p>
            <footer className="text-sm">Sofia Davis</footer>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <Card className="p-6">
            <LoginForm />
          </Card>
        </div>
      </div>
    </div>
  );
}
