'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { policyAPI, attributeAPI } from '@/lib/api';
import { PolicyBuilder } from '@/components/policies/policy-builder';
import { ArrowLeft } from 'lucide-react';
import { Policy } from '@saas-template/shared';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditPolicyPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [isFetching, setIsFetching] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [policy, setPolicy] = useState<Partial<Policy> | null>(null);
  const [availableAttributes, setAvailableAttributes] = useState<
    Array<{
      key: string;
      name: string;
      type: string;
      category: 'subject' | 'resource' | 'environment';
    }>
  >([]);

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
      setIsFetching(false);
    }
  }, [params.id, toast, router]);

  const fetchAttributes = useCallback(async () => {
    try {
      const response = await attributeAPI.getAll();
      setAvailableAttributes(
        response.data.data?.map((attr: any) => ({
          key: attr.key,
          name: attr.name,
          type: attr.type,
          category: attr.category,
        })) || [],
      );
    } catch (error) {
      console.error('Failed to fetch attributes:', error);
    }
  }, []);

  useEffect(() => {
    if (params.id) {
      Promise.all([fetchPolicy(), fetchAttributes()]);
    }
  }, [params.id, fetchPolicy, fetchAttributes]);

  const handleSave = async (updatedPolicy: Partial<Policy>) => {
    setIsLoading(true);
    try {
      await policyAPI.update(params.id as string, updatedPolicy);
      toast({
        title: 'Success',
        description: 'Policy updated successfully',
      });
      router.push(`/dashboard/policies/${params.id}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update policy',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(`/dashboard/policies/${params.id}`);
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

  if (!policy) {
    return <div className="py-10 text-center">Policy not found</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push(`/dashboard/policies/${params.id}`)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Policy
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Edit Policy</h1>
        <p className="text-gray-500">Use the visual builder to update the access control policy</p>
      </div>

      <PolicyBuilder
        initialPolicy={policy}
        onSave={handleSave}
        onCancel={handleCancel}
        availableAttributes={availableAttributes}
        isLoading={isLoading}
      />
    </div>
  );
}
