import { PolicyScope, PolicyEffect } from '@saas-template/shared';

// Example: Creating a policy with resource attributes for organization scoping

// Method 1: Using the API directly
const examplePolicy = {
  name: 'Manager Access Policy',
  description: 'Allows managers to access resources in their organization',
  scope: PolicyScope.SYSTEM,
  effect: PolicyEffect.ALLOW,
  priority: 25,
  isActive: true,
  
  // Who can access
  subjects: {
    roles: ['manager']
  },
  
  // What they can access
  resources: {
    types: ['product', 'customer', 'order'],
    attributes: {
      // This ensures resources must belong to the user's organization
      organizationId: '${subject.organizationId}'
    }
  },
  
  // What actions they can perform
  actions: ['create', 'read', 'update', 'list'],
};

// Method 2: Department-specific access
const departmentPolicy = {
  name: 'Department Resource Access',
  description: 'Users can only access resources in their department',
  scope: PolicyScope.SYSTEM,
  effect: PolicyEffect.ALLOW,
  priority: 30,
  isActive: true,
  
  subjects: {
    roles: ['user', 'analyst']
  },
  
  resources: {
    types: ['report', 'dashboard', 'dataset'],
    attributes: {
      // Multiple attribute constraints
      organizationId: '${subject.organizationId}',
      departmentId: '${subject.departmentId}',
      visibility: 'department' // Static value
    }
  },
  
  actions: ['read', 'list', 'export'],
};

// Method 3: Owner-based access
const ownerPolicy = {
  name: 'Owner Access Policy',
  description: 'Users can manage their own resources',
  scope: PolicyScope.SYSTEM,
  effect: PolicyEffect.ALLOW,
  priority: 40,
  isActive: true,
  
  subjects: {
    attributes: {
      authenticated: true
    }
  },
  
  resources: {
    types: ['profile', 'preferences', 'personal_data'],
    attributes: {
      // User can only access their own resources
      ownerId: '${subject.id}'
    }
  },
  
  actions: ['*'], // Full access to own resources
};

// The system will automatically:
// 1. Replace ${subject.organizationId} with the user's actual organization ID at runtime
// 2. Replace ${subject.id} with the user's ID
// 3. Apply these constraints when evaluating permissions
// 4. Ensure users can only access resources matching ALL specified attributes

console.log('Example policies with resource attributes:');
console.log(JSON.stringify(examplePolicy, null, 2));
console.log('\nDepartment-scoped policy:');
console.log(JSON.stringify(departmentPolicy, null, 2));
console.log('\nOwner-based policy:');
console.log(JSON.stringify(ownerPolicy, null, 2));