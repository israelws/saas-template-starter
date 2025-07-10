// Mock types from @saas-template/shared

export interface Organization {
  id: string;
  name: string;
  type: string;
  status: string;
  parentId: string | null;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  status: string;
  attributes?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Policy {
  id: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
  effect: 'allow' | 'deny';
  conditions?: Record<string, any>;
  priority: number;
  status: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationStats {
  id: string;
  name: string;
  type: string;
  status: string;
  level: number;
  path: string;
  directChildrenCount: number;
  totalDescendantsCount: number;
  directUsersCount: number;
  totalUsersCount: number;
  directPoliciesCount: number;
  totalPoliciesCount: number;
  productsCount: number;
  customersCount: number;
  lastActivityAt: Date | null;
  healthScore: number;
}

// Mock constants
export const ORGANIZATION_TYPES = {
  COMPANY: 'company',
  DIVISION: 'division',
  DEPARTMENT: 'department',
  TEAM: 'team',
} as const;

export const POLICY_EFFECTS = {
  ALLOW: 'allow',
  DENY: 'deny',
} as const;

export const STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
} as const;
