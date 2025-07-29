'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Code, Database, Shield, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { attributeAPI } from '@/lib/api';
import { useBreadcrumb } from '@/hooks/use-breadcrumb';

interface AttributeDefinition {
  id: string;
  key: string;
  name: string;
  description?: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  category: 'subject' | 'resource' | 'environment' | 'custom';
  dataType: string;
  allowedValues?: string[];
  defaultValue?: any;
  isRequired: boolean;
  isSystem: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const ATTRIBUTE_CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'subject', label: 'Subject', icon: Shield, color: 'text-blue-600' },
  { value: 'resource', label: 'Resource', icon: Database, color: 'text-green-600' },
  { value: 'environment', label: 'Environment', icon: Code, color: 'text-purple-600' },
  { value: 'custom', label: 'Custom', icon: Code, color: 'text-gray-600' },
];

const ATTRIBUTE_TYPES = [
  { value: 'string', label: 'String' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'array', label: 'Array' },
  { value: 'object', label: 'Object' },
];

export default function AttributesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [attributes, setAttributes] = useState<AttributeDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useBreadcrumb([
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Attributes', icon: <Code className="h-4 w-4" /> },
  ]);

  const fetchAttributes = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await attributeAPI.getAll();
      // Handle both paginated and non-paginated responses
      const attrs = response.data?.data || response.data || [];
      setAttributes(Array.isArray(attrs) ? attrs : []);
    } catch (error) {
      console.error('Error fetching attributes:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch attribute definitions',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAttributes();
  }, [fetchAttributes]);

  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; attributeId: string | null; attributeName?: string }>({ 
    open: false, 
    attributeId: null,
    attributeName: undefined
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteDialog.attributeId) return;
    
    setIsDeleting(true);
    try {
      await attributeAPI.delete(deleteDialog.attributeId);
      toast({
        title: 'Success',
        description: 'Attribute deleted successfully',
      });
      fetchAttributes();
      setDeleteDialog({ open: false, attributeId: null, attributeName: undefined });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete attribute',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredAttributes = React.useMemo(() => {
    if (!Array.isArray(attributes)) return [];

    return attributes.filter((attr) => {
      const matchesSearch =
        attr.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        attr.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        attr.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = categoryFilter === 'all' || attr.category === categoryFilter;
      const matchesType = typeFilter === 'all' || attr.type === typeFilter;

      return matchesSearch && matchesCategory && matchesType;
    });
  }, [attributes, searchQuery, categoryFilter, typeFilter]);

  const getCategoryConfig = (category: string) => {
    return ATTRIBUTE_CATEGORIES.find((c) => c.value === category);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'string':
        return 'bg-blue-100 text-blue-800';
      case 'number':
        return 'bg-green-100 text-green-800';
      case 'boolean':
        return 'bg-purple-100 text-purple-800';
      case 'array':
        return 'bg-orange-100 text-orange-800';
      case 'object':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Attribute Definitions</h1>
          <p className="text-sm text-muted-foreground">Manage attributes used in ABAC policies</p>
        </div>
        <Button onClick={() => router.push('/dashboard/attributes/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Attribute
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {ATTRIBUTE_CATEGORIES.slice(1).map((category) => {
          const count = Array.isArray(attributes)
            ? attributes.filter((a) => a.category === category.value).length
            : 0;
          const Icon = category.icon;

          return (
            <Card key={category.value}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{category.label} Attributes</CardTitle>
                {Icon && <Icon className={`h-4 w-4 ${category.color}`} />}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
                <p className="text-xs text-muted-foreground">Active definitions</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search attributes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {ATTRIBUTE_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {ATTRIBUTE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Attributes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Attribute Definitions</CardTitle>
          <CardDescription>
            {filteredAttributes.length} attribute{filteredAttributes.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Required</TableHead>
                <TableHead>System</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading attributes...
                  </TableCell>
                </TableRow>
              ) : filteredAttributes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No attributes found
                  </TableCell>
                </TableRow>
              ) : (
                filteredAttributes.map((attribute) => {
                  const categoryConfig = getCategoryConfig(attribute.category);
                  const Icon = categoryConfig?.icon || Code;

                  return (
                    <TableRow key={attribute.id}>
                      <TableCell className="font-mono text-sm">{attribute.key}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{attribute.name}</div>
                          {attribute.description && (
                            <div className="text-sm text-muted-foreground">
                              {attribute.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${categoryConfig?.color}`} />
                          <span className="text-sm">{categoryConfig?.label}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={getTypeColor(attribute.type)}>
                          {attribute.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={attribute.isRequired ? 'default' : 'outline'}>
                          {attribute.isRequired ? 'Yes' : 'No'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={attribute.isSystem ? 'secondary' : 'outline'}>
                          {attribute.isSystem ? 'System' : 'Custom'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/dashboard/attributes/${attribute.id}/edit`);
                            }}
                            disabled={attribute.isSystem}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteDialog({ 
                                open: true, 
                                attributeId: attribute.id,
                                attributeName: attribute.name 
                              });
                            }}
                            disabled={attribute.isSystem}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => !open && setDeleteDialog({ open: false, attributeId: null, attributeName: undefined })}
        onConfirm={handleDelete}
        title="Delete Attribute"
        description={`Are you sure you want to delete the attribute "${deleteDialog.attributeName || 'this attribute'}"? This action cannot be undone and may affect policies using this attribute.`}
        confirmText="Delete Attribute"
        cancelText="Cancel"
        variant="destructive"
        loading={isDeleting}
      />
    </div>
  );
}
