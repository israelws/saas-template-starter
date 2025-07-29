import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ReduxProvider } from '@/components/providers/redux-provider';
import { AuthProvider } from '@/components/providers/auth-provider';
import { SimpleI18nProvider } from '@/components/providers/simple-i18n-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Committed Ltd Admin Dashboard',
  description: 'Admin dashboard for Committed Ltd',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider defaultTheme="system" storageKey="saas-theme">
          <SimpleI18nProvider>
            <ReduxProvider>
              <AuthProvider>
                {children}
                <Toaster />
              </AuthProvider>
            </ReduxProvider>
          </SimpleI18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
