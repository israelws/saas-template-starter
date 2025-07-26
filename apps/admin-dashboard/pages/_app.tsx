import type { AppProps } from 'next/app';
import { appWithTranslation } from 'next-i18next';
import { useDirection } from '@/hooks/use-direction';
import '../app/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  // Apply RTL/LTR direction
  useDirection();
  
  return <Component {...pageProps} />;
}

export default appWithTranslation(MyApp);