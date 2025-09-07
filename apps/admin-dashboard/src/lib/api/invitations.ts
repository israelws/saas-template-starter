import { apiClient } from '../api-client';

export interface CreateInvitationDto {
  email: string;
  firstName?: string;
  lastName?: string;
  organizationId?: string;
  roleId: string;
  metadata?: Record<string, any>;
}

export interface Invitation {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  organizationId?: string;
  organization?: {
    id: string;
    name: string;
    code: string;
  };
  invitedById: string;
  invitedBy?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  roleId: string;
  token: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
  expiresAt: Date;
  acceptedAt?: Date;
  acceptedUserId?: string;
  resendCount: number;
  lastResentAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvitationStatistics {
  total: number;
  pending: number;
  accepted: number;
  expired: number;
  revoked: number;
  acceptanceRate: number;
  averageAcceptanceTime?: number;
}

export interface ValidateInvitationDto {
  token: string;
}

export interface AcceptInvitationDto {
  token: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export const invitationAPI = {
  // Create a new invitation
  async create(data: CreateInvitationDto): Promise<Invitation> {
    const response = await apiClient.post('/invitations', data);
    return response.data;
  },

  // Get all invitations (optionally filtered by organization)
  async getAll(organizationId?: string): Promise<Invitation[]> {
    const params = organizationId ? { organizationId } : {};
    const response = await apiClient.get('/invitations', { params });
    return response.data;
  },

  // Get invitation statistics
  async getStatistics(organizationId?: string): Promise<InvitationStatistics> {
    const params = organizationId ? { organizationId } : {};
    const response = await apiClient.get('/invitations/statistics', { params });
    return response.data;
  },

  // Get a specific invitation by ID
  async getOne(id: string): Promise<Invitation> {
    const response = await apiClient.get(`/invitations/${id}`);
    return response.data;
  },

  // Validate an invitation token
  async validate(token: string): Promise<{
    valid: boolean;
    invitation?: {
      email: string;
      firstName?: string;
      lastName?: string;
      organizationName?: string;
      expiresAt: Date;
      roleId: string;
    };
    reason?: string;
  }> {
    const response = await apiClient.post('/invitations/validate', { token });
    return response.data;
  },

  // Accept an invitation and create account
  async accept(data: AcceptInvitationDto): Promise<{
    user: any;
    organization: any;
  }> {
    const response = await apiClient.post('/invitations/accept', data);
    return response.data;
  },

  // Resend an invitation email
  async resend(id: string): Promise<Invitation> {
    const response = await apiClient.post(`/invitations/${id}/resend`);
    return response.data;
  },

  // Revoke an invitation
  async revoke(id: string): Promise<Invitation> {
    const response = await apiClient.delete(`/invitations/${id}`);
    return response.data;
  },

  // Manually trigger invitation cleanup
  async cleanup(): Promise<{ expired: number; deleted: number }> {
    const response = await apiClient.post('/invitations/cleanup');
    return response.data;
  },
};

// Helper functions for invitation management
export function getInvitationStatusColor(status: Invitation['status']): string {
  const colors: Record<Invitation['status'], string> = {
    PENDING: 'yellow',
    ACCEPTED: 'green',
    EXPIRED: 'gray',
    REVOKED: 'red',
  };
  return colors[status] || 'gray';
}

export function getInvitationStatusDisplay(status: Invitation['status']): string {
  const displays: Record<Invitation['status'], string> = {
    PENDING: 'Pending',
    ACCEPTED: 'Accepted',
    EXPIRED: 'Expired',
    REVOKED: 'Revoked',
  };
  return displays[status] || status;
}

export function isInvitationActive(invitation: Invitation): boolean {
  return invitation.status === 'PENDING' && new Date(invitation.expiresAt) > new Date();
}

export function canResendInvitation(invitation: Invitation): boolean {
  return invitation.status === 'PENDING' && invitation.resendCount < 5;
}

export function formatExpiryTime(expiresAt: Date): string {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry.getTime() - now.getTime();

  if (diff < 0) {
    return 'Expired';
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} remaining`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
  } else {
    const minutes = Math.floor(diff / (1000 * 60));
    return `${minutes} minute${minutes > 1 ? 's' : ''} remaining`;
  }
}