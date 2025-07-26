import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ReduxProvider } from '@/components/providers/redux-provider';
import { AuthProvider } from '@/components/providers/auth-provider';
import { SimpleI18nProvider } from '@/components/providers/simple-i18n-provider';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SAAS Admin Dashboard',
  description: 'Admin dashboard for SAAS template starter',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SimpleI18nProvider>
          <ReduxProvider>
            <AuthProvider>
              {children}
              <Toaster />
            </AuthProvider>
          </ReduxProvider>
        </SimpleI18nProvider>
      </body>
    </html>
  );
}
