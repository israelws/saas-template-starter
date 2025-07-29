'use client';

import Image from 'next/image';
import { useTheme } from '@/components/providers/theme-provider';
import { useEffect, useState } from 'react';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export function Logo({ className = 'h-8 w-auto', width = 150, height = 40 }: LogoProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid hydration mismatch by showing nothing until mounted
  if (!mounted) {
    return <div className={className} style={{ width, height }} />;
  }

  // Determine which logo to show based on theme
  const logoSrc = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ? '/images/logo_light.png'
    : '/images/logo_main.png';

  return (
    <Image
      src={logoSrc}
      alt="Logo"
      width={width}
      height={height}
      className={className}
      priority
    />
  );
}