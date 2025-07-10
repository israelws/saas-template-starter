'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  OrganizationMembers,
  OrganizationMember,
} from '@/components/organizations/organization-members';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { User } from '@saas-template/shared';

export default function OrganizationMembersPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const organizationId = params.id as string;

  const [organization, setOrganization] = useState<any>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrganizationAndMembers = useCallback(async () => {
    try {
      setIsLoading(true);

      // Fetch organization details
      const orgResponse = await api.get(`/organizations/${organizationId}`);
      setOrganization(orgResponse.data);

      // Fetch organization members
      const membersResponse = await api.get(`/organizations/${organizationId}/members`);
      setMembers(membersResponse.data);
    } catch (error) {
      console.error('Error fetching organization data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch organization members',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, toast]);

  const fetchAvailableUsers = useCallback(async () => {
    try {
      // Fetch all users that can be added to the organization
      const response = await api.get('/users');
      setAvailableUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching available users:', error);
    }
  }, []);

  useEffect(() => {
    fetchOrganizationAndMembers();
    fetchAvailableUsers();
  }, [fetchOrganizationAndMembers, fetchAvailableUsers]);

  const handleAddMember = async (userId: string, role: string) => {
    try {
      await api.post(`/organizations/${organizationId}/members`, {
        userId,
        role,
      });

      toast({
        title: 'Success',
        description: 'Member added successfully',
      });

      // Refresh members list
      fetchOrganizationAndMembers();
    } catch (error) {
      console.error('Error adding member:', error);
      toast({
        title: 'Error',
        description: 'Failed to add member',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateMemberRole = async (userId: string, role: string) => {
    try {
      await api.put(`/organizations/${organizationId}/members/${userId}`, {
        role,
      });

      toast({
        title: 'Success',
        description: 'Member role updated successfully',
      });

      // Update local state
      setMembers((prev) =>
        prev.map((member) => (member.id === userId ? { ...member, role } : member)),
      );
    } catch (error) {
      console.error('Error updating member role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update member role',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await api.delete(`/organizations/${organizationId}/members/${userId}`);

      toast({
        title: 'Success',
        description: 'Member removed successfully',
      });

      // Update local state
      setMembers((prev) => prev.filter((member) => member.id !== userId));
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove member',
        variant: 'destructive',
      });
    }
  };

  const handleInviteUser = async (email: string, role: string) => {
    try {
      await api.post(`/organizations/${organizationId}/invitations`, {
        email,
        role,
      });

      toast({
        title: 'Success',
        description: `Invitation sent to ${email}`,
      });
    } catch (error) {
      console.error('Error inviting user:', error);
      toast({
        title: 'Error',
        description: 'Failed to send invitation',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/dashboard/organizations/${organizationId}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{organization?.name || 'Organization'} Members</h1>
          <p className="text-sm text-muted-foreground">Manage members and their permissions</p>
        </div>
      </div>

      {/* Members Management */}
      <OrganizationMembers
        organizationId={organizationId}
        members={members}
        availableUsers={availableUsers}
        isLoading={isLoading}
        onAddMember={handleAddMember}
        onUpdateMemberRole={handleUpdateMemberRole}
        onRemoveMember={handleRemoveMember}
        onInviteUser={handleInviteUser}
      />
    </div>
  );
}
