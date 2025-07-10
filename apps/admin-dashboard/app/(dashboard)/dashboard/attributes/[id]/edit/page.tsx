'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Plus, X, Info } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { attributeAPI } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

const ATTRIBUTE_CATEGORIES = [
  { value: 'subject', label: 'Subject', description: 'Attributes related to users or actors' },
  {
    value: 'resource',
    label: 'Resource',
    description: 'Attributes related to resources being accessed',
  },
  {
    value: 'environment',
    label: 'Environment',
    description: 'Contextual attributes like time, location',
  },
  { value: 'custom', label: 'Custom', description: 'Custom attributes specific to your use case' },
];

const ATTRIBUTE_TYPES = [
  { value: 'string', label: 'String', description: 'Text values' },
  { value: 'number', label: 'Number', description: 'Numeric values' },
  { value: 'boolean', label: 'Boolean', description: 'True/false values' },
  { value: 'array', label: 'Array', description: 'List of values' },
  { value: 'object', label: 'Object', description: 'Complex nested values' },
];

export default function EditAttributePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [formData, setFormData] = useState({
    key: '',
    name: '',
    description: '',
    type: 'string',
    category: 'custom',
    isRequired: false,
    allowedValues: [] as string[],
    defaultValue: '',
    isSystem: false,
  });
  const [newAllowedValue, setNewAllowedValue] = useState('');
  const [originalKey, setOriginalKey] = useState('');

  const fetchAttribute = useCallback(
    async (id: string) => {
      try {
        setIsFetching(true);
        const response = await attributeAPI.getById(id);
        const attribute = response.data;

        setFormData({
          key: attribute.key,
          name: attribute.name,
          description: attribute.description || '',
          type: attribute.type,
          category: attribute.category,
          isRequired: attribute.isRequired,
          allowedValues: attribute.allowedValues || [],
          defaultValue: attribute.defaultValue || '',
          isSystem: attribute.isSystem || false,
        });
        setOriginalKey(attribute.key);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch attribute',
          variant: 'destructive',
        });
        router.push('/dashboard/attributes');
      } finally {
        setIsFetching(false);
      }
    },
    [toast, router],
  );

  useEffect(() => {
    if (params.id) {
      fetchAttribute(params.id as string);
    }
  }, [params.id, fetchAttribute]);

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleAddAllowedValue = () => {
    if (newAllowedValue && !formData.allowedValues.includes(newAllowedValue)) {
      setFormData({
        ...formData,
        allowedValues: [...formData.allowedValues, newAllowedValue],
      });
      setNewAllowedValue('');
    }
  };

  const handleRemoveAllowedValue = (value: string) => {
    setFormData({
      ...formData,
      allowedValues: formData.allowedValues.filter((v) => v !== value),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate key format
      if (!formData.key.match(/^[a-zA-Z][a-zA-Z0-9._]*$/)) {
        throw new Error(
          'Key must start with a letter and contain only letters, numbers, dots, and underscores',
        );
      }

      const payload = {
        ...formData,
        dataType: formData.type, // Backend might expect dataType
        defaultValue: formData.defaultValue || undefined,
        allowedValues: formData.allowedValues.length > 0 ? formData.allowedValues : undefined,
      };

      await attributeAPI.update(params.id as string, payload);

      toast({
        title: 'Success',
        description: 'Attribute updated successfully',
      });

      router.push('/dashboard/attributes');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update attribute',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-20" />
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/attributes')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Attribute</h1>
          <p className="text-sm text-muted-foreground">Update attribute definition</p>
        </div>
      </div>

      {/* System Attribute Warning */}
      {formData.isSystem && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-base text-yellow-800">System Attribute</CardTitle>
            <CardDescription className="text-yellow-700">
              This is a system attribute. Some properties cannot be modified.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Attribute Details</CardTitle>
            <CardDescription>Update the properties of your attribute</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleChange('category', value)}
                disabled={formData.isSystem}
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ATTRIBUTE_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      <div>
                        <div className="font-medium">{category.label}</div>
                        <div className="text-xs text-muted-foreground">{category.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Key */}
            <div className="space-y-2">
              <Label htmlFor="key">Attribute Key *</Label>
              <Input
                id="key"
                value={formData.key}
                onChange={(e) => handleChange('key', e.target.value)}
                placeholder="e.g., subject.department"
                required
                className="font-mono"
                disabled={formData.isSystem}
              />
              {formData.key !== originalKey && (
                <p className="text-xs text-yellow-600">
                  Warning: Changing the key may break existing policies that use this attribute
                </p>
              )}
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Display Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., User Department"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Describe what this attribute represents..."
                rows={3}
              />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Data Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleChange('type', value)}
                disabled={formData.isSystem}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ATTRIBUTE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Default Value */}
            <div className="space-y-2">
              <Label htmlFor="defaultValue">Default Value</Label>
              <Input
                id="defaultValue"
                value={formData.defaultValue}
                onChange={(e) => handleChange('defaultValue', e.target.value)}
                placeholder={`Enter default ${formData.type} value`}
              />
              <p className="text-xs text-muted-foreground">
                Optional default value when attribute is not provided
              </p>
            </div>

            {/* Allowed Values */}
            {(formData.type === 'string' || formData.type === 'number') && (
              <div className="space-y-2">
                <Label>Allowed Values</Label>
                <div className="flex gap-2">
                  <Input
                    value={newAllowedValue}
                    onChange={(e) => setNewAllowedValue(e.target.value)}
                    placeholder="Enter allowed value"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddAllowedValue();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={handleAddAllowedValue}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.allowedValues.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.allowedValues.map((value) => (
                      <Badge key={value} variant="secondary" className="pl-2 pr-1">
                        {value}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                          onClick={() => handleRemoveAllowedValue(value)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Restrict this attribute to specific values (optional)
                </p>
              </div>
            )}

            {/* Required */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="isRequired">Required Attribute</Label>
                <p className="text-sm text-muted-foreground">
                  Make this attribute mandatory in policy evaluations
                </p>
              </div>
              <Switch
                id="isRequired"
                checked={formData.isRequired}
                onCheckedChange={(checked) => handleChange('isRequired', checked)}
              />
            </div>

            {/* Info Box */}
            <div className="flex items-start gap-2 p-4 bg-blue-50 rounded-lg">
              <Info className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Attribute Usage</p>
                <p>
                  This attribute can be used in policy conditions. For example:{' '}
                  <code className="font-mono bg-blue-100 px-1 rounded">
                    {formData.key || 'subject.attribute'} equals &quot;value&quot;
                  </code>
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/attributes')}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || formData.isSystem}>
              {isLoading ? 'Updating...' : 'Update Attribute'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
