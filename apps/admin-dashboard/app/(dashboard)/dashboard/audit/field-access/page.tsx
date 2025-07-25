'use client';

import React from 'react';
import { FieldAccessAuditLog } from '@/components/audit/field-access-audit-log';
import { Shield, FileSearch } from 'lucide-react';
import { useBreadcrumb } from '@/hooks/use-breadcrumb';

export default function FieldAccessAuditPage() {
  useBreadcrumb([
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Audit', icon: <Shield className="h-4 w-4" /> },
    { label: 'Field Access', icon: <FileSearch className="h-4 w-4" /> },
  ]);

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Field Access Audit Log</h1>
        <p className="text-muted-foreground mt-2">
          Monitor and review field-level access attempts across your organization
        </p>
      </div>

      <FieldAccessAuditLog />
    </div>
  );
}
