'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: ReactNode;
}

interface BreadcrumbContextType {
  breadcrumbs: BreadcrumbItem[];
  setBreadcrumbs: (items: BreadcrumbItem[]) => void;
  addBreadcrumb: (item: BreadcrumbItem) => void;
  removeBreadcrumb: (index: number) => void;
  clearBreadcrumbs: () => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined);

export const useBreadcrumbs = () => {
  const context = useContext(BreadcrumbContext);
  if (!context) {
    throw new Error('useBreadcrumbs must be used within a BreadcrumbProvider');
  }
  return context;
};

interface BreadcrumbProviderProps {
  children: ReactNode;
}

export const BreadcrumbProvider: React.FC<BreadcrumbProviderProps> = ({ children }) => {
  const [breadcrumbs, setBreadcrumbsState] = useState<BreadcrumbItem[]>([
    { label: 'Dashboard', href: '/dashboard' },
  ]);

  const setBreadcrumbs = useCallback((items: BreadcrumbItem[]) => {
    setBreadcrumbsState(items);
  }, []);

  const addBreadcrumb = useCallback((item: BreadcrumbItem) => {
    setBreadcrumbsState((prev) => [...prev, item]);
  }, []);

  const removeBreadcrumb = useCallback((index: number) => {
    setBreadcrumbsState((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearBreadcrumbs = useCallback(() => {
    setBreadcrumbsState([{ label: 'Dashboard', href: '/dashboard' }]);
  }, []);

  const value = {
    breadcrumbs,
    setBreadcrumbs,
    addBreadcrumb,
    removeBreadcrumb,
    clearBreadcrumbs,
  };

  return <BreadcrumbContext.Provider value={value}>{children}</BreadcrumbContext.Provider>;
};
