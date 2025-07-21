'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { userAPI } from '@/lib/api';
import { useAppSelector } from '@/store/hooks';
import { 
  UserPlus, 
  Shield, 
  Clock, 
  ChevronUp, 
  ChevronDown, 
  Trash2, 
  Edit,
  CalendarIcon,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface UserRole {
  id: string;
  roleName: string;
  priority: number;
  assignedAt: string;
  assignedBy: string;
  assignedByUser?: {
    name: string;
    email: string;
  };
  validFrom: string;
  validTo?: string;
  isActive: boolean;
}

interface MultiRoleManagerProps {
  userId: string;
  userName?: string;
  onRolesUpdated?: () => void;
}

const AVAILABLE_ROLES = [
  { value: 'admin', label: 'Administrator', priority: 300 },
  { value: 'manager', label: 'Manager', priority: 200 },
  { value: 'branch_manager', label: 'Branch Manager', priority: 180 },
  { value: 'agent', label: 'Agent', priority: 100 },
  { value: 'insurance_agent', label: 'Insurance Agent', priority: 100 },
  { value: 'secretary', label: 'Secretary', priority: 80 },
  { value: 'auditor', label: 'Auditor', priority: 60 },
  { value: 'customer', label: 'Customer', priority: 50 },
  { value: 'user', label: 'Basic User', priority: 10 },
];

export function MultiRoleManager({ userId, userName, onRolesUpdated }: MultiRoleManagerProps) {
  const { toast } = useToast();
  const organizationId = useAppSelector(state => state.organization.currentOrganization?.id);
  const currentUser = useAppSelector(state => state.auth.user);
  
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<UserRole | null>(null);
  
  // Add role form state
  const [selectedRole, setSelectedRole] = useState('');
  const [priority, setPriority] = useState(100);
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiryDate, setExpiryDate] = useState<Date | undefined>();

  useEffect(() => {
    if (userId && organizationId) {
      fetchUserRoles();
    }
  }, [userId, organizationId]);

  const fetchUserRoles = async () => {
    setLoading(true);
    try {
      const response = await userAPI.getUserRoles(userId, organizationId!);
      setRoles(response.data);
    } catch (error) {
      toast({
        title: 'Error fetching roles',
        description: 'Failed to load user roles',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddRole = async () => {
    if (!selectedRole || !organizationId || !currentUser) return;

    try {
      await userAPI.assignRole(userId, organizationId, {
        roleName: selectedRole,
        assignedBy: currentUser.id,
        priority,
        validTo: hasExpiry && expiryDate ? expiryDate.toISOString() : undefined,
      });

      toast({
        title: 'Role assigned',
        description: `Successfully assigned ${selectedRole} role`,
      });

      setShowAddDialog(false);
      resetForm();
      fetchUserRoles();
      onRolesUpdated?.();
    } catch (error: any) {
      toast({
        title: 'Error assigning role',
        description: error.response?.data?.message || 'Failed to assign role',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveRole = async (roleId: string, roleName: string) => {
    if (!organizationId) return;

    try {
      await userAPI.removeRole(userId, organizationId, roleName);
      
      toast({
        title: 'Role removed',
        description: `Successfully removed ${roleName} role`,
      });

      fetchUserRoles();
      onRolesUpdated?.();
    } catch (error) {
      toast({
        title: 'Error removing role',
        description: 'Failed to remove role',
        variant: 'destructive',
      });
    }
  };

  const handleUpdatePriority = async (roleId: string, roleName: string, newPriority: number) => {
    if (!organizationId) return;

    try {
      await userAPI.updateRolePriority(userId, organizationId, roleName, newPriority);
      
      toast({
        title: 'Priority updated',
        description: `Updated priority for ${roleName} role`,
      });

      fetchUserRoles();
    } catch (error) {
      toast({
        title: 'Error updating priority',
        description: 'Failed to update role priority',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setSelectedRole('');
    setPriority(100);
    setHasExpiry(false);
    setExpiryDate(undefined);
    setEditingRole(null);
  };

  const getRoleColor = (roleName: string): string => {
    const colors = {
      admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      branch_manager: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      agent: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      insurance_agent: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
      secretary: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      auditor: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      customer: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      user: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
    };
    return colors[roleName] || colors.user;
  };

  const isRoleExpired = (validTo?: string): boolean => {
    if (!validTo) return false;
    return new Date(validTo) < new Date();
  };

  const isRoleTemporary = (validTo?: string): boolean => {
    return !!validTo;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Multi-Role Management
              </CardTitle>
              <CardDescription>
                Manage multiple roles for {userName || 'this user'} with priority and validity periods
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)} size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Role
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading roles...
            </div>
          ) : roles.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No roles assigned yet</p>
              <Button onClick={() => setShowAddDialog(true)} variant="outline">
                <UserPlus className="h-4 w-4 mr-2" />
                Assign First Role
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {roles.map((role, index) => (
                <div
                  key={role.id}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-lg border',
                    isRoleExpired(role.validTo) && 'opacity-60'
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-muted-foreground">Priority</span>
                      <span className="text-2xl font-bold">{role.priority}</span>
                      <div className="flex flex-col gap-1 mt-1">
                        {index > 0 && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => handleUpdatePriority(role.id, role.roleName, role.priority + 10)}
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                        )}
                        {index < roles.length - 1 && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => handleUpdatePriority(role.id, role.roleName, role.priority - 10)}
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className={getRoleColor(role.roleName)}>
                          {AVAILABLE_ROLES.find(r => r.value === role.roleName)?.label || role.roleName}
                        </Badge>
                        {role.isActive && !isRoleExpired(role.validTo) && (
                          <Badge variant="outline" className="border-green-500 text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                        {isRoleExpired(role.validTo) && (
                          <Badge variant="outline" className="border-red-500 text-red-600">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Expired
                          </Badge>
                        )}
                        {isRoleTemporary(role.validTo) && !isRoleExpired(role.validTo) && (
                          <Badge variant="outline" className="border-orange-500 text-orange-600">
                            <Clock className="h-3 w-3 mr-1" />
                            Temporary
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        <p>
                          Assigned by {role.assignedByUser?.name || role.assignedBy} on{' '}
                          {format(new Date(role.assignedAt), 'MMM d, yyyy')}
                        </p>
                        {role.validTo && (
                          <p className={cn(
                            'flex items-center gap-1',
                            isRoleExpired(role.validTo) && 'text-red-600'
                          )}>
                            <Clock className="h-3 w-3" />
                            {isRoleExpired(role.validTo) ? 'Expired' : 'Expires'} on{' '}
                            {format(new Date(role.validTo), 'MMM d, yyyy')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingRole(role);
                        setSelectedRole(role.roleName);
                        setPriority(role.priority);
                        setHasExpiry(!!role.validTo);
                        setExpiryDate(role.validTo ? new Date(role.validTo) : undefined);
                        setShowAddDialog(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleRemoveRole(role.id, role.roleName)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Role Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? 'Edit Role' : 'Assign New Role'}
            </DialogTitle>
            <DialogDescription>
              {editingRole 
                ? 'Update the role configuration' 
                : 'Select a role and configure its priority and validity period'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole} disabled={!!editingRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_ROLES.map(role => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority ({priority})</Label>
              <Slider
                value={[priority]}
                onValueChange={(value) => setPriority(value[0])}
                min={0}
                max={500}
                step={10}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Higher priority roles take precedence in access decisions
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="expiry"
                checked={hasExpiry}
                onCheckedChange={setHasExpiry}
              />
              <Label htmlFor="expiry">Set expiration date</Label>
            </div>

            {hasExpiry && (
              <div className="space-y-2">
                <Label>Expires on</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !expiryDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {expiryDate ? format(expiryDate, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={expiryDate}
                      onSelect={setExpiryDate}
                      initialFocus
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddDialog(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleAddRole} disabled={!selectedRole}>
              {editingRole ? 'Update Role' : 'Assign Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}