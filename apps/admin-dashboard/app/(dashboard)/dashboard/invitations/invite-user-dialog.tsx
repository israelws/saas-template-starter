'use client';

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/index';
import { useTranslation } from '@/hooks/use-translation';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Role {
  id: string;
  name: string;
  description?: string;
}

// UserRole enum from shared package
const ORGANIZATION_ROLES: Role[] = [
  { id: 'admin', name: 'Admin', description: 'Organization administrator' },
  { id: 'manager', name: 'Manager', description: 'Team manager with limited admin rights' },
  { id: 'user', name: 'User', description: 'Regular user' },
  { id: 'guest', name: 'Guest', description: 'Limited read-only access' },
];

const SYSTEM_ROLES: Role[] = [
  { id: 'super_admin', name: 'Super Admin', description: 'Full system access - Platform administrator' },
];

export function InviteUserDialog({ open, onOpenChange }: InviteUserDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const token = useSelector((state: RootState) => state.auth.token);
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const currentOrganizationId = useSelector((state: RootState) => state.auth.currentOrganizationId);
  
  const [loading, setLoading] = useState(false);
  const [isSystemLevel, setIsSystemLevel] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    roleId: 'user', // Default to regular user role
  });
  
  // Check if current user is a super admin
  const isSuperAdmin = currentUser?.metadata?.isSuperAdmin === true;
  
  // Determine available roles based on context
  const availableRoles = isSystemLevel ? SYSTEM_ROLES : ORGANIZATION_ROLES;

  useEffect(() => {
    if (open) {
      // Reset form when dialog opens
      setIsSystemLevel(false);
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        roleId: isSystemLevel ? 'super_admin' : 'user',
      });
    }
  }, [open]);
  
  useEffect(() => {
    // Update default role when switching between system/org level
    setFormData(prev => ({
      ...prev,
      roleId: isSystemLevel ? 'super_admin' : 'user',
    }));
  }, [isSystemLevel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.roleId) {
      toast({
        title: t('invitations.validationError'),
        description: t('invitations.requiredFields'),
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      
      const invitationData: any = {
        ...formData,
      };
      
      // Only add organizationId for organization-level invitations
      if (!isSystemLevel) {
        invitationData.organizationId = currentOrganizationId;
      }
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/invitations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(invitationData),
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send invitation');
      }
      
      toast({
        title: t('invitations.sendSuccess'),
        description: t('invitations.sendSuccessDescription', { email: formData.email }),
      });
      
      // Reset form
      setIsSystemLevel(false);
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        roleId: 'user',
      });
      
      onOpenChange(false);
      
      // Refresh the invitations table
      window.location.reload();
    } catch (error) {
      toast({
        title: t('invitations.sendError'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t('invitations.inviteUserTitle')}</DialogTitle>
            <DialogDescription>
              {t('invitations.inviteUserDescription')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {isSuperAdmin && (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="system-level">System Level Invitation</Label>
                  <p className="text-sm text-muted-foreground">
                    Invite a platform administrator with full system access
                  </p>
                </div>
                <Switch
                  id="system-level"
                  checked={isSystemLevel}
                  onCheckedChange={setIsSystemLevel}
                />
              </div>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="email">{t('invitations.form.email')} *</Label>
              <Input
                id="email"
                type="email"
                placeholder="john.doe@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="firstName">{t('invitations.form.firstName')}</Label>
              <Input
                id="firstName"
                placeholder="John"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="lastName">{t('invitations.form.lastName')}</Label>
              <Input
                id="lastName"
                placeholder="Doe"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="role">{t('invitations.form.role')} *</Label>
              <Select
                value={formData.roleId}
                onValueChange={(value) => setFormData({ ...formData, roleId: value })}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder={t('invitations.form.selectRole')} />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                      {role.description && (
                        <span className="text-muted-foreground text-sm">
                          {' - ' + role.description}
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {t('invitations.sendInvitation')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}