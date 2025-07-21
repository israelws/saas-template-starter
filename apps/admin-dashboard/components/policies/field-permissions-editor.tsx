'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { X, Plus, Shield, Eye, EyeOff, Edit, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FieldPermission {
  readable?: string[];
  writable?: string[];
  denied?: string[];
}

interface FieldPermissionsEditorProps {
  value?: Record<string, FieldPermission>;
  onChange: (value: Record<string, FieldPermission>) => void;
  availableResourceTypes?: string[];
}

// Common sensitive fields that should be highlighted
const SENSITIVE_FIELDS = {
  common: ['password', 'passwordHash', 'ssn', 'creditCard', 'bankAccount'],
  Customer: ['ssn', 'dateOfBirth', 'medicalHistory', 'creditScore', 'income'],
  User: ['password', 'mfaSecret', 'securityQuestions'],
  InsurancePolicy: ['profitMargin', 'internalNotes', 'commissionStructure'],
  Product: ['costPrice', 'profitMargin', 'supplierNotes'],
};

export function FieldPermissionsEditor({
  value = {},
  onChange,
  availableResourceTypes = ['Customer', 'User', 'Product', 'Order', 'InsurancePolicy'],
}: FieldPermissionsEditorProps) {
  const { toast } = useToast();
  const [selectedResource, setSelectedResource] = useState<string>(
    Object.keys(value)[0] || availableResourceTypes[0]
  );
  const [fieldInput, setFieldInput] = useState('');
  const [activeTab, setActiveTab] = useState<'readable' | 'writable' | 'denied'>('readable');

  const currentPermissions = value[selectedResource] || {
    readable: [],
    writable: [],
    denied: [],
  };

  const handleAddField = (type: 'readable' | 'writable' | 'denied') => {
    if (!fieldInput.trim()) return;

    const fields = fieldInput.split(',').map(f => f.trim()).filter(Boolean);
    
    const updatedPermissions = {
      ...value,
      [selectedResource]: {
        ...currentPermissions,
        [type]: [...(currentPermissions[type] || []), ...fields],
      },
    };

    onChange(updatedPermissions);
    setFieldInput('');
    
    toast({
      title: 'Fields added',
      description: `Added ${fields.length} field(s) to ${type} list`,
    });
  };

  const handleRemoveField = (type: 'readable' | 'writable' | 'denied', field: string) => {
    const updatedPermissions = {
      ...value,
      [selectedResource]: {
        ...currentPermissions,
        [type]: (currentPermissions[type] || []).filter(f => f !== field),
      },
    };

    onChange(updatedPermissions);
  };

  const handleAddAllFields = (type: 'readable' | 'writable' | 'denied') => {
    const updatedPermissions = {
      ...value,
      [selectedResource]: {
        ...currentPermissions,
        [type]: ['*'],
      },
    };

    onChange(updatedPermissions);
    
    toast({
      title: 'Wildcard added',
      description: `All fields are now ${type} for ${selectedResource}`,
    });
  };

  const isSensitiveField = (field: string): boolean => {
    const resourceSensitiveFields = SENSITIVE_FIELDS[selectedResource] || [];
    const allSensitiveFields = [...SENSITIVE_FIELDS.common, ...resourceSensitiveFields];
    return allSensitiveFields.some(sensitive => 
      field.toLowerCase().includes(sensitive.toLowerCase())
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Field-Level Permissions
        </CardTitle>
        <CardDescription>
          Configure which fields users can read, write, or are explicitly denied access to
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Resource Type Selector */}
        <div className="space-y-2">
          <Label>Resource Type</Label>
          <Select value={selectedResource} onValueChange={setSelectedResource}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableResourceTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {type}
                  {value[type] && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (configured)
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Field Permissions Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="readable" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Readable
              {currentPermissions.readable?.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {currentPermissions.readable.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="writable" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Writable
              {currentPermissions.writable?.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {currentPermissions.writable.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="denied" className="flex items-center gap-2">
              <EyeOff className="h-4 w-4" />
              Denied
              {currentPermissions.denied?.length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {currentPermissions.denied.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="readable" className="space-y-4">
            <FieldPermissionList
              fields={currentPermissions.readable || []}
              type="readable"
              onRemove={(field) => handleRemoveField('readable', field)}
              isSensitive={isSensitiveField}
            />
            <FieldInput
              value={fieldInput}
              onChange={setFieldInput}
              onAdd={() => handleAddField('readable')}
              onAddAll={() => handleAddAllFields('readable')}
              placeholder="Enter field names (comma-separated)"
              description="Fields that users with this policy can view in API responses"
            />
          </TabsContent>

          <TabsContent value="writable" className="space-y-4">
            <FieldPermissionList
              fields={currentPermissions.writable || []}
              type="writable"
              onRemove={(field) => handleRemoveField('writable', field)}
              isSensitive={isSensitiveField}
            />
            <FieldInput
              value={fieldInput}
              onChange={setFieldInput}
              onAdd={() => handleAddField('writable')}
              onAddAll={() => handleAddAllFields('writable')}
              placeholder="Enter field names (comma-separated)"
              description="Fields that users can include in create/update requests"
            />
          </TabsContent>

          <TabsContent value="denied" className="space-y-4">
            <FieldPermissionList
              fields={currentPermissions.denied || []}
              type="denied"
              onRemove={(field) => handleRemoveField('denied', field)}
              isSensitive={isSensitiveField}
            />
            <FieldInput
              value={fieldInput}
              onChange={setFieldInput}
              onAdd={() => handleAddField('denied')}
              onAddAll={() => handleAddAllFields('denied')}
              placeholder="Enter field names (comma-separated)"
              description="Fields explicitly blocked (overrides readable/writable)"
            />
          </TabsContent>
        </Tabs>

        {/* Info Alert */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="space-y-1 text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100">
                Field Permission Rules:
              </p>
              <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                <li><strong>Denied</strong> fields override all other permissions</li>
                <li>If <strong>readable</strong> is specified, ONLY those fields are returned</li>
                <li>Use <strong>*</strong> to allow all fields (except denied)</li>
                <li>Leave empty to use default field visibility</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface FieldPermissionListProps {
  fields: string[];
  type: 'readable' | 'writable' | 'denied';
  onRemove: (field: string) => void;
  isSensitive: (field: string) => boolean;
}

function FieldPermissionList({ fields, type, onRemove, isSensitive }: FieldPermissionListProps) {
  if (fields.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No fields configured for {type} access
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {fields.map(field => (
        <Badge
          key={field}
          variant={type === 'denied' ? 'destructive' : 'secondary'}
          className={cn(
            'pr-1',
            isSensitive(field) && type !== 'denied' && 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
          )}
        >
          {field}
          {field === '*' && ' (all fields)'}
          {isSensitive(field) && type !== 'denied' && (
            <AlertCircle className="h-3 w-3 ml-1 inline" />
          )}
          <button
            onClick={() => onRemove(field)}
            className="ml-1 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
    </div>
  );
}

interface FieldInputProps {
  value: string;
  onChange: (value: string) => void;
  onAdd: () => void;
  onAddAll: () => void;
  placeholder: string;
  description: string;
}

function FieldInput({ value, onChange, onAdd, onAddAll, placeholder, description }: FieldInputProps) {
  return (
    <div className="space-y-2">
      <Label>{description}</Label>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onAdd();
            }
          }}
        />
        <Button onClick={onAdd} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
        <Button onClick={onAddAll} variant="outline" size="sm">
          Add All (*)
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Press Enter or click Add to include fields. Use * to match all fields.
      </p>
    </div>
  );
}