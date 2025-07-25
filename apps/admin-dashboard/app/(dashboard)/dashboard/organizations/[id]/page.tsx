'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { organizationAPI } from '@/lib/api';
import { Organization } from '@saas-template/shared';
import { OrganizationStats } from '@/components/organizations/organization-stats';
import { OrganizationTree } from '@/components/organizations/organization-tree';
import { cn } from '@/lib/utils';
import { useBreadcrumb } from '@/hooks/use-breadcrumb';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import {
  ArrowLeft,
  Building2,
  Users,
  Shield,
  Edit,
  Trash2,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';

// Helper function to build tree structure from hierarchy data
function buildTreeFromHierarchy(hierarchyData: any[]): any[] {
  const nodeMap = new Map();
  const rootNodes: any[] = [];

  // First pass: create all nodes
  hierarchyData.forEach((item) => {
    nodeMap.set(item.id, {
      ...item,
      children: [],
    });
  });

  // Second pass: build tree structure
  hierarchyData.forEach((item) => {
    const node = nodeMap.get(item.id);
    if (item.parentId && nodeMap.has(item.parentId)) {
      const parent = nodeMap.get(item.parentId);
      parent.children.push(node);
    } else if (item.depth === 0) {
      rootNodes.push(node);
    }
  });

  return rootNodes;
}

export default function OrganizationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [organizationStats, setOrganizationStats] = useState<any>(null);
  const [hierarchy, setHierarchy] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Set breadcrumbs
  useBreadcrumb(
    organization
      ? [
          { label: 'Dashboard', href: '/dashboard' },
          {
            label: 'Organizations',
            href: '/dashboard/organizations',
            icon: <Building2 className="h-4 w-4" />,
          },
          { label: organization.name, icon: <Building2 className="h-4 w-4" /> },
        ]
      : [
          { label: 'Dashboard', href: '/dashboard' },
          {
            label: 'Organizations',
            href: '/dashboard/organizations',
            icon: <Building2 className="h-4 w-4" />,
          },
          { label: 'Loading...', icon: <Building2 className="h-4 w-4" /> },
        ],
  );

  const fetchOrganizationData = useCallback(async () => {
    try {
      // Fetch organization details
      const orgResponse = await organizationAPI.getById(params.id as string);
      setOrganization(orgResponse.data);

      // For now, use placeholder stats until stats endpoint is implemented
      setOrganizationStats({
        totalMembers: 0,
        totalChildren: 0,
        totalPolicies: 0,
      });

      // Try to fetch hierarchy, but don't fail if it doesn't exist
      try {
        const hierarchyResponse = await organizationAPI.hierarchy.getHierarchy(params.id as string);
        setHierarchy(Array.isArray(hierarchyResponse.data) ? hierarchyResponse.data : []);
      } catch (hierarchyError) {
        console.log('Hierarchy data not available');
        setHierarchy([]);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch organization details',
        variant: 'destructive',
      });
      router.push('/dashboard/organizations');
    } finally {
      setIsLoading(false);
    }
  }, [params.id, toast, router]);

  useEffect(() => {
    if (params.id) {
      fetchOrganizationData();
    }
  }, [params.id, fetchOrganizationData]);

  const refreshHierarchy = async () => {
    setIsRefreshing(true);
    try {
      await organizationAPI.hierarchy.refresh();
      await fetchOrganizationData();
      toast({
        title: 'Success',
        description: 'Organization hierarchy refreshed',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to refresh hierarchy',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await organizationAPI.delete(params.id as string);
      toast({
        title: 'Success',
        description: 'Organization deleted successfully',
      });
      router.push('/dashboard/organizations');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete organization',
        variant: 'destructive',
      });
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <div className="py-10 text-center">Loading...</div>;
  }

  if (!organization) {
    return <div className="py-10 text-center">Organization not found</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/organizations')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Organizations
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{organization.name}</h1>
            <p className="text-gray-500">{organization.description}</p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/organizations/${organization.id}/edit`)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="outline" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{organization.type}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Shield className="mr-2 h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {organization.isActive ? 'Active' : 'Inactive'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Users className="mr-2 h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="mt-8">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="hierarchy">Hierarchy</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>Basic information about this organization</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Code</dt>
                  <dd className="mt-1 text-sm text-gray-900">{organization.code}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">{organization.type}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {organization.isActive ? 'Active' : 'Inactive'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created At</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(organization.createdAt).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
              {organization.settings && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-500">Settings</h3>
                  <pre className="mt-2 rounded bg-gray-100 p-2 text-xs">
                    {JSON.stringify(organization.settings, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics">
          {organizationStats ? (
            <OrganizationStats stats={organizationStats} />
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-sm text-gray-500">Loading statistics...</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Members</CardTitle>
                <CardDescription>Users who belong to this organization</CardDescription>
              </div>
              <Button
                onClick={() => router.push(`/dashboard/organizations/${organization.id}/members`)}
              >
                <Users className="mr-2 h-4 w-4" />
                Manage Members
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">Member management coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hierarchy">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Organization Hierarchy</CardTitle>
                  <CardDescription>Parent and child organizations in the hierarchy</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshHierarchy}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={cn('mr-2 h-4 w-4', isRefreshing && 'animate-spin')} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {hierarchy.length > 0 ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="mb-2 text-sm font-medium">Full Hierarchy Path</h4>
                    <div className="flex items-center gap-2">
                      {hierarchy[0]?.namePath?.map((name: string, index: number) => (
                        <React.Fragment key={index}>
                          <span className="text-sm">{name}</span>
                          {index < hierarchy[0].namePath.length - 1 && (
                            <ChevronRight className="h-3 w-3 text-muted-foreground" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  <OrganizationTree
                    organizations={buildTreeFromHierarchy(hierarchy)}
                    selectedOrganizationId={organization.id}
                    onSelectOrganization={(org) =>
                      router.push(`/dashboard/organizations/${org.id}`)
                    }
                  />
                </div>
              ) : (
                <p className="text-sm text-gray-500">No hierarchy information available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>Configure organization settings</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">Settings management coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        title="Delete Organization"
        description={`Are you sure you want to delete "${organization?.name}"? This action cannot be undone and will remove all associated data.`}
        confirmText="Delete Organization"
        cancelText="Cancel"
        variant="destructive"
        loading={isDeleting}
      />
    </div>
  );
}
