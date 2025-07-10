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
  }, [setBreadcrumbs, JSON.stringify(breadcrumbs)]);
};
