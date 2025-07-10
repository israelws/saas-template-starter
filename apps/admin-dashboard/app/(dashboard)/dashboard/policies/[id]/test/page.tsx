'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { policyAPI, attributeAPI } from '@/lib/api';
import { PolicyTester } from '@/components/policies/policy-tester';
import { Policy } from '@saas-template/shared';
import { ArrowLeft } from 'lucide-react';

export default function PolicyTestPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [policies, setPolicies] = useState<Policy[]>([]);
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
        description: 'Failed to fetch policy',
        variant: 'destructive',
      });
    }
  }, [params.id, toast]);

  const fetchPolicies = useCallback(async () => {
    try {
      const response = await policyAPI.getAll();
      setPolicies(response.data);
    } catch (error) {
      console.error('Failed to fetch policies:', error);
    }
  }, []);

  const fetchAttributes = useCallback(async () => {
    try {
      const response = await attributeAPI.getAll();
      setAvailableAttributes(
        response.data.map((attr: any) => ({
          key: `${attr.category}.${attr.key}`,
          name: attr.name,
          type: attr.type,
          category: attr.category,
        })),
      );
    } catch (error) {
      console.error('Failed to fetch attributes:', error);
    }
  }, []);

  useEffect(() => {
    fetchPolicy();
    fetchPolicies();
    fetchAttributes();
  }, [fetchPolicy, fetchPolicies, fetchAttributes]);

  const handleTest = async (context: any) => {
    try {
      const response = await policyAPI.test({
        ...context,
        policyId: params.id as string,
      });

      return response.data;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to test policy',
        variant: 'destructive',
      });
      throw error;
    }
  };

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
        <h1 className="text-3xl font-bold text-gray-900">
          Test Policy{policy ? `: ${policy.name}` : ''}
        </h1>
        <p className="text-gray-500">Test how this policy evaluates in different scenarios</p>
      </div>

      <PolicyTester
        policies={policies}
        onTest={handleTest}
        availableAttributes={availableAttributes}
      />
    </div>
  );
}
