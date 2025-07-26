'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { RoleForm } from '@/components/roles/role-form';
import { Skeleton } from '@/components/ui/skeleton';
import { useBreadcrumb } from '@/hooks/use-breadcrumb';

// Temporary mock data - map of roles by ID
const MOCK_ROLES: Record<string, any> = {
  '1': {
    id: '1',
    name: 'super_admin',
    displayName: 'Super Admin',
    description: 'Full system access with ability to manage all organizations',
    isActive: true,
    isSystem: true,
  },
  '2': {
    id: '2',
    name: 'admin',
    displayName: 'Admin',
    description: 'Organization administrator with full access within their organization',
    isActive: true,
    isSystem: true,
  },
  '3': {
    id: '3',
    name: 'manager',
    displayName: 'Manager',
    description: 'Can manage products, customers, and orders within their organization',
    isActive: true,
    isSystem: true,
  },
  '4': {
    id: '4',
    name: 'user',
    displayName: 'User',
    description: 'Basic user with read access to resources',
    isActive: true,
    isSystem: true,
  },
  '5': {
    id: '5',
    name: 'guest',
    displayName: 'Guest',
    description: 'Limited access for guest users',
    isActive: true,
    isSystem: true,
  },
  '6': {
    id: '6',
    name: 'department_head',
    displayName: 'Department Head',
    description: 'Head of department with approval rights',
    isActive: true,
    isSystem: false,
  },
  '7': {
    id: '7',
    name: 'auditor',
    displayName: 'Auditor',
    description: 'Read-only access to all resources for audit purposes',
    isActive: true,
    isSystem: false,
  },
  '8': {
    id: '8',
    name: 'customer_service',
    displayName: 'Customer Service',
    description: 'Support team member with customer and order access',
    isActive: true,
    isSystem: false,
  },
};

export default function EditRolePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [role, setRole] = useState<any>(null);

  useBreadcrumb([
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Roles', href: '/dashboard/roles' },
    { label: 'Edit Role' },
  ]);

  const fetchRole = useCallback(async () => {
    try {
      setIsFetching(true);
      // TODO: Replace with actual API call
      // const response = await rolesAPI.getById(params.id);
      // setRole(response.data);
      
      // Using mock data for now
      setTimeout(() => {
        const roleData = MOCK_ROLES[params.id as string];
        if (roleData) {
          setRole(roleData);
        }
        setIsFetching(false);
      }, 500);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch role details',
        variant: 'destructive',
      });
      router.push('/dashboard/roles');
    }
  }, [params.id, toast, router]);

  useEffect(() => {
    if (params.id) {
      fetchRole();
    }
  }, [params.id, fetchRole]);

  const handleSave = async (roleData: any) => {
    setIsLoading(true);
    try {
      // TODO: Implement actual API call
      // await rolesAPI.update(params.id, roleData);
      
      // Mock delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Success',
        description: 'Role updated successfully',
      });
      router.push('/dashboard/roles');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update role',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/roles');
  };

  if (isFetching) {
    return (
      <div>
        <div className="mb-8">
          <Skeleton className="h-10 w-32 mb-4" />
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!role) {
    return <div className="py-10 text-center">Role not found</div>;
  }

  // Check if this is a system role
  if (role.isSystem) {
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
          <h1 className="text-3xl font-bold text-gray-900">System Role</h1>
          <p className="text-gray-500">System roles cannot be edited</p>
        </div>
        <div className="rounded-lg border bg-muted/50 p-8 text-center">
          <p className="text-lg font-medium mb-2">This is a system role</p>
          <p className="text-muted-foreground mb-4">
            System roles are built-in and cannot be modified to ensure platform stability.
          </p>
          <Button onClick={() => router.push('/dashboard/roles')}>
            Back to Roles
          </Button>
        </div>
      </div>
    );
  }

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
        <h1 className="text-3xl font-bold text-gray-900">Edit Role</h1>
        <p className="text-gray-500">Update role settings and permissions</p>
      </div>

      <RoleForm
        initialRole={role}
        onSave={handleSave}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    </div>
  );
}