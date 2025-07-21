'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { policyAPI, attributeAPI } from '@/lib/api';
import { EnhancedPolicyBuilder } from '@/components/policies/enhanced-policy-builder';
import { ArrowLeft } from 'lucide-react';
import { Policy } from '@saas-template/shared';

export default function NewPolicyPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [availableAttributes, setAvailableAttributes] = useState<
    Array<{
      key: string;
      name: string;
      type: string;
      category: 'subject' | 'resource' | 'environment';
    }>
  >([]);

  useEffect(() => {
    fetchAttributes();
  }, []);

  const fetchAttributes = async () => {
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
  };

  const handleSave = async (policy: Partial<Policy>) => {
    setIsLoading(true);
    try {
      await policyAPI.create(policy);
      toast({
        title: 'Success',
        description: 'Policy created successfully',
      });
      router.push('/dashboard/policies');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create policy',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/policies');
  };

  return (
    <div>
      <div className="mb-8">
        <Button variant="ghost" onClick={() => router.push('/dashboard/policies')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Policies
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Create Policy</h1>
        <p className="text-gray-500">
          Use the visual builder to define a new access control policy
        </p>
      </div>

      <EnhancedPolicyBuilder
        onSave={handleSave}
        onCancel={handleCancel}
        availableAttributes={availableAttributes}
        isLoading={isLoading}
      />
    </div>
  );
}
