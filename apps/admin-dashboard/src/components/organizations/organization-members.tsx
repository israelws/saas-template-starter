'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  Search,
  UserPlus,
  MoreVertical,
  Shield,
  Users,
  Mail,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { User } from '@saas-template/shared';

export interface OrganizationMember extends User {
  role: string;
  joinedAt: Date;
  lastActive?: Date;
  permissions?: string[];
}

interface OrganizationMembersProps {
  organizationId: string;
  members: OrganizationMember[];
  availableUsers?: User[];
  isLoading?: boolean;
  onAddMember: (userId: string, role: string) => void;
  onUpdateMemberRole: (userId: string, role: string) => void;
  onRemoveMember: (userId: string) => void;
  onInviteUser: (email: string, role: string) => void;
}

const ROLES = [
  { value: 'owner', label: 'Owner', color: 'bg-purple-100 text-purple-800' },
  { value: 'admin', label: 'Admin', color: 'bg-blue-100 text-blue-800' },
  { value: 'member', label: 'Member', color: 'bg-green-100 text-green-800' },
  { value: 'viewer', label: 'Viewer', color: 'bg-gray-100 text-gray-800' },
];

export const OrganizationMembers: React.FC<OrganizationMembersProps> = ({
  members,
  availableUsers = [],
  isLoading = false,
  onAddMember,
  onRemoveMember,
  onInviteUser,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [addUserSearch, setAddUserSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('member');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');

  // Filter members
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const matchesSearch =
        member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = roleFilter === 'all' || member.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [members, searchQuery, roleFilter]);

  // Filter available users for adding
  const filteredAvailableUsers = useMemo(() => {
    const memberIds = new Set(members.map((m) => m.id));
    return availableUsers
      .filter((user) => !memberIds.has(user.id))
      .filter(
        (user) =>
          user.email.toLowerCase().includes(addUserSearch.toLowerCase()) ||
          `${user.firstName} ${user.lastName}`.toLowerCase().includes(addUserSearch.toLowerCase()),
      );
  }, [availableUsers, members, addUserSearch]);

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedMembers(filteredMembers.map((m) => m.id));
      } else {
        setSelectedMembers([]);
      }
    },
    [filteredMembers],
  );

  const handleSelectMember = useCallback((memberId: string, checked: boolean) => {
    if (checked) {
      setSelectedMembers((prev) => [...prev, memberId]);
    } else {
      setSelectedMembers((prev) => prev.filter((id) => id !== memberId));
    }
  }, []);

  const handleAddMember = useCallback(() => {
    if (selectedUserId && selectedRole) {
      onAddMember(selectedUserId, selectedRole);
      setShowAddDialog(false);
      setSelectedUserId('');
      setSelectedRole('member');
      setAddUserSearch('');
    }
  }, [selectedUserId, selectedRole, onAddMember]);

  const handleInviteUser = useCallback(() => {
    if (inviteEmail && inviteRole) {
      onInviteUser(inviteEmail, inviteRole);
      setShowInviteDialog(false);
      setInviteEmail('');
      setInviteRole('member');
    }
  }, [inviteEmail, inviteRole, onInviteUser]);

  const getRoleColor = (role: string) => {
    const roleConfig = ROLES.find((r) => r.value === role);
    return roleConfig?.color || 'bg-gray-100 text-gray-800';
  };

  const getUserInitials = (user: OrganizationMember) => {
    const first = user.firstName?.[0] || user.email[0];
    const last = user.lastName?.[0] || '';
    return `${first}${last}`.toUpperCase();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Organization Members</h3>
          <p className="text-sm text-muted-foreground">
            Manage members and their roles in this organization
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowInviteDialog(true)}>
            <Mail className="h-4 w-4 mr-2" />
            Invite User
          </Button>
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {ROLES.map((role) => (
              <SelectItem key={role.value} value={role.value}>
                {role.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selectedMembers.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <span className="text-sm font-medium">
            {selectedMembers.length} member{selectedMembers.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Handle bulk role update
                console.log('Bulk update roles');
              }}
            >
              <Shield className="h-4 w-4 mr-2" />
              Update Role
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Handle bulk remove
                selectedMembers.forEach((id) => onRemoveMember(id));
                setSelectedMembers([]);
              }}
              className="text-destructive"
            >
              <X className="h-4 w-4 mr-2" />
              Remove
            </Button>
          </div>
        </div>
      )}

      {/* Members Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    filteredMembers.length > 0 && selectedMembers.length === filteredMembers.length
                  }
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading members...
                </TableCell>
              </TableRow>
            ) : filteredMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No members found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedMembers.includes(member.id)}
                      onCheckedChange={(checked) =>
                        handleSelectMember(member.id, checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={`https://avatar.vercel.sh/${member.email}`} />
                        <AvatarFallback>{getUserInitials(member)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {member.firstName} {member.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">{member.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={cn(getRoleColor(member.role))}>
                      {ROLES.find((r) => r.value === member.role)?.label || member.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    {member.lastActive ? (
                      <span className="text-sm text-muted-foreground">
                        {new Date(member.lastActive).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                      {member.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            // Handle role change
                            console.log('Change role for', member.id);
                          }}
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Change Role
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onRemoveMember(member.id)}
                          className="text-destructive"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Remove Member
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Member Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Member</DialogTitle>
            <DialogDescription>Add an existing user to this organization</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Search Users</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={addUserSearch}
                  onChange={(e) => setAddUserSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {addUserSearch && (
              <div className="space-y-2">
                <Label>Available Users</Label>
                <div className="border rounded-lg max-h-48 overflow-y-auto">
                  {filteredAvailableUsers.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No users found
                    </div>
                  ) : (
                    filteredAvailableUsers.map((user) => (
                      <div
                        key={user.id}
                        className={cn(
                          'flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer',
                          selectedUserId === user.id && 'bg-muted',
                        )}
                        onClick={() => setSelectedUserId(user.id)}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`https://avatar.vercel.sh/${user.email}`} />
                          <AvatarFallback>
                            {user.firstName?.[0]}
                            {user.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                        {selectedUserId === user.id && <Check className="h-4 w-4 text-primary" />}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
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
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMember} disabled={!selectedUserId || !selectedRole}>
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite User Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
            <DialogDescription>Send an invitation to join this organization</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input
                type="email"
                placeholder="user@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger>
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
            </div>
            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                An invitation email will be sent to the user with instructions to join this
                organization.
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleInviteUser} disabled={!inviteEmail || !inviteRole}>
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
