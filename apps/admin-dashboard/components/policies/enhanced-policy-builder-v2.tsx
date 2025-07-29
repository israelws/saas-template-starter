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
import { Plus, Trash2, AlertCircle, X, Shield, Eye, Edit, ChevronDown, ChevronRight, AlertTriangle, Filter, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Policy, PolicyEffect } from '@saas-template/shared';
import { FieldPermissionsEditorV2 } from './field-permissions-editor-v2';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface PolicyCondition {
  id: string;
  attribute: string;
  operator: string;
  value: string | string[] | number | boolean;
  type: 'string' | 'number' | 'boolean' | 'array';
}

interface ResourceRule {
  resource: string;
  actions: string[];
  attributeConditions?: ResourceAttributeCondition[];
}

interface ResourceAttributeCondition {
  id: string;
  attribute: string;
  operator: string;
  value: string | string[] | number | boolean;
  type: 'string' | 'number' | 'boolean' | 'array';
}

interface EnhancedPolicyBuilderV2Props {
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

const OPERATORS: Record<string, Array<{ value: string; label: string }>> = {
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
  array: [
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Does Not Contain' },
    { value: 'in', label: 'In' },
    { value: 'not_in', label: 'Not In' },
  ],
};

const DEFAULT_RESOURCES = [
  'Organization',
  'User',
  'Product',
  'Customer',
  'Order',
  'Transaction',
  'InsurancePolicy',
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

export const EnhancedPolicyBuilderV2: React.FC<EnhancedPolicyBuilderV2Props> = ({
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
  const [effect, setEffect] = useState<PolicyEffect>(initialPolicy.effect || PolicyEffect.ALLOW);
  const [priority, setPriority] = useState(initialPolicy.priority?.toString() || '50');
  const [conditions, setConditions] = useState<PolicyCondition[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [enableFieldPermissions, setEnableFieldPermissions] = useState(false);
  const [fieldPermissions, setFieldPermissions] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState('basic');
  const [showValidationError, setShowValidationError] = useState(false);
  
  // Clear errors when user types
  const clearFieldError = (field: string) => {
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
      if (Object.keys(newErrors).length === 0) {
        setShowValidationError(false);
      }
    }
  };
  
  // New state for resource-specific rules
  const [resourceRules, setResourceRules] = useState<ResourceRule[]>(() => {
    // Initialize from existing policy if available
    if (initialPolicy.resources?.types && initialPolicy.actions) {
      // Check if we have resource-specific rules in metadata
      const metadataRules = initialPolicy.metadata?.resourceRules;
      if (metadataRules) {
        return metadataRules.map((rule: any) => ({
          resource: rule.resource,
          actions: rule.actions,
          attributeConditions: rule.attributeConditions || []
        }));
      }
      // Fallback to simple format
      return initialPolicy.resources.types.map(resource => ({
        resource,
        actions: [...initialPolicy.actions!],
        attributeConditions: []
      }));
    }
    return [];
  });

  const addResourceRule = () => {
    const availableResourcesForNew = availableResources.filter(
      res => !resourceRules.some(rule => rule.resource === res)
    );
    
    if (availableResourcesForNew.length === 0) {
      return;
    }

    setResourceRules([...resourceRules, {
      resource: availableResourcesForNew[0],
      actions: [],
      attributeConditions: []
    }]);
    
    clearFieldError('resources');
  };

  const updateResourceRule = (index: number, updates: Partial<ResourceRule>) => {
    const newRules = [...resourceRules];
    newRules[index] = { ...newRules[index], ...updates };
    setResourceRules(newRules);
  };

  const removeResourceRule = (index: number) => {
    setResourceRules(resourceRules.filter((_, i) => i !== index));
  };

  const toggleResourceAction = (resourceIndex: number, action: string) => {
    const rule = resourceRules[resourceIndex];
    const newActions = rule.actions.includes(action)
      ? rule.actions.filter(a => a !== action)
      : [...rule.actions, action];
    
    updateResourceRule(resourceIndex, { actions: newActions });
    
    // Clear actions error if all resources now have at least one action
    const allHaveActions = resourceRules.every((r, i) => 
      i === resourceIndex ? newActions.length > 0 : r.actions.length > 0
    );
    if (allHaveActions) {
      clearFieldError('actions');
    }
  };

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

  const addResourceAttributeCondition = (
    resourceIndex: number,
    template?: Partial<ResourceAttributeCondition>
  ) => {
    const newCondition: ResourceAttributeCondition = {
      id: Date.now().toString(),
      attribute: template?.attribute || '',
      operator: template?.operator || 'equals',
      value: template?.value || '',
      type: template?.type || 'string',
    };
    
    const newRules = [...resourceRules];
    if (!newRules[resourceIndex].attributeConditions) {
      newRules[resourceIndex].attributeConditions = [];
    }
    newRules[resourceIndex].attributeConditions.push(newCondition);
    setResourceRules(newRules);
  };

  const updateResourceAttributeCondition = (
    resourceIndex: number,
    conditionId: string,
    updates: Partial<ResourceAttributeCondition>
  ) => {
    const newRules = [...resourceRules];
    const rule = newRules[resourceIndex];
    if (rule.attributeConditions) {
      rule.attributeConditions = rule.attributeConditions.map(c =>
        c.id === conditionId ? { ...c, ...updates } : c
      );
    }
    setResourceRules(newRules);
  };

  const removeResourceAttributeCondition = (
    resourceIndex: number,
    conditionId: string
  ) => {
    const newRules = [...resourceRules];
    const rule = newRules[resourceIndex];
    if (rule.attributeConditions) {
      rule.attributeConditions = rule.attributeConditions.filter(c => c.id !== conditionId);
    }
    setResourceRules(newRules);
  };

  const getErrorTab = (errors: Record<string, string>): string | null => {
    if (errors.name || errors.priority) return 'basic';
    if (errors.resources || errors.actions) return 'rules';
    return null;
  };

  const validatePolicy = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!policyName.trim()) {
      newErrors.name = 'Policy name is required';
    }

    if (resourceRules.length === 0) {
      newErrors.resources = 'At least one resource rule is required';
    }

    const hasEmptyActions = resourceRules.some(rule => rule.actions.length === 0);
    if (hasEmptyActions) {
      newErrors.actions = 'Each resource must have at least one action';
    }

    const priorityNum = parseInt(priority);
    if (isNaN(priorityNum) || priorityNum < 0 || priorityNum > 100) {
      newErrors.priority = 'Priority must be between 0 and 100';
    }

    setErrors(newErrors);
    setShowValidationError(Object.keys(newErrors).length > 0);
    
    // Switch to the first tab with errors
    const errorTab = getErrorTab(newErrors);
    if (errorTab && errorTab !== activeTab) {
      setActiveTab(errorTab);
    }
    
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

    // For backward compatibility, if all resources have the same actions, 
    // we can use the simpler format
    const allActionsEqual = resourceRules.every(
      rule => JSON.stringify(rule.actions.sort()) === JSON.stringify(resourceRules[0].actions.sort())
    );

    // Build resource attributes from attribute conditions
    const resourceAttributes: Record<string, any> = {};
    const hasAttributeConditions = resourceRules.some(
      rule => rule.attributeConditions && rule.attributeConditions.length > 0
    );
    
    if (hasAttributeConditions) {
      // Merge all attribute conditions across resources
      resourceRules.forEach(rule => {
        rule.attributeConditions?.forEach(condition => {
          if (condition.attribute && condition.value) {
            resourceAttributes[condition.attribute] = {
              [condition.operator]: condition.value
            };
          }
        });
      });
    }

    const policy: Partial<Policy> = {
      ...initialPolicy,
      name: policyName,
      description,
      resources: {
        types: resourceRules.map(rule => rule.resource),
        ids: initialPolicy.resources?.ids || [],
        attributes: Object.keys(resourceAttributes).length > 0 ? resourceAttributes : undefined,
      },
      actions: allActionsEqual ? resourceRules[0].actions : resourceRules.flatMap(r => r.actions),
      effect,
      priority: parseInt(priority),
      conditions: Object.keys(customConditions).length > 0 ? policyConditions : undefined,
      isActive: true,
      subjects: initialPolicy.subjects || { users: [], groups: [], roles: [] },
      metadata: {
        ...initialPolicy.metadata,
        fieldPermissions: enableFieldPermissions ? fieldPermissions : undefined,
        // Store resource-specific rules with attribute conditions
        resourceRules: (!allActionsEqual || hasAttributeConditions) ? resourceRules : undefined,
      },
    };

    onSave(policy);
  };

  return (
    <div className="space-y-6">
      {showValidationError && Object.keys(errors).length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Validation Error</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 mt-2">
              {Object.entries(errors).map(([key, error]) => (
                <li key={key} className="text-sm">
                  {error}
                  {key === 'name' || key === 'priority' ? ' (Basic Info tab)' : ''}
                  {key === 'resources' || key === 'actions' ? ' (Policy Rules tab)' : ''}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic" className="relative">
            Basic Info
            {(errors.name || errors.priority) && (
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive" />
            )}
          </TabsTrigger>
          <TabsTrigger value="rules" className="relative">
            Policy Rules
            {(errors.resources || errors.actions) && (
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive" />
            )}
          </TabsTrigger>
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
                    onChange={(e) => {
                      setPolicyName(e.target.value);
                      clearFieldError('name');
                    }}
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
                    onChange={(e) => {
                      setPriority(e.target.value);
                      clearFieldError('priority');
                    }}
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
                Define resource-specific access rules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Effect</Label>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant={effect === PolicyEffect.ALLOW ? 'default' : 'outline'}
                    className={cn(
                      effect === PolicyEffect.ALLOW && 'bg-green-600 hover:bg-green-700',
                    )}
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

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Resource-Specific Rules</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addResourceRule}
                    disabled={resourceRules.length >= availableResources.length}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Resource
                  </Button>
                </div>

                {errors.resources && (
                  <p className="text-sm text-destructive">{errors.resources}</p>
                )}
                {errors.actions && (
                  <p className="text-sm text-destructive">{errors.actions}</p>
                )}

                <div className="space-y-4">
                  {resourceRules.map((rule, index) => (
                    <Card key={index} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Select
                              value={rule.resource}
                              onValueChange={(value) => updateResourceRule(index, { resource: value })}
                            >
                              <SelectTrigger className="w-[200px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {availableResources
                                  .filter(res => 
                                    res === rule.resource || 
                                    !resourceRules.some(r => r.resource === res)
                                  )
                                  .map((res) => (
                                    <SelectItem key={res} value={res}>
                                      <code className="text-sm">{res}</code>
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            <Badge variant="secondary">
                              {rule.actions.length} action{rule.actions.length !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeResourceRule(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Collapsible defaultOpen>
                          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium mb-2 hover:text-primary">
                            <ChevronRight className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-90" />
                            Actions
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                              {availableActions.map((action) => (
                                <label
                                  key={action}
                                  className="flex items-center space-x-2 cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={rule.actions.includes(action)}
                                    onChange={() => toggleResourceAction(index, action)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-sm">
                                    <code>{action}</code>
                                  </span>
                                </label>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                        
                        {/* Resource Attribute Conditions */}
                        <Collapsible className="mt-4">
                          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium mb-2 hover:text-primary">
                            <ChevronRight className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-90" />
                            <Filter className="h-4 w-4" />
                            Resource Attribute Conditions
                            {rule.attributeConditions && rule.attributeConditions.length > 0 && (
                              <Badge variant="secondary" className="ml-2">
                                {rule.attributeConditions.length} condition{rule.attributeConditions.length !== 1 ? 's' : ''}
                              </Badge>
                            )}
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="space-y-3 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                              <div className="flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-muted-foreground">
                                  Add conditions to limit access to specific resources based on their attributes.
                                  For example, limit access to resources owned by the user's organization.
                                </p>
                              </div>
                              
                              {/* Common Templates */}
                              <div className="flex flex-wrap gap-2">
                                <p className="text-xs font-medium text-muted-foreground w-full">Quick templates:</p>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addResourceAttributeCondition(index, {
                                    attribute: 'organizationId',
                                    operator: 'equals',
                                    value: '${subject.organizationId}',
                                    type: 'string'
                                  })}
                                  className="text-xs"
                                >
                                  <Sparkles className="h-3 w-3 mr-1" />
                                  User's Organization
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addResourceAttributeCondition(index, {
                                    attribute: 'departmentId',
                                    operator: 'equals',
                                    value: '${subject.departmentId}',
                                    type: 'string'
                                  })}
                                  className="text-xs"
                                >
                                  <Sparkles className="h-3 w-3 mr-1" />
                                  User's Department
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addResourceAttributeCondition(index, {
                                    attribute: 'ownerId',
                                    operator: 'equals',
                                    value: '${subject.id}',
                                    type: 'string'
                                  })}
                                  className="text-xs"
                                >
                                  <Sparkles className="h-3 w-3 mr-1" />
                                  Owned by User
                                </Button>
                              </div>
                              
                              {rule.attributeConditions?.map((condition) => (
                                <div key={condition.id} className="flex gap-2 items-end">
                                  <div className="flex-1">
                                    <Label className="text-xs">Attribute</Label>
                                    <Input
                                      value={condition.attribute}
                                      onChange={(e) => updateResourceAttributeCondition(index, condition.id, {
                                        attribute: e.target.value
                                      })}
                                      placeholder="e.g., organizationId"
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                  
                                  <div className="w-[140px]">
                                    <Label className="text-xs">Operator</Label>
                                    <Select
                                      value={condition.operator}
                                      onValueChange={(value) => updateResourceAttributeCondition(index, condition.id, {
                                        operator: value
                                      })}
                                    >
                                      <SelectTrigger className="h-8 text-sm">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {(OPERATORS[condition.type] || OPERATORS.string).map((op: { value: string; label: string }) => (
                                          <SelectItem key={op.value} value={op.value}>
                                            {op.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  
                                  <div className="flex-1">
                                    <Label className="text-xs">Value</Label>
                                    <Input
                                      value={condition.value as string}
                                      onChange={(e) => updateResourceAttributeCondition(index, condition.id, {
                                        value: e.target.value
                                      })}
                                      placeholder="Value or ${variable}"
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                  
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => removeResourceAttributeCondition(index, condition.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                              
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addResourceAttributeCondition(index)}
                                className="w-full"
                              >
                                <Plus className="mr-2 h-3 w-3" />
                                Add Attribute Condition
                              </Button>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {resourceRules.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">
                      No resource rules defined. Click "Add Resource" to get started.
                    </p>
                  </div>
                )}
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
                          type: (attr?.type as any) || 'string',
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
                        {(OPERATORS[condition.type] || OPERATORS.string).map((op: { value: string; label: string }) => (
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
                          <li>
                            Field permissions apply to the resource types selected in Policy Rules
                          </li>
                          <li>
                            They filter which fields users can read or write when accessing
                            resources
                          </li>
                          <li>Denied fields override readable/writable permissions</li>
                          <li>Use * to allow all fields, then deny specific sensitive fields</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <FieldPermissionsEditorV2
                    value={fieldPermissions}
                    onChange={setFieldPermissions}
                    availableResourceTypes={resourceRules.map(r => r.resource)}
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