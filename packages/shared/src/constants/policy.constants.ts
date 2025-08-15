export const DEFAULT_POLICY_PRIORITY = 100;

export const SYSTEM_ACTIONS = ['create', 'read', 'update', 'delete', 'list', 'manage'] as const;

export const RESOURCE_TYPES = [
  'organization',
  'user',
  'policy',
  'product',
  'customer',
  'order',
  'transaction',
] as const;

export const SYSTEM_ATTRIBUTES = {
  USER: ['user.id', 'user.email', 'user.role', 'user.organizationId', 'user.department'],
  RESOURCE: ['resource.type', 'resource.id', 'resource.organizationId', 'resource.ownerId'],
  ENVIRONMENT: ['env.time', 'env.date', 'env.dayOfWeek', 'env.ipAddress', 'env.location'],
} as const;

export const POLICY_EVALUATION_CACHE_TTL = 300; // 5 minutes in seconds
