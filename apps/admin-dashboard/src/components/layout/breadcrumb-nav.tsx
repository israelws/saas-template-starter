'use client';

import React from 'react';
import { Home } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useBreadcrumbs } from '@/contexts/breadcrumb-context';

export const BreadcrumbNav: React.FC = () => {
  const { breadcrumbs } = useBreadcrumbs();

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const isFirst = index === 0;

          return (
            <React.Fragment key={index}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="flex items-center gap-1">
                    {isFirst && <Home className="h-4 w-4" />}
                    {crumb.icon && !isFirst && <span className="mr-1">{crumb.icon}</span>}
                    {crumb.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={crumb.href} className="flex items-center gap-1">
                    {isFirst && <Home className="h-4 w-4" />}
                    {crumb.icon && !isFirst && <span className="mr-1">{crumb.icon}</span>}
                    {crumb.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
