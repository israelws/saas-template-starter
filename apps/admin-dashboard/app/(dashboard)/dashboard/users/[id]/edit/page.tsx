'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { userAPI, organizationAPI } from '@/lib/api';
import { ArrowLeft } from 'lucide-react';
import { MultiOrganizationAssignment } from '@/components/users/multi-organization-assignment';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    status: 'active',
  });
  const [user, setUser] = useState<any>(null);
  const [userMemberships, setUserMemberships] = useState<any[]>([]);
  const [availableOrganizations, setAvailableOrganizations] = useState<any[]>([]);

  const fetchUser = useCallback(async () => {
    try {
      const response = await userAPI.getById(params.id as string);
      const user = response.data;
      setUser(user);
      setFormData({
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        status: user.status,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch user details',
        variant: 'destructive',
      });
      router.push('/dashboard/users');
    } finally {
      setIsFetching(false);
    }
  }, [params.id, router, toast]);

  const fetchUserMemberships = useCallback(async () => {
    try {
      const response = await userAPI.getUserMemberships(params.id as string);
      setUserMemberships(response.data || []);
    } catch (error) {
      console.error('Failed to fetch user memberships:', error);
    }
  }, [params.id]);

  const fetchAvailableOrganizations = useCallback(async () => {
    try {
      const response = await organizationAPI.getAll();
      setAvailableOrganizations(response.data.organizations || []);
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
    }
  }, []);

  useEffect(() => {
    if (params.id) {
      fetchUser();
      fetchUserMemberships();
      fetchAvailableOrganizations();
    }
  }, [params.id, fetchUser, fetchUserMemberships, fetchAvailableOrganizations]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await userAPI.update(params.id as string, formData);
      toast({
        title: 'Success',
        description: 'User updated successfully',
      });
      router.push(`/dashboard/users/${params.id}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update user',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleAssignOrganization = async (organizationId: string, role: string) => {
    try {
      await userAPI.assignToOrganization(params.id as string, organizationId, role);
      toast({
        title: 'Success',
        description: 'User assigned to organization successfully',
      });
      fetchUserMemberships();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to assign user to organization',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateOrganizationRole = async (organizationId: string, role: string) => {
    try {
      await userAPI.updateOrganizationRole(params.id as string, organizationId, role);
      toast({
        title: 'Success',
        description: 'Role updated successfully',
      });
      fetchUserMemberships();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update role',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveFromOrganization = async (organizationId: string) => {
    if (!confirm('Are you sure you want to remove this user from the organization?')) {
      return;
    }

    try {
      await userAPI.removeFromOrganization(params.id as string, organizationId);
      toast({
        title: 'Success',
        description: 'User removed from organization',
      });
      fetchUserMemberships();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove user from organization',
        variant: 'destructive',
      });
    }
  };

  const handleBulkAssign = async (assignments: { organizationId: string; role: string }[]) => {
    try {
      await Promise.all(
        assignments.map(({ organizationId, role }) =>
          userAPI.assignToOrganization(params.id as string, organizationId, role),
        ),
      );
      toast({
        title: 'Success',
        description: `User assigned to ${assignments.length} organizations`,
      });
      fetchUserMemberships();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to assign user to some organizations',
        variant: 'destructive',
      });
    }
  };

  if (isFetching) {
    return <div className="py-10 text-center">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push(`/dashboard/users/${params.id}`)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to User
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Edit User</h1>
        <p className="text-gray-500">Update user details</p>
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">User Details</TabsTrigger>
          <TabsTrigger value="organizations">Organizations</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>User Details</CardTitle>
                <CardDescription>Update the user information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      placeholder="John"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleChange('lastName', e.target.value)}
                      placeholder="Doe"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="john.doe@example.com"
                    required
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Changing email will require the user to verify the new address
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleChange('status', value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-lg bg-yellow-50 p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Password changes must be done by the user through the
                    password reset flow.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/dashboard/users/${params.id}`)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>

        <TabsContent value="organizations">
          <Card>
            <CardContent className="pt-6">
              {user && (
                <MultiOrganizationAssignment
                  user={user}
                  currentMemberships={userMemberships}
                  availableOrganizations={availableOrganizations}
                  onAssign={handleAssignOrganization}
                  onUpdateRole={handleUpdateOrganizationRole}
                  onRemove={handleRemoveFromOrganization}
                  onBulkAssign={handleBulkAssign}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
