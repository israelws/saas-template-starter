/**
 * Validation utilities for business logic
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface Organization {
  id: string;
  name: string;
  type: string;
  parent?: { id: string };
  children?: Organization[];
}

export interface PolicyConditions {
  [key: string]: any;
}

export interface User {
  id: string;
  memberships: Array<{
    organizationId: string;
    role: string;
    permissions: string[];
  }>;
}

export interface OrganizationTree {
  [key: string]: {
    id: string;
    name: string;
    type: string;
    parent?: string;
    children?: string[];
  };
}

/**
 * Validate organization hierarchy structure
 */
export function validateOrganizationHierarchy(organization: Organization): ValidationResult {
  const errors: string[] = [];
  const validTypes = ['company', 'division', 'department', 'team', 'region'];

  // Check organization type
  if (!validTypes.includes(organization.type)) {
    errors.push('Invalid organization type');
  }

  // Check for circular references
  const visited = new Set<string>();
  if (hasCircularReference(organization, visited)) {
    errors.push('Circular reference detected');
  }

  // Validate hierarchy depth (max 5 levels)
  const depth = calculateHierarchyDepth(organization);
  if (depth > 5) {
    errors.push('Organization hierarchy too deep (max 5 levels)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate policy conditions
 */
export function validatePolicyConditions(conditions: PolicyConditions): ValidationResult {
  const errors: string[] = [];
  const validOperators = [
    'equals', 'in', 'not_in', 'between', 'not_between', 
    'contains', 'contains_any', 'exists', 'greater_than', 
    'less_than', 'starts_with', 'ends_with', 'matches'
  ];

  for (const [attributePath, condition] of Object.entries(conditions)) {
    // Validate attribute path format
    if (!isValidAttributePath(attributePath)) {
      errors.push('Invalid attribute path format');
      continue;
    }

    // Validate condition operators
    const operators = Object.keys(condition);
    for (const operator of operators) {
      if (!validOperators.includes(operator)) {
        errors.push(`Invalid condition operator: ${operator}`);
      }

      // Validate specific operator values
      if (operator === 'between' || operator === 'not_between') {
        const range = condition[operator];
        if (!Array.isArray(range) || range.length !== 2) {
          errors.push(`Invalid ${operator} condition format`);
        } else if (attributePath.includes('time')) {
          // Validate time format for time-based conditions
          if (!isValidTimeFormat(range[0]) || !isValidTimeFormat(range[1])) {
            errors.push(`Invalid time format in ${operator} condition`);
          }
        }
      }

      if (operator === 'in' || operator === 'not_in' || operator === 'contains_any') {
        if (!Array.isArray(condition[operator])) {
          errors.push(`${operator} condition must be an array`);
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate user permissions against organization hierarchy
 */
export function validateUserPermissions(user: User, organizationTree: OrganizationTree): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const rolePermissionMap = {
    'admin': ['read', 'write', 'delete', 'manage_users', 'manage_policies'],
    'manager': ['read', 'write', 'manage_users'],
    'employee': ['read', 'write'],
    'viewer': ['read'],
    'guest': []
  };

  for (const membership of user.memberships) {
    // Check if organization exists
    if (!organizationTree[membership.organizationId]) {
      errors.push(`User has permissions for non-existent organization: ${membership.organizationId}`);
      continue;
    }

    // Validate role-permission compatibility
    const allowedPermissions = rolePermissionMap[membership.role] || [];
    const excessivePermissions = membership.permissions.filter(
      perm => !allowedPermissions.includes(perm)
    );

    if (excessivePermissions.length > 0) {
      warnings.push(`Role "${membership.role}" has excessive permissions`);
    }

    // Check for missing required permissions
    if (membership.role === 'admin' && !membership.permissions.includes('read')) {
      errors.push('Admin role missing required read permission');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Helper function to check for circular references
 */
function hasCircularReference(org: Organization, visited: Set<string>): boolean {
  if (visited.has(org.id)) {
    return true;
  }

  visited.add(org.id);

  // Check if parent creates a cycle
  if (org.parent && visited.has(org.parent.id)) {
    return true;
  }

  if (org.children) {
    for (const child of org.children) {
      const childVisited = new Set(visited);
      if (hasCircularReference(child, childVisited)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Calculate hierarchy depth
 */
function calculateHierarchyDepth(org: Organization): number {
  if (!org.children || org.children.length === 0) {
    return 1;
  }

  const childDepths = org.children.map(child => calculateHierarchyDepth(child));
  return 1 + Math.max(...childDepths);
}

/**
 * Validate attribute path format
 */
function isValidAttributePath(path: string): boolean {
  const validPrefixes = ['subject', 'resource', 'environment', 'action'];
  const parts = path.split('.');
  
  if (parts.length < 2) {
    return false;
  }

  return validPrefixes.includes(parts[0]);
}

/**
 * Validate time format (HH:MM)
 */
function isValidTimeFormat(time: string): boolean {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}