import { useEffect } from 'react';
import { useBreadcrumbs, BreadcrumbItem } from '@/contexts/breadcrumb-context';

export const useBreadcrumb = (breadcrumbs: BreadcrumbItem[]) => {
  const { setBreadcrumbs } = useBreadcrumbs();

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);

    // Reset to default on unmount
    return () => {
      setBreadcrumbs([{ label: 'Dashboard', href: '/dashboard' }]);
    };
    // Using breadcrumbs.length and mapping labels/hrefs to avoid circular reference
  }, [setBreadcrumbs, breadcrumbs.length, ...breadcrumbs.map(b => b.label + b.href)]);
};
