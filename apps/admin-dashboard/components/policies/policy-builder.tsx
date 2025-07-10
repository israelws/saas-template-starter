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
import { Plus, Trash2, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Policy, PolicyEffect } from '@saas-template/shared';

interface PolicyCondition {
  id: string;
  attribute: string;
  operator: string;
  value: string | string[] | number | boolean;
  type: 'string' | 'number' | 'boolean' | 'array';
}

interface PolicyBuilderProps {
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
  'organization:*',
  'organization:read',
  'organization:write',
  'organization:delete',
  'user:*',
  'user:read',
  'user:write',
  'user:delete',
  'policy:*',
  'policy:read',
  'policy:write',
  'policy:delete',
  'product:*',
  'product:read',
  'product:write',
  'product:delete',
  'customer:*',
  'customer:read',
  'customer:write',
  'customer:delete',
  'order:*',
  'order:read',
  'order:write',
  'order:delete',
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

export const PolicyBuilder: React.FC<PolicyBuilderProps> = ({
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
    };

    onSave(policy);
  };

  return (
    <div className="space-y-6">
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
                          <div className="flex items-center gap-2">
                            <code className="text-sm">{res}</code>
                            {res.includes('*') && (
                              <Badge variant="secondary" className="text-xs">
                                Wildcard
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {selectedResourceTypes.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedResourceTypes.map((res) => (
                      <Badge key={res} variant="secondary" className="pr-1">
                        <code className="text-xs">{res}</code>
                        <button
                          onClick={() =>
                            setSelectedResourceTypes(selectedResourceTypes.filter((r) => r !== res))
                          }
                          className="ml-1 rounded-full p-0.5 hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
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
                      .filter((act) => !selectedActions.includes(act))
                      .map((act) => (
                        <SelectItem key={act} value={act}>
                          <div className="flex items-center gap-2">
                            <code className="text-sm">{act}</code>
                            {act === '*' && (
                              <Badge variant="secondary" className="text-xs">
                                All Actions
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {selectedActions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedActions.map((act) => (
                      <Badge key={act} variant="secondary" className="pr-1">
                        <code className="text-xs">{act}</code>
                        <button
                          onClick={() =>
                            setSelectedActions(selectedActions.filter((a) => a !== act))
                          }
                          className="ml-1 rounded-full p-0.5 hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              {errors.actions && <p className="text-sm text-destructive">{errors.actions}</p>}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="effect" className="text-base">
                Policy Effect
              </Label>
              <p className="text-sm text-muted-foreground">
                {effect === PolicyEffect.ALLOW
                  ? 'Allow access when conditions are met'
                  : 'Deny access when conditions are met'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'text-sm font-medium',
                  effect === PolicyEffect.DENY && 'text-muted-foreground',
                )}
              >
                Allow
              </span>
              <Switch
                id="effect"
                checked={effect === PolicyEffect.DENY}
                onCheckedChange={(checked) =>
                  setEffect(checked ? PolicyEffect.DENY : PolicyEffect.ALLOW)
                }
              />
              <span
                className={cn(
                  'text-sm font-medium',
                  effect === PolicyEffect.ALLOW && 'text-muted-foreground',
                )}
              >
                Deny
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Conditions</CardTitle>
              <CardDescription>
                Add conditions that must be met for this policy to apply
              </CardDescription>
            </div>
            <Button onClick={addCondition} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Condition
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {conditions.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No conditions added. The policy will apply to all requests matching the resource and
                action.
              </p>
              <Button onClick={addCondition} variant="outline" size="sm" className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Add First Condition
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {conditions.map((condition, index) => (
                <PolicyConditionEditor
                  key={condition.id}
                  condition={condition}
                  index={index}
                  availableAttributes={availableAttributes}
                  onChange={(updates) => updateCondition(condition.id, updates)}
                  onRemove={() => removeCondition(condition.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          <span>Higher priority policies are evaluated first</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Policy'}
          </Button>
        </div>
      </div>
    </div>
  );
};

interface PolicyConditionEditorProps {
  condition: PolicyCondition;
  index: number;
  availableAttributes: Array<{
    key: string;
    name: string;
    type: string;
    category: 'subject' | 'resource' | 'environment';
  }>;
  onChange: (updates: Partial<PolicyCondition>) => void;
  onRemove: () => void;
}

const PolicyConditionEditor: React.FC<PolicyConditionEditorProps> = ({
  condition,
  index,
  availableAttributes,
  onChange,
  onRemove,
}) => {
  const selectedAttribute = availableAttributes.find((attr) => attr.key === condition.attribute);
  const operators = selectedAttribute
    ? OPERATORS[selectedAttribute.type as keyof typeof OPERATORS] || OPERATORS.string
    : OPERATORS.string;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'subject':
        return 'bg-blue-100 text-blue-800';
      case 'resource':
        return 'bg-green-100 text-green-800';
      case 'environment':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="rounded-lg border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-medium">Condition {index + 1}</h4>
        <Button variant="ghost" size="sm" onClick={onRemove} className="h-8 w-8 p-0">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Attribute</Label>
          <Select
            value={condition.attribute}
            onValueChange={(value) => {
              const attr = availableAttributes.find((a) => a.key === value);
              onChange({
                attribute: value,
                type: (attr?.type as PolicyCondition['type']) || 'string',
                operator: 'equals',
                value: '',
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select attribute" />
            </SelectTrigger>
            <SelectContent>
              {availableAttributes.map((attr) => (
                <SelectItem key={attr.key} value={attr.key}>
                  <div className="flex items-center gap-2">
                    <span>{attr.name}</span>
                    <Badge
                      variant="outline"
                      className={cn('text-xs', getCategoryColor(attr.category))}
                    >
                      {attr.category}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Operator</Label>
          <Select
            value={condition.operator}
            onValueChange={(value) => onChange({ operator: value })}
            disabled={!condition.attribute}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {operators.map((op) => (
                <SelectItem key={op.value} value={op.value}>
                  {op.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Value</Label>
          {selectedAttribute?.type === 'boolean' ? (
            <Select
              value={condition.value?.toString()}
              onValueChange={(value) => onChange({ value: value === 'true' })}
              disabled={!condition.attribute}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">True</SelectItem>
                <SelectItem value="false">False</SelectItem>
              </SelectContent>
            </Select>
          ) : condition.operator === 'in' || condition.operator === 'not_in' ? (
            <Input
              value={
                Array.isArray(condition.value)
                  ? condition.value.join(', ')
                  : String(condition.value)
              }
              onChange={(e) => onChange({ value: e.target.value.split(',').map((v) => v.trim()) })}
              placeholder="value1, value2, value3"
              disabled={!condition.attribute}
            />
          ) : (
            <Input
              value={String(condition.value)}
              onChange={(e) => onChange({ value: e.target.value })}
              placeholder="Enter value"
              type={selectedAttribute?.type === 'number' ? 'number' : 'text'}
              disabled={!condition.attribute}
            />
          )}
        </div>
      </div>
    </div>
  );
};
