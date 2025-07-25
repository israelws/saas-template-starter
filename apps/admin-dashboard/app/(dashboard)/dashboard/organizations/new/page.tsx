'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { organizationAPI } from '@/lib/api';
import { ArrowLeft, Building2, Shield } from 'lucide-react';
import { OrganizationType, Organization, ORGANIZATION_TYPE_HIERARCHY } from '@saas-template/shared';

const organizationTypes = [
  { value: OrganizationType.COMPANY, label: 'Company', icon: Building2 },
  { value: OrganizationType.DIVISION, label: 'Division', icon: Building2 },
  { value: OrganizationType.DEPARTMENT, label: 'Department', icon: Building2 },
  { value: OrganizationType.TEAM, label: 'Team', icon: Building2 },
  { value: OrganizationType.INSURANCE_AGENCY, label: 'Insurance Agency', icon: Shield },
  { value: OrganizationType.INSURANCE_BRANCH, label: 'Insurance Branch', icon: Shield },
];

export default function NewOrganizationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [availableParents, setAvailableParents] = useState<Organization[]>([]);
  
  // Get parentId from URL params
  const parentIdFromUrl = searchParams.get('parentId');
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    type: OrganizationType.COMPANY,
    parentId: parentIdFromUrl || 'none',
    isActive: true,
  });

  useEffect(() => {
    loadOrganizations();
  }, []);

  // When parentId is provided, set appropriate default type
  useEffect(() => {
    if (parentIdFromUrl && organizations.length > 0) {
      const parentOrg = organizations.find(org => org.id === parentIdFromUrl);
      if (parentOrg) {
        const allowedChildren = ORGANIZATION_TYPE_HIERARCHY[parentOrg.type as OrganizationType] || [];
        if (allowedChildren.length > 0) {
          setFormData(prev => ({ ...prev, type: allowedChildren[0] }));
        }
      }
    }
  }, [parentIdFromUrl, organizations]);

  useEffect(() => {
    // Filter available parent organizations based on selected type
    if (formData.type && organizations && organizations.length >= 0) {
      const validParents = organizations.filter((org) => {
        const allowedChildren = ORGANIZATION_TYPE_HIERARCHY[org.type as OrganizationType] || [];
        return allowedChildren.includes(formData.type as OrganizationType);
      });
      
      setAvailableParents(validParents);

      // Reset parent if current selection is invalid
      if (formData.parentId !== 'none' && !validParents.find((p) => p.id === formData.parentId)) {
        setFormData((prev) => ({ ...prev, parentId: 'none' }));
      }
    }
  }, [formData.type, organizations]);

  const loadOrganizations = async () => {
    try {
      const response = await organizationAPI.getAll({ page: 1, limit: 100 });
      // Handle different response structures
      const orgs = response.data?.items || response.data?.data || response.data || [];
      setOrganizations(Array.isArray(orgs) ? orgs : []);
    } catch (error) {
      console.error('Failed to load organizations:', error);
      setOrganizations([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Convert 'none' back to undefined for the API
      const submitData = {
        ...formData,
        parentId: formData.parentId === 'none' ? undefined : formData.parentId,
      };
      await organizationAPI.create(submitData);
      toast({
        title: 'Success',
        description: 'Organization created successfully',
      });
      router.push('/dashboard/organizations');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create organization',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData({ ...formData, [field]: value });
  };

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
        <h1 className="text-3xl font-bold text-gray-900">Create Organization</h1>
        <p className="text-gray-500">Add a new organization to your system</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Organization Details</CardTitle>
            <CardDescription>Enter the details for the new organization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Acme Corporation"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                  placeholder="ACME"
                  required
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  A unique identifier for the organization
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Enter a description for the organization"
                rows={4}
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleChange('type', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {organizationTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center">
                            <Icon className="mr-2 h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="isActive">Status *</Label>
                <Select
                  value={formData.isActive ? 'true' : 'false'}
                  onValueChange={(value) => handleChange('isActive', value === 'true')}
                  disabled={isLoading}
                >
                  <SelectTrigger id="isActive">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {availableParents.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="parentId">Parent Organization</Label>
                <Select
                  value={formData.parentId}
                  onValueChange={(value) => handleChange('parentId', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger id="parentId">
                    <SelectValue placeholder="Select a parent organization (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No parent</SelectItem>
                    {availableParents.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name} ({organizationTypes.find((t) => t.value === org.type)?.label})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Only organizations that can have{' '}
                  {organizationTypes.find((t) => t.value === formData.type)?.label} as children are
                  shown
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/organizations')}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Organization'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
