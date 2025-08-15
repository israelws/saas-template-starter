'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { X, Plus, Shield, Eye, EyeOff, Edit, AlertCircle, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RESOURCE_FIELDS, getAllFieldsForResource, getFieldCategories, isFieldSensitive } from '@saas-template/shared';

interface FieldPermission {
  readable?: string[];
  writable?: string[];
  denied?: string[];
}

interface FieldPermissionsEditorV2Props {
  value?: Record<string, FieldPermission>;
  onChange: (value: Record<string, FieldPermission>) => void;
  availableResourceTypes?: string[];
}

export function FieldPermissionsEditorV2({
  value = {},
  onChange,
  availableResourceTypes = Object.keys(RESOURCE_FIELDS),
}: FieldPermissionsEditorV2Props) {
  const { toast } = useToast();
  const [selectedResource, setSelectedResource] = useState<string>(
    Object.keys(value)[0] || availableResourceTypes[0],
  );
  const [activeTab, setActiveTab] = useState<'readable' | 'writable' | 'denied'>('readable');
  const [fieldSelectorOpen, setFieldSelectorOpen] = useState(false);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);

  const currentPermissions = value[selectedResource] || {
    readable: [],
    writable: [],
    denied: [],
  };

  const availableFields = useMemo(() => {
    const allFields = getAllFieldsForResource(selectedResource);
    const currentFields = currentPermissions[activeTab] || [];
    // If wildcard (*) is already in the list, no fields are available
    if (currentFields.includes('*')) {
      return [];
    }
    return allFields.filter(field => !currentFields.includes(field));
  }, [selectedResource, currentPermissions, activeTab]);

  const fieldCategories = useMemo(() => {
    return getFieldCategories(selectedResource);
  }, [selectedResource]);

  const handleAddFields = () => {
    if (selectedFields.length === 0) return;

    const updatedPermissions = {
      ...value,
      [selectedResource]: {
        ...currentPermissions,
        [activeTab]: [...(currentPermissions[activeTab] || []), ...selectedFields],
      },
    };

    onChange(updatedPermissions);
    setSelectedFields([]);
    setFieldSelectorOpen(false);

    toast({
      title: 'Fields added',
      description: `Added ${selectedFields.length} field(s) to ${activeTab} list`,
    });
  };

  const handleRemoveField = (type: 'readable' | 'writable' | 'denied', field: string) => {
    const updatedPermissions = {
      ...value,
      [selectedResource]: {
        ...currentPermissions,
        [type]: (currentPermissions[type] || []).filter((f) => f !== field),
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

  const toggleFieldSelection = (field: string) => {
    setSelectedFields(prev => 
      prev.includes(field) 
        ? prev.filter(f => f !== field)
        : [...prev, field]
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
              {availableResourceTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                  {value[type] && (
                    <span className="ml-2 text-xs text-muted-foreground">(configured)</span>
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
              resourceType={selectedResource}
              onRemove={(field) => handleRemoveField('readable', field)}
            />
            <FieldSelector
              availableFields={availableFields}
              fieldCategories={fieldCategories}
              selectedFields={selectedFields}
              onToggleField={toggleFieldSelection}
              onAddFields={handleAddFields}
              onAddAll={() => handleAddAllFields('readable')}
              open={fieldSelectorOpen}
              onOpenChange={setFieldSelectorOpen}
              description="Select fields that users with this policy can view"
              resourceType={selectedResource}
            />
          </TabsContent>

          <TabsContent value="writable" className="space-y-4">
            <FieldPermissionList
              fields={currentPermissions.writable || []}
              type="writable"
              resourceType={selectedResource}
              onRemove={(field) => handleRemoveField('writable', field)}
            />
            <FieldSelector
              availableFields={availableFields}
              fieldCategories={fieldCategories}
              selectedFields={selectedFields}
              onToggleField={toggleFieldSelection}
              onAddFields={handleAddFields}
              onAddAll={() => handleAddAllFields('writable')}
              open={fieldSelectorOpen}
              onOpenChange={setFieldSelectorOpen}
              description="Select fields that users can modify"
              resourceType={selectedResource}
            />
          </TabsContent>

          <TabsContent value="denied" className="space-y-4">
            <FieldPermissionList
              fields={currentPermissions.denied || []}
              type="denied"
              resourceType={selectedResource}
              onRemove={(field) => handleRemoveField('denied', field)}
            />
            <FieldSelector
              availableFields={availableFields}
              fieldCategories={fieldCategories}
              selectedFields={selectedFields}
              onToggleField={toggleFieldSelection}
              onAddFields={handleAddFields}
              onAddAll={() => handleAddAllFields('denied')}
              open={fieldSelectorOpen}
              onOpenChange={setFieldSelectorOpen}
              description="Select fields to explicitly block (overrides other permissions)"
              resourceType={selectedResource}
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
  resourceType: string;
  onRemove: (field: string) => void;
}

function FieldPermissionList({ fields, type, resourceType, onRemove }: FieldPermissionListProps) {
  if (fields.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No fields configured for {type} access
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {fields.map((field) => (
        <Badge
          key={field}
          variant={type === 'denied' ? 'destructive' : 'secondary'}
          className={cn(
            'pr-1',
            isFieldSensitive(resourceType, field) &&
              type !== 'denied' &&
              'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
          )}
        >
          {field}
          {field === '*' && ' (all fields)'}
          {isFieldSensitive(resourceType, field) && type !== 'denied' && (
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

interface FieldSelectorProps {
  availableFields: string[];
  fieldCategories: Record<string, string[]>;
  selectedFields: string[];
  onToggleField: (field: string) => void;
  onAddFields: () => void;
  onAddAll: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  description: string;
  resourceType: string;
}

function FieldSelector({
  availableFields,
  fieldCategories,
  selectedFields,
  onToggleField,
  onAddFields,
  onAddAll,
  open,
  onOpenChange,
  description,
  resourceType,
}: FieldSelectorProps) {
  return (
    <div className="space-y-2">
      <Label>{description}</Label>
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={onOpenChange}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              {selectedFields.length > 0
                ? `Select more fields (${selectedFields.length} selected)`
                : "Select fields..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput placeholder="Search fields..." />
              <CommandEmpty>No fields found.</CommandEmpty>
              {Object.entries(fieldCategories).map(([category, categoryFields]) => {
                const availableCategoryFields = categoryFields.filter(field => 
                  availableFields.includes(field)
                );
                
                if (availableCategoryFields.length === 0) return null;
                
                return (
                  <CommandGroup key={category} heading={category.charAt(0).toUpperCase() + category.slice(1)}>
                    {availableCategoryFields.map((field) => (
                      <CommandItem
                        key={field}
                        onSelect={() => onToggleField(field)}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <Check
                              className={cn(
                                "h-4 w-4",
                                selectedFields.includes(field) ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <span>{field}</span>
                            {isFieldSensitive(resourceType, field) && (
                              <Badge variant="outline" className="text-xs">
                                Sensitive
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                );
              })}
            </Command>
          </PopoverContent>
        </Popover>
        <Button 
          onClick={onAddFields} 
          disabled={selectedFields.length === 0}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Selected
        </Button>
        <Button onClick={onAddAll} variant="outline">
          Add All (*)
        </Button>
      </div>
      {selectedFields.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium">Selected fields:</p>
          <div className="flex flex-wrap gap-1">
            {selectedFields.map((field) => (
              <Badge
                key={field}
                variant="secondary"
                className={cn(
                  "text-xs",
                  isFieldSensitive(resourceType, field) &&
                    "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                )}
              >
                {field}
                <button
                  onClick={() => onToggleField(field)}
                  className="ml-1 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Select fields from the dropdown or add all fields with the wildcard (*).
      </p>
    </div>
  );
}