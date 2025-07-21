'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MultiRoleManager } from '@/components/users/multi-role-manager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { userAPI } from '@/lib/api';
import { useAppSelector } from '@/store/hooks';
import { 
  ArrowLeft, 
  Shield, 
  User, 
  Building, 
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface UserDetails {
  id: string;
  name: string;
  email: string;
  status: string;
  metadata?: any;
}

export default function UserRolesPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const userId = params.id as string;
  const organizationId = useAppSelector(state => state.organization.currentOrganization?.id);
  
  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleStats, setRoleStats] = useState({
    totalRoles: 0,
    activeRoles: 0,
    temporaryRoles: 0,
    expiredRoles: 0,
  });

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
    }
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      const response = await userAPI.getById(userId);
      setUser(response.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load user details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRolesUpdated = () => {
    // Update role statistics
    // In a real implementation, this would fetch updated stats
    toast({
      title: 'Roles updated',
      description: 'User role configuration has been updated',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12 text-muted-foreground">
          Loading user details...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">User not found</p>
          <Button onClick={() => router.push('/dashboard/users')}>
            Back to Users
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard/users')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Role Management</h1>
            <p className="text-muted-foreground mt-1">
              Managing roles for {user.name}
            </p>
          </div>
        </div>
        <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
          {user.status}
        </Badge>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            User Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="text-lg">{user.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-lg">{user.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">User ID</p>
              <p className="text-lg font-mono text-sm">{user.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="roles" className="space-y-6">
        <TabsList>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Current Roles
          </TabsTrigger>
          <TabsTrigger value="info" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Information
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-6">
          {/* Role Statistics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Roles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{roleStats.totalRoles}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Active
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">{roleStats.activeRoles}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  Temporary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-orange-600">{roleStats.temporaryRoles}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  Expired
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">{roleStats.expiredRoles}</p>
              </CardContent>
            </Card>
          </div>

          {/* Multi-Role Manager */}
          <MultiRoleManager
            userId={userId}
            userName={user.name}
            onRolesUpdated={handleRolesUpdated}
          />
        </TabsContent>

        <TabsContent value="info" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>About Multi-Role Support</CardTitle>
              <CardDescription>
                Understanding how multiple roles work in the system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Role Priority
                </h4>
                <p className="text-sm text-muted-foreground">
                  When a user has multiple roles, the system evaluates permissions based on role priority. 
                  Higher priority roles (larger numbers) are evaluated first. The first role that grants 
                  or denies access determines the outcome.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Temporary Roles
                </h4>
                <p className="text-sm text-muted-foreground">
                  Roles can be assigned with an expiration date. This is useful for temporary 
                  assignments like covering for someone on leave, contractors with limited 
                  engagement periods, or trial access to elevated permissions.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Organization Context
                </h4>
                <p className="text-sm text-muted-foreground">
                  Roles are scoped to organizations. A user can have different roles in different 
                  organizations, allowing for flexible access control in multi-tenant scenarios.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Common Use Cases</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Agent who also manages a branch (Agent + Branch Manager roles)</li>
                  <li>Temporary manager covering during vacation (Manager role with expiry)</li>
                  <li>Auditor with read-only access (Auditor role with high priority)</li>
                  <li>Customer service rep with limited admin access (User + Limited Admin)</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Best Practices</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Use clear priority values with gaps (100, 200, 300) for easy ordering</li>
                  <li>Document why multiple roles were assigned in audit logs</li>
                  <li>Regularly review and clean up expired roles</li>
                  <li>Test permission combinations when assigning multiple roles</li>
                  <li>Set expiration dates for elevated permissions when possible</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}