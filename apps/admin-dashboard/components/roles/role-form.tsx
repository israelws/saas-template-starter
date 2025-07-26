'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ExternalLink } from 'lucide-react';

interface RoleFormProps {
  initialRole?: {
    id?: string;
    name?: string;
    displayName?: string;
    description?: string;
    isActive?: boolean;
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
  const [name, setName] = useState(initialRole.name || '');
  const [displayName, setDisplayName] = useState(initialRole.displayName || '');
  const [description, setDescription] = useState(initialRole.description || '');
  const [isActive, setIsActive] = useState(initialRole.isActive ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
          <CardTitle>Permissions Management</CardTitle>
          <CardDescription>
            Permissions are managed through policies, not roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="text-sm font-medium mb-2">Role-Based Access Control</p>
            <p className="text-sm text-muted-foreground mb-4">
              This role defines a job function or position. To grant permissions to this role,
              create or modify policies that apply to it.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/dashboard/policies'}
            >
              Manage Policies
            </Button>
          </div>
          
          {initialRole.id && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium">Quick Links:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <a href="/dashboard/policies/new" className="text-primary hover:underline">Create a new policy</a> for this role</li>
                <li>• <a href={`/dashboard/policies?role=${initialRole.name}`} className="text-primary hover:underline">View policies</a> that apply to this role</li>
              </ul>
            </div>
          )}
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
    </div>
  );
};