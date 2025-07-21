'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, AlertCircle, X, Shield, Eye, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Policy, PolicyEffect } from '@saas-template/shared';
import { FieldPermissionsEditor } from './field-permissions-editor';

interface PolicyCondition {
  id: string;
  attribute: string;
  operator: string;
  value: string | string[] | number | boolean;
  type: 'string' | 'number' | 'boolean' | 'array';
}

interface EnhancedPolicyBuilderProps {
  initialPolicy?: Partial<Policy>;
  onSave: (policy: Partial<Policy>) => void;
  onCancel: () => void;
  availableResources?: string[];
  availableActions?: string[];
  availableAttributes?: Array<{
    key: string;
    name: string;
    type: string;
    category: 'subject' | 'resource' | 'environment';
  }>;
  isLoading?: boolean;
}

const OPERATORS = {
  string: [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Does Not Contain' },
    { value: 'starts_with', label: 'Starts With' },
    { value: 'ends_with', label: 'Ends With' },
    { value: 'in', label: 'In List' },
    { value: 'not_in', label: 'Not In List' },
  ],
  number: [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'greater_than_or_equals', label: 'Greater Than or Equals' },
    { value: 'less_than', label: 'Less Than' },
    { value: 'less_than_or_equals', label: 'Less Than or Equals' },
    { value: 'between', label: 'Between' },
  ],
  boolean: [{ value: 'equals', label: 'Is' }],
};

const DEFAULT_RESOURCES = [
  'organization',
  'user',
  'policy',
  'product',
  'customer',
  'order',
  'transaction',
];

const DEFAULT_ACTIONS = [
  '*',
  'read',
  'write',
  'create',
  'update',
  'delete',
  'list',
  'view',
  'manage',
  'approve',
  'reject',
];

export const EnhancedPolicyBuilder: React.FC<EnhancedPolicyBuilderProps> = ({
  initialPolicy = {},
  onSave,
  onCancel,
  availableResources = DEFAULT_RESOURCES,
  availableActions = DEFAULT_ACTIONS,
  availableAttributes = [],
  isLoading = false,
}) => {
  const [policyName, setPolicyName] = useState(initialPolicy.name || '');
  const [description, setDescription] = useState(initialPolicy.description || '');
  const [selectedResourceTypes, setSelectedResourceTypes] = useState<string[]>(
    initialPolicy.resources?.types || [],
  );
  const [selectedActions, setSelectedActions] = useState<string[]>(initialPolicy.actions || []);
  const [effect, setEffect] = useState<PolicyEffect>(initialPolicy.effect || PolicyEffect.ALLOW);
  const [priority, setPriority] = useState(initialPolicy.priority?.toString() || '50');
  const [conditions, setConditions] = useState<PolicyCondition[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [enableFieldPermissions, setEnableFieldPermissions] = useState(false);
  const [fieldPermissions, setFieldPermissions] = useState<Record<string, any>>({});

  const addCondition = () => {
    const newCondition: PolicyCondition = {
      id: Date.now().toString(),
      attribute: '',
      operator: 'equals',
      value: '',
      type: 'string',
    };
    setConditions([...conditions, newCondition]);
  };

  const updateCondition = (id: string, updates: Partial<PolicyCondition>) => {
    setConditions(conditions.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const removeCondition = (id: string) => {
    setConditions(conditions.filter((c) => c.id !== id));
  };

  const validatePolicy = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!policyName.trim()) {
      newErrors.name = 'Policy name is required';
    }

    if (selectedResourceTypes.length === 0) {
      newErrors.resources = 'At least one resource type is required';
    }

    if (selectedActions.length === 0) {
      newErrors.actions = 'At least one action is required';
    }

    const priorityNum = parseInt(priority);
    if (isNaN(priorityNum) || priorityNum < 0 || priorityNum > 100) {
      newErrors.priority = 'Priority must be between 0 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validatePolicy()) {
      return;
    }

    // Convert conditions to the proper PolicyConditions format
    const customConditions: Record<string, any> = {};
    conditions.forEach((condition) => {
      if (condition.attribute && condition.value) {
        customConditions[condition.attribute] = {
          [condition.operator]: condition.value,
        };
      }
    });

    const policyConditions: any = {
      customConditions: Object.keys(customConditions).length > 0 ? customConditions : undefined,
    };

    const policy: Partial<Policy> = {
      ...initialPolicy,
      name: policyName,
      description,
      resources: {
        types: selectedResourceTypes,
        ids: initialPolicy.resources?.ids || [],
        attributes: initialPolicy.resources?.attributes || {},
      },
      actions: selectedActions,
      effect,
      priority: parseInt(priority),
      conditions: Object.keys(customConditions).length > 0 ? policyConditions : undefined,
      isActive: true,
      subjects: initialPolicy.subjects || { users: [], groups: [], roles: [] },
      metadata: {
        ...initialPolicy.metadata,
        fieldPermissions: enableFieldPermissions ? fieldPermissions : undefined,
      },
    };

    onSave(policy);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="rules">Policy Rules</TabsTrigger>
          <TabsTrigger value="conditions">Conditions</TabsTrigger>
          <TabsTrigger value="fields">Field Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Define the basic properties of your policy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Policy Name *</Label>
                  <Input
                    id="name"
                    value={policyName}
                    onChange={(e) => setPolicyName(e.target.value)}
                    placeholder="e.g., Admin Full Access"
                    className={errors.name ? 'border-destructive' : ''}
                  />
                  {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority (0-100) *</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    min="0"
                    max="100"
                    className={errors.priority ? 'border-destructive' : ''}
                  />
                  {errors.priority && <p className="text-sm text-destructive">{errors.priority}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this policy does..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Policy Rules</CardTitle>
              <CardDescription>
                Define what resources and actions this policy applies to
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="resources">Resources *</Label>
                  <div className="space-y-2">
                    <Select
                      value=""
                      onValueChange={(value) => {
                        if (!selectedResourceTypes.includes(value)) {
                          setSelectedResourceTypes([...selectedResourceTypes, value]);
                        }
                      }}
                    >
                      <SelectTrigger className={errors.resources ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select resources" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableResources
                          .filter((res) => !selectedResourceTypes.includes(res))
                          .map((res) => (
                            <SelectItem key={res} value={res}>
                              <code className="text-sm">{res}</code>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {selectedResourceTypes.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedResourceTypes.map((res) => (
                          <Badge key={res} variant="secondary">
                            {res}
                            <X
                              className="ml-1 h-3 w-3 cursor-pointer"
                              onClick={() =>
                                setSelectedResourceTypes(
                                  selectedResourceTypes.filter((r) => r !== res),
                                )
                              }
                            />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  {errors.resources && <p className="text-sm text-destructive">{errors.resources}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actions">Actions *</Label>
                  <div className="space-y-2">
                    <Select
                      value=""
                      onValueChange={(value) => {
                        if (!selectedActions.includes(value)) {
                          setSelectedActions([...selectedActions, value]);
                        }
                      }}
                    >
                      <SelectTrigger className={errors.actions ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select actions" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableActions
                          .filter((action) => !selectedActions.includes(action))
                          .map((action) => (
                            <SelectItem key={action} value={action}>
                              <code className="text-sm">{action}</code>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {selectedActions.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedActions.map((action) => (
                          <Badge key={action} variant="secondary">
                            {action}
                            <X
                              className="ml-1 h-3 w-3 cursor-pointer"
                              onClick={() =>
                                setSelectedActions(selectedActions.filter((a) => a !== action))
                              }
                            />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  {errors.actions && <p className="text-sm text-destructive">{errors.actions}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Effect</Label>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant={effect === PolicyEffect.ALLOW ? 'default' : 'outline'}
                    className={cn(effect === PolicyEffect.ALLOW && 'bg-green-600 hover:bg-green-700')}
                    onClick={() => setEffect(PolicyEffect.ALLOW)}
                  >
                    Allow
                  </Button>
                  <Button
                    type="button"
                    variant={effect === PolicyEffect.DENY ? 'default' : 'outline'}
                    className={cn(effect === PolicyEffect.DENY && 'bg-red-600 hover:bg-red-700')}
                    onClick={() => setEffect(PolicyEffect.DENY)}
                  >
                    Deny
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conditions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Policy Conditions</CardTitle>
              <CardDescription>
                Add conditions to control when this policy applies (optional)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {conditions.map((condition) => (
                <div key={condition.id} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label>Attribute</Label>
                    <Select
                      value={condition.attribute}
                      onValueChange={(value) => {
                        const attr = availableAttributes.find((a) => a.key === value);
                        updateCondition(condition.id, {
                          attribute: value,
                          type: attr?.type as any || 'string',
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select attribute" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableAttributes.map((attr) => (
                          <SelectItem key={attr.key} value={attr.key}>
                            <div>
                              <div className="font-medium">{attr.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {attr.category} · {attr.type}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1">
                    <Label>Operator</Label>
                    <Select
                      value={condition.operator}
                      onValueChange={(value) => updateCondition(condition.id, { operator: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(OPERATORS[condition.type] || OPERATORS.string).map((op) => (
                          <SelectItem key={op.value} value={op.value}>
                            {op.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1">
                    <Label>Value</Label>
                    <Input
                      value={condition.value as string}
                      onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                      placeholder="Enter value"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCondition(condition.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button type="button" variant="outline" onClick={addCondition}>
                <Plus className="mr-2 h-4 w-4" />
                Add Condition
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fields" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Field-Level Permissions</CardTitle>
              <CardDescription>
                Configure field access control for different resource types
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="enable-field-permissions"
                  checked={enableFieldPermissions}
                  onCheckedChange={setEnableFieldPermissions}
                />
                <Label htmlFor="enable-field-permissions">
                  Enable field-level permissions for this policy
                </Label>
              </div>

              {enableFieldPermissions && (
                <>
                  <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950 p-4">
                    <div className="flex gap-2 items-start">
                      <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-800 dark:text-blue-200">
                        <p className="font-medium mb-1">How field permissions work:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          <li>Field permissions apply to the resource types selected in Policy Rules</li>
                          <li>They filter which fields users can read or write when accessing resources</li>
                          <li>Denied fields override readable/writable permissions</li>
                          <li>Use * to allow all fields, then deny specific sensitive fields</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <FieldPermissionsEditor
                    value={fieldPermissions}
                    onChange={setFieldPermissions}
                    availableResourceTypes={selectedResourceTypes}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? 'Saving...' : initialPolicy.id ? 'Update Policy' : 'Create Policy'}
        </Button>
      </div>
    </div>
  );
};