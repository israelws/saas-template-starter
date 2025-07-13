'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { organizationAPI } from '@/lib/api';
import { Organization } from '@saas-template/shared';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  ChevronRight,
  TreePine,
  List,
  Building2,
} from 'lucide-react';
import { OrganizationTree } from '@/components/organizations/organization-tree';
import { useBreadcrumb } from '@/hooks/use-breadcrumb';

interface OrganizationNode extends Organization {
  children?: OrganizationNode[];
}

// Build tree structure from flat list
function buildOrganizationTree(organizations: Organization[]): OrganizationNode[] {
  const orgMap = new Map<string, OrganizationNode>();
  const rootOrgs: OrganizationNode[] = [];

  // First pass: create map
  organizations.forEach((org) => {
    orgMap.set(org.id, { ...org, children: [] });
  });

  // Second pass: build tree
  organizations.forEach((org) => {
    const node = orgMap.get(org.id)!;
    if (org.parentId && orgMap.has(org.parentId)) {
      const parent = orgMap.get(org.parentId)!;
      parent.children = parent.children || [];
      parent.children.push(node);
    } else {
      rootOrgs.push(node);
    }
  });

  return rootOrgs;
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree');
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useBreadcrumb([
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Organizations', icon: <Building2 className="h-4 w-4" /> },
  ]);

  const fetchOrganizations = useCallback(async () => {
    try {
      const response = await organizationAPI.getAll();
      setOrganizations(response.data);
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch organizations',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    // Add a small delay to ensure auth is properly initialized
    const timer = setTimeout(() => {
      fetchOrganizations();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [fetchOrganizations]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this organization?')) {
      return;
    }

    try {
      await organizationAPI.delete(id);
      toast({
        title: 'Success',
        description: 'Organization deleted successfully',
      });
      fetchOrganizations();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete organization',
        variant: 'destructive',
      });
    }
  };

  const filteredOrganizations = organizations.filter(
    (org) =>
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.code?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const treeOrganizations = buildOrganizationTree(filteredOrganizations);

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      company: 'bg-blue-100 text-blue-800',
      division: 'bg-green-100 text-green-800',
      department: 'bg-purple-100 text-purple-800',
      team: 'bg-yellow-100 text-yellow-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const handleSelectOrganization = (org: Organization) => {
    setSelectedOrganization(org);
  };

  const handleAddOrganization = (parentId: string | null) => {
    if (parentId) {
      router.push(`/dashboard/organizations/new?parentId=${parentId}`);
    } else {
      router.push('/dashboard/organizations/new');
    }
  };

  const handleEditOrganization = (org: Organization) => {
    router.push(`/dashboard/organizations/${org.id}/edit`);
  };

  const handleViewDetails = (org: Organization) => {
    router.push(`/dashboard/organizations/${org.id}`);
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organizations</h1>
          <p className="text-gray-500">Manage your organization hierarchy</p>
        </div>
        <Button onClick={() => router.push('/dashboard/organizations/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Organization
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Organizations</CardTitle>
              <CardDescription>View and manage all organizations in your system</CardDescription>
            </div>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'tree' | 'list')}>
              <TabsList>
                <TabsTrigger value="tree">
                  <TreePine className="mr-1 h-4 w-4" />
                  Tree View
                </TabsTrigger>
                <TabsTrigger value="list">
                  <List className="mr-1 h-4 w-4" />
                  List View
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search organizations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="py-10 text-center">Loading...</div>
          ) : viewMode === 'tree' ? (
            <OrganizationTree
              organizations={treeOrganizations}
              selectedOrganizationId={selectedOrganization?.id}
              onSelectOrganization={handleSelectOrganization}
              onAddOrganization={handleAddOrganization}
              onEditOrganization={handleEditOrganization}
              onDeleteOrganization={handleDelete}
              onViewDetails={handleViewDetails}
            />
          ) : filteredOrganizations.length === 0 ? (
            <div className="py-10 text-center text-gray-500">No organizations found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrganizations.map((org) => (
                  <TableRow
                    key={org.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => router.push(`/dashboard/organizations/${org.id}`)}
                  >
                    <TableCell className="font-medium">{org.name}</TableCell>
                    <TableCell>{org.code}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getTypeColor(
                          org.type,
                        )}`}
                      >
                        {org.type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          org.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {org.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="mr-1 h-4 w-4 text-gray-400" />
                        <span>0</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/organizations/${org.id}/edit`);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(org.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
