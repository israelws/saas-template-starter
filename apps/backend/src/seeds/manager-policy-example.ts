import { PolicyScope, PolicyEffect } from '@saas-template/shared';

// Example: Manager Policy that ensures organization-scoped access
export const managerPolicyExample = {
  name: 'Manager Organization Access',
  description: 'Allows managers to manage resources within their organization only',
  scope: PolicyScope.ORGANIZATION, // Organization-specific policy
  effect: PolicyEffect.ALLOW,
  priority: 25,

  // Who this policy applies to
  subjects: {
    roles: ['manager'],
  },

  // What resources they can access
  resources: {
    types: ['product', 'customer', 'order'],
    attributes: {
      // This ensures resources must belong to the user's organization
      organizationId: '${user.organizationId}',
    },
  },

  // What actions they can perform
  actions: ['create', 'read', 'update', 'list'],

  // Additional conditions (optional)
  conditions: {
    customConditions: {
      // Example: Only during business hours
      'env.time': {
        between: ['09:00', '18:00'],
      },
    },
  },
};

// The system automatically ensures:
// 1. The Cross-Organization Protection policy prevents access to other orgs
// 2. The ABAC guard validates organizationId on every request
// 3. Service queries filter by organizationId
// 4. CASL conditions include organizationId in permission checks
