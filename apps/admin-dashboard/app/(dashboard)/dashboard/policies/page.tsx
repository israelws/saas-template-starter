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
import { policyAPI } from '@/lib/api';
import { Policy } from '@saas-template/shared';
import { PolicyFlowDiagram } from '@/components/policies/policy-flow-diagram';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Shield,
  CheckCircle,
  XCircle,
  List,
  GitBranch,
} from 'lucide-react';
import { useBreadcrumb } from '@/hooks/use-breadcrumb';

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'flow'>('list');
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | undefined>(undefined);
  const router = useRouter();
  const { toast } = useToast();

  useBreadcrumb([
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Policies', icon: <Shield className="h-4 w-4" /> },
  ]);

  const fetchPolicies = useCallback(async () => {
    try {
      const response = await policyAPI.getAll();
      const policiesData = response.data?.data || response.data || [];
      setPolicies(Array.isArray(policiesData) ? policiesData : []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch policies',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this policy?')) {
      return;
    }

    try {
      await policyAPI.delete(id);
      toast({
        title: 'Success',
        description: 'Policy deleted successfully',
      });
      fetchPolicies();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete policy',
        variant: 'destructive',
      });
    }
  };

  const filteredPolicies = policies.filter(
    (policy) =>
      policy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getEffectIcon = (effect: string) => {
    return effect === 'allow' ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 90) return 'text-red-600';
    if (priority >= 70) return 'text-orange-600';
    if (priority >= 50) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Policies</h1>
          <p className="text-gray-500">Manage access control policies</p>
        </div>
        <Button onClick={() => router.push('/dashboard/policies/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Policy
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Policies</CardTitle>
              <CardDescription>View and manage ABAC policies for your system</CardDescription>
            </div>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'flow')}>
              <TabsList>
                <TabsTrigger value="list">
                  <List className="mr-1 h-4 w-4" />
                  List View
                </TabsTrigger>
                <TabsTrigger value="flow">
                  <GitBranch className="mr-1 h-4 w-4" />
                  Flow View
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'list' && (
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search policies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="py-10 text-center">Loading...</div>
          ) : viewMode === 'flow' ? (
            <PolicyFlowDiagram
              policies={policies}
              highlightedPolicyId={selectedPolicyId}
              onPolicyClick={(policy) => {
                setSelectedPolicyId(policy.id);
                router.push(`/dashboard/policies/${policy.id}`);
              }}
            />
          ) : filteredPolicies.length === 0 ? (
            <div className="py-10 text-center text-gray-500">No policies found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Effect</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPolicies.map((policy) => (
                  <TableRow
                    key={policy.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => router.push(`/dashboard/policies/${policy.id}`)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <Shield className="mr-2 h-4 w-4 text-gray-400" />
                        {policy.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {getEffectIcon(policy.effect)}
                        <span className="ml-2 capitalize">{policy.effect}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="rounded bg-gray-100 px-2 py-1 text-xs">
                        {policy.resources?.types?.join(', ') || 'Any'}
                      </code>
                    </TableCell>
                    <TableCell>
                      <code className="rounded bg-gray-100 px-2 py-1 text-xs">
                        {policy.actions?.join(', ') || 'None'}
                      </code>
                    </TableCell>
                    <TableCell>
                      <span className={`font-semibold ${getPriorityColor(policy.priority)}`}>
                        {policy.priority}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          policy.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {policy.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/policies/${policy.id}/edit`);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(policy.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
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
