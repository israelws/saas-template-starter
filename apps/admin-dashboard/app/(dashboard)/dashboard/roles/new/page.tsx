'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { RoleForm } from '@/components/roles/role-form';
import { useBreadcrumb } from '@/hooks/use-breadcrumb';

export default function NewRolePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  useBreadcrumb([
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Roles', href: '/dashboard/roles' },
    { label: 'Create New Role' },
  ]);

  const handleSave = async (roleData: any) => {
    setIsLoading(true);
    try {
      // TODO: Implement actual API call
      // await rolesAPI.create(roleData);
      
      // Mock delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Success',
        description: 'Role created successfully',
      });
      router.push('/dashboard/roles');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create role',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/roles');
  };

  return (
    <div>
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/roles')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Roles
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Create New Role</h1>
        <p className="text-gray-500">Define a new role for your organization</p>
      </div>

      <RoleForm
        onSave={handleSave}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    </div>
  );
}