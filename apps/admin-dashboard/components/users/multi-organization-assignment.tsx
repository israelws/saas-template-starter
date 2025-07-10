'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Building2, Plus, X, Search, Shield, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Organization, User } from '@saas-template/shared';

interface UserOrganizationMembership {
  organizationId: string;
  organizationName: string;
  organizationType: string;
  role: string;
  permissions?: string[];
  joinedAt: Date;
  isActive: boolean;
}

interface MultiOrganizationAssignmentProps {
  user: User;
  currentMemberships: UserOrganizationMembership[];
  availableOrganizations: Organization[];
  onAssign: (organizationId: string, role: string) => void;
  onUpdateRole: (organizationId: string, role: string) => void;
  onRemove: (organizationId: string) => void;
  onBulkAssign: (assignments: { organizationId: string; role: string }[]) => void;
  isLoading?: boolean;
}

const ROLES = [
  { value: 'owner', label: 'Owner', color: 'bg-purple-100 text-purple-800' },
  { value: 'admin', label: 'Admin', color: 'bg-blue-100 text-blue-800' },
  { value: 'member', label: 'Member', color: 'bg-green-100 text-green-800' },
  { value: 'viewer', label: 'Viewer', color: 'bg-gray-100 text-gray-800' },
];

export const MultiOrganizationAssignment: React.FC<MultiOrganizationAssignmentProps> = ({
  user,
  currentMemberships,
  availableOrganizations,
  onUpdateRole,
  onRemove,
  onBulkAssign,
  isLoading = false,
}) => {
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrganizations, setSelectedOrganizations] = useState<
    Array<{ organizationId: string; role: string }>
  >([]);
  const [filterType, setFilterType] = useState<string>('all');

  // Filter available organizations (exclude those user is already member of)
  const filteredAvailableOrganizations = useMemo(() => {
    const membershipOrgIds = new Set(currentMemberships.map((m) => m.organizationId));

    return availableOrganizations
      .filter((org) => !membershipOrgIds.has(org.id))
      .filter((org) => {
        const matchesSearch =
          org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          org.code?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesType = filterType === 'all' || org.type === filterType;

        return matchesSearch && matchesType;
      });
  }, [availableOrganizations, currentMemberships, searchQuery, filterType]);

  // Get unique organization types
  const organizationTypes = useMemo(() => {
    const types = new Set(availableOrganizations.map((org) => org.type));
    return Array.from(types);
  }, [availableOrganizations]);

  const handleSelectOrganization = useCallback((orgId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrganizations((prev) => [...prev, { organizationId: orgId, role: 'member' }]);
    } else {
      setSelectedOrganizations((prev) => prev.filter((item) => item.organizationId !== orgId));
    }
  }, []);

  const handleRoleChange = useCallback((orgId: string, role: string) => {
    setSelectedOrganizations((prev) =>
      prev.map((item) => (item.organizationId === orgId ? { ...item, role } : item)),
    );
  }, []);

  const handleBulkAssign = useCallback(() => {
    if (selectedOrganizations.length > 0) {
      onBulkAssign(selectedOrganizations);
      setShowAssignDialog(false);
      setSelectedOrganizations([]);
      setSearchQuery('');
    }
  }, [selectedOrganizations, onBulkAssign]);

  const getRoleColor = (role: string) => {
    const roleConfig = ROLES.find((r) => r.value === role);
    return roleConfig?.color || 'bg-gray-100 text-gray-800';
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getOrganizationIcon = (_type?: string) => {
    // Could expand this to return different icons based on type
    return Building2;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Organization Memberships</h3>
          <p className="text-sm text-muted-foreground">
            Manage {user.firstName} {user.lastName}&apos;s organization assignments
          </p>
        </div>
        <Button onClick={() => setShowAssignDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Assign to Organizations
        </Button>
      </div>

      {/* Current Memberships */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Loading memberships...
          </div>
        ) : currentMemberships.length === 0 ? (
          <div className="border rounded-lg p-8 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              This user is not a member of any organizations yet.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setShowAssignDialog(true)}
            >
              Assign to Organization
            </Button>
          </div>
        ) : (
          currentMemberships.map((membership) => {
            const Icon = getOrganizationIcon(membership.organizationType);

            return (
              <div key={membership.organizationId} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-medium">{membership.organizationName}</h4>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-muted-foreground">
                          Type: {membership.organizationType}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Joined: {new Date(membership.joinedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={membership.isActive ? 'default' : 'secondary'}>
                      {membership.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between pl-11">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Role:</span>
                    <Select
                      value={membership.role}
                      onValueChange={(role) => onUpdateRole(membership.organizationId, role)}
                    >
                      <SelectTrigger className="h-8 w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            <Badge
                              variant="secondary"
                              className={cn(getRoleColor(role.value), 'text-xs')}
                            >
                              {role.label}
                            </Badge>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(membership.organizationId)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>

                {membership.permissions && membership.permissions.length > 0 && (
                  <div className="pl-11 pt-2 border-t">
                    <div className="flex items-start gap-2">
                      <span className="text-sm text-muted-foreground">Special Permissions:</span>
                      <div className="flex flex-wrap gap-1">
                        {membership.permissions.map((permission, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {permission}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Assign to Organizations Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Assign to Organizations</DialogTitle>
            <DialogDescription>
              Select organizations to assign {user.firstName} {user.lastName} to
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            {/* Search and Filter */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search organizations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {organizationTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selected Count */}
            {selectedOrganizations.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Check className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">
                  {selectedOrganizations.length} organization
                  {selectedOrganizations.length > 1 ? 's' : ''} selected
                </span>
              </div>
            )}

            {/* Organizations List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {filteredAvailableOrganizations.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No available organizations found
                </div>
              ) : (
                filteredAvailableOrganizations.map((org) => {
                  const isSelected = selectedOrganizations.some(
                    (item) => item.organizationId === org.id,
                  );
                  const selectedItem = selectedOrganizations.find(
                    (item) => item.organizationId === org.id,
                  );
                  const Icon = getOrganizationIcon(org.type);

                  return (
                    <div
                      key={org.id}
                      className={cn(
                        'border rounded-lg p-3 transition-colors',
                        isSelected && 'border-primary bg-primary/5',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) =>
                            handleSelectOrganization(org.id, checked as boolean)
                          }
                        />
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="font-medium">{org.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {org.type} • Code: {org.code}
                          </div>
                        </div>
                        {isSelected && (
                          <Select
                            value={selectedItem?.role || 'member'}
                            onValueChange={(role) => handleRoleChange(org.id, role)}
                          >
                            <SelectTrigger className="h-8 w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLES.map((role) => (
                                <SelectItem key={role.value} value={role.value}>
                                  {role.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Warning */}
            <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
              <p className="text-sm text-amber-800">
                The user will gain access to all resources within the selected organizations based
                on their assigned roles.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkAssign} disabled={selectedOrganizations.length === 0}>
              Assign to {selectedOrganizations.length} Organization
              {selectedOrganizations.length !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
