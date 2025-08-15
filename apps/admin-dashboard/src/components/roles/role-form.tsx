'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, Search, AlertCircle, Check, X } from 'lucide-react';
import { policyAPI } from '@/lib/api';
import { Policy, PolicyEffect } from '@saas-template/shared';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface RoleFormProps {
  initialRole?: {
    id?: string;
    name?: string;
    displayName?: string;
    description?: string;
    isActive?: boolean;
    policyIds?: string[];
    metadata?: Record<string, any>;
  };
  onSave: (role: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const RoleForm: React.FC<RoleFormProps> = ({
  initialRole = {},
  onSave,
  onCancel,
  isLoading = false,
}) => {
  const { toast } = useToast();
  const [name, setName] = useState(initialRole.name || '');
  const [displayName, setDisplayName] = useState(initialRole.displayName || '');
  const [description, setDescription] = useState(initialRole.description || '');
  const [isActive, setIsActive] = useState(initialRole.isActive ?? true);
  const [selectedPolicyIds, setSelectedPolicyIds] = useState<string[]>(initialRole.policyIds || []);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [policiesLoading, setPoliciesLoading] = useState(false);
  const [policySearch, setPolicySearch] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [tempSelectedPolicyIds, setTempSelectedPolicyIds] = useState<string[]>([]);

  const loadPolicies = async () => {
    try {
      setPoliciesLoading(true);
      const response = await policyAPI.getAll();
      console.log('Policy API response:', response.data); // Debug log
      // The backend returns data in response.data.data, not response.data.items
      const policiesData = response.data.data || response.data.items || [];
      setPolicies(policiesData);
      console.log('Loaded policies:', policiesData.length); // Debug log
    } catch (error) {
      console.error('Failed to load policies:', error);
      toast({
        title: 'Error',
        description: 'Failed to load policies',
        variant: 'destructive',
      });
    } finally {
      setPoliciesLoading(false);
    }
  };

  // Load policies when component mounts if editing a role with existing policies
  useEffect(() => {
    if (initialRole.policyIds && initialRole.policyIds.length > 0) {
      loadPolicies();
    }
  }, []);

  const filteredPolicies = policies.filter(policy => {
    const searchLower = policySearch.toLowerCase();
    return (
      policy.name.toLowerCase().includes(searchLower) ||
      policy.description?.toLowerCase().includes(searchLower)
    );
  });

  const togglePolicy = (policyId: string) => {
    setTempSelectedPolicyIds(prev => 
      prev.includes(policyId) 
        ? prev.filter(id => id !== policyId)
        : [...prev, policyId]
    );
  };

  const openPolicyModal = async () => {
    setTempSelectedPolicyIds(selectedPolicyIds);
    setShowPolicyModal(true);
    if (policies.length === 0) {
      await loadPolicies();
    }
  };

  const handlePolicyModalSave = () => {
    setSelectedPolicyIds(tempSelectedPolicyIds);
    setShowPolicyModal(false);
    setPolicySearch('');
  };

  const handlePolicyModalCancel = () => {
    setShowPolicyModal(false);
    setTempSelectedPolicyIds([]);
    setPolicySearch('');
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Role name is required';
    } else if (!/^[a-z_]+$/.test(name)) {
      newErrors.name = 'Role name must be lowercase with underscores only';
    }

    if (!displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    const roleData = {
      ...initialRole,
      name,
      displayName,
      description,
      isActive,
      policyIds: selectedPolicyIds,
    };

    onSave(roleData);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Define the role name and description</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Role Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z_]/g, '_'))}
                placeholder="e.g., department_manager"
                className={errors.name ? 'border-destructive' : ''}
                disabled={!!initialRole.id}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              <p className="text-xs text-muted-foreground">
                Lowercase letters and underscores only. Cannot be changed after creation.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name *</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g., Department Manager"
                className={errors.displayName ? 'border-destructive' : ''}
              />
              {errors.displayName && <p className="text-sm text-destructive">{errors.displayName}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this role is for and what access it provides..."
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="isActive" className="text-base">
                Active Status
              </Label>
              <p className="text-sm text-muted-foreground">
                {isActive
                  ? 'Role is active and can be assigned to users'
                  : 'Role is inactive and cannot be assigned'}
              </p>
            </div>
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Policy Assignment</CardTitle>
          <CardDescription>
            Assign policies to this role. Users with this role will inherit all assigned policies.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {selectedPolicyIds.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-3">
                  {selectedPolicyIds.length} {selectedPolicyIds.length === 1 ? 'policy' : 'policies'} assigned
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedPolicyIds.map((policyId) => {
                    const policy = policies.find(p => p.id === policyId);
                    return policy ? (
                      <Badge key={policyId} variant="secondary">
                        {policy.name}
                      </Badge>
                    ) : (
                      <Badge key={policyId} variant="outline">
                        Policy ID: {policyId}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-sm text-muted-foreground">
                No policies assigned to this role
              </div>
            )}
            
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={openPolicyModal}
            >
              <Shield className="mr-2 h-4 w-4" />
              Select Policies
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? 'Saving...' : initialRole.id ? 'Update Role' : 'Create Role'}
        </Button>
      </div>

      {/* Policy Selection Modal */}
      <Dialog open={showPolicyModal} onOpenChange={setShowPolicyModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Select Policies</DialogTitle>
            <DialogDescription>
              Choose policies to assign to this role. Selected policies will grant permissions to users with this role.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by policy name or description..."
                  value={policySearch}
                  onChange={(e) => setPolicySearch(e.target.value)}
                  className="pl-9 pr-9"
                />
                {policySearch && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setPolicySearch('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {/* Show total count and search results */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Total policies: {policies.length}</span>
                {policySearch && (
                  <span className="text-primary">
                    {filteredPolicies.length} match{filteredPolicies.length !== 1 ? 'es' : ''} found
                  </span>
                )}
              </div>
            </div>

            <ScrollArea className="h-[400px] rounded-md border p-4">
                {policiesLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : policies.length === 0 ? (
                  <div className="text-center py-12">
                    <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      No policies available. Please create policies first.
                    </p>
                  </div>
                ) : (policySearch && filteredPolicies.length === 0) ? (
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      No policies found matching "{policySearch}"
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(policySearch ? filteredPolicies : policies).map((policy) => (
                    <div
                      key={policy.id}
                      className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => togglePolicy(policy.id)}
                    >
                      <Checkbox
                        checked={tempSelectedPolicyIds.includes(policy.id)}
                        onCheckedChange={() => togglePolicy(policy.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-1">
                        <div className="font-medium text-sm">{policy.name}</div>
                        {policy.description && (
                          <p className="text-sm text-muted-foreground">
                            {policy.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={policy.effect === PolicyEffect.ALLOW ? 'default' : 'destructive'} className="text-xs">
                            {policy.effect}
                          </Badge>
                          {policy.resources?.types && policy.resources.types.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {policy.resources.types.length} resource{policy.resources.types.length > 1 ? 's' : ''}
                            </Badge>
                          )}
                          {policy.actions && policy.actions.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {policy.actions.length} action{policy.actions.length > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {tempSelectedPolicyIds.length} {tempSelectedPolicyIds.length === 1 ? 'policy' : 'policies'} selected
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handlePolicyModalCancel}>
              Cancel
            </Button>
            <Button onClick={handlePolicyModalSave}>
              <Check className="mr-2 h-4 w-4" />
              Apply Selection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};