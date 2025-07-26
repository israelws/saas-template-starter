'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { policyAPI } from '@/lib/api';
import { Policy } from '@saas-template/shared';
import {
  ArrowLeft,
  Shield,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Copy,
  TestTube,
} from 'lucide-react';

export default function PolicyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPolicy = useCallback(async () => {
    try {
      const response = await policyAPI.getById(params.id as string);
      setPolicy(response.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch policy details',
        variant: 'destructive',
      });
      router.push('/dashboard/policies');
    } finally {
      setIsLoading(false);
    }
  }, [params.id, toast, router]);

  useEffect(() => {
    if (params.id) {
      fetchPolicy();
    }
  }, [params.id, fetchPolicy]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this policy?')) {
      return;
    }

    try {
      await policyAPI.delete(params.id as string);
      toast({
        title: 'Success',
        description: 'Policy deleted successfully',
      });
      router.push('/dashboard/policies');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete policy',
        variant: 'destructive',
      });
    }
  };

  const handleDuplicate = async () => {
    if (!policy) return;

    try {
      const newPolicy = {
        ...policy,
        name: `${policy.name} (Copy)`,
        status: 'inactive',
      };
      delete (newPolicy as any).id;
      delete (newPolicy as any).createdAt;
      delete (newPolicy as any).updatedAt;

      await policyAPI.create(newPolicy);
      toast({
        title: 'Success',
        description: 'Policy duplicated successfully',
      });
      router.push('/dashboard/policies');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to duplicate policy',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return <div className="py-10 text-center">Loading...</div>;
  }

  if (!policy) {
    return <div className="py-10 text-center">Policy not found</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <Button variant="ghost" onClick={() => router.push('/dashboard/policies')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Policies
        </Button>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Shield className="h-8 w-8 text-gray-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{policy.name}</h1>
              <p className="text-gray-500">{policy.description}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/policies/${policy.id}/test`)}
            >
              <TestTube className="mr-2 h-4 w-4" />
              Test
            </Button>
            <Button variant="outline" onClick={handleDuplicate}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/policies/${policy.id}/edit`)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="outline" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            {policy.effect === 'allow' ? (
              <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="mr-2 h-4 w-4 text-red-600" />
            )}
            <CardTitle className="text-sm font-medium">Effect</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{policy.effect}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Shield className="mr-2 h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{policy.priority}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Shield className="mr-2 h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {policy.isActive ? 'Active' : 'Inactive'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="details" className="mt-8">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="conditions">Conditions</TabsTrigger>
          <TabsTrigger value="json">JSON View</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Policy Details</CardTitle>
              <CardDescription>Core policy configuration and rules</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Resource Types</dt>
                  <dd className="mt-1">
                    <code className="rounded bg-gray-100 px-2 py-1 text-sm">
                      {policy.resources?.types?.join(', ') || 'Any'}
                    </code>
                  </dd>
                </div>
                {policy.resources?.attributes && Object.keys(policy.resources.attributes).length > 0 && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Resource Attributes</dt>
                    <dd className="mt-1 space-y-1">
                      {Object.entries(policy.resources.attributes).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2">
                          <code className="rounded bg-gray-100 px-2 py-1 text-sm">{key}</code>
                          <span className="text-gray-500">=</span>
                          <code className="rounded bg-blue-100 px-2 py-1 text-sm text-blue-700">
                            {String(value)}
                          </code>
                        </div>
                      ))}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500">Action</dt>
                  <dd className="mt-1">
                    <code className="rounded bg-gray-100 px-2 py-1 text-sm">
                      {policy.actions?.join(', ') || 'None'}
                    </code>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Effect</dt>
                  <dd className="mt-1 text-sm text-gray-900">{policy.effect}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Priority</dt>
                  <dd className="mt-1 text-sm text-gray-900">{policy.priority}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Organization</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {policy.organizationId || 'Global'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created At</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(policy.createdAt).toLocaleString()}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conditions">
          <Card>
            <CardHeader>
              <CardTitle>Policy Conditions</CardTitle>
              <CardDescription>
                Conditions that must be met for this policy to apply
              </CardDescription>
            </CardHeader>
            <CardContent>
              {policy.conditions && Object.keys(policy.conditions).length > 0 ? (
                <pre className="rounded bg-gray-100 p-4 text-sm">
                  {JSON.stringify(policy.conditions, null, 2)}
                </pre>
              ) : (
                <p className="text-sm text-gray-500">No conditions defined for this policy</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="json">
          <Card>
            <CardHeader>
              <CardTitle>JSON View</CardTitle>
              <CardDescription>Raw policy data in JSON format</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="overflow-auto rounded bg-gray-100 p-4 text-xs">
                {JSON.stringify(policy, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
