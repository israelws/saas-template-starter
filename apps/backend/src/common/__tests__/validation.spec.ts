import {
  validateOrganizationHierarchy,
  validatePolicyConditions,
  validateUserPermissions,
} from '../validation';

describe('Validation Utils', () => {
  describe('validateOrganizationHierarchy', () => {
    it('should validate proper hierarchy structure', () => {
      const organization = {
        id: 'org-1',
        name: 'Parent Org',
        type: 'company',
        children: [
          {
            id: 'org-2',
            name: 'Child Org',
            type: 'division',
          },
        ],
      };

      const result = validateOrganizationHierarchy(organization);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect circular references', () => {
      const organization = {
        id: 'org-1',
        name: 'Parent Org',
        type: 'company',
        parent: { id: 'org-2' },
        children: [
          {
            id: 'org-2',
            name: 'Child Org',
            type: 'division',
            parent: { id: 'org-1' },
          },
        ],
      };

      const result = validateOrganizationHierarchy(organization);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Circular reference detected');
    });

    it('should validate organization types', () => {
      const organization = {
        id: 'org-1',
        name: 'Invalid Org',
        type: 'invalid_type',
        children: [],
      };

      const result = validateOrganizationHierarchy(organization);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid organization type');
    });
  });

  describe('validatePolicyConditions', () => {
    it('should validate correct policy conditions', () => {
      const conditions = {
        'subject.attributes.role': { equals: 'admin' },
        'resource.attributes.classification': { in: ['public', 'internal'] },
        'environment.attributes.time': { between: ['09:00', '17:00'] },
      };

      const result = validatePolicyConditions(conditions);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid condition operators', () => {
      const conditions = {
        'subject.attributes.role': { invalid_operator: 'admin' },
      };

      const result = validatePolicyConditions(conditions);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid condition operator: invalid_operator');
    });

    it('should validate attribute path format', () => {
      const conditions = {
        invalid_path: { equals: 'value' },
      };

      const result = validatePolicyConditions(conditions);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid attribute path format');
    });

    it('should validate time range conditions', () => {
      const conditions = {
        'environment.attributes.time': { between: ['25:00', '17:00'] },
      };

      const result = validatePolicyConditions(conditions);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid time format in between condition');
    });
  });

  describe('validateUserPermissions', () => {
    it('should validate user permissions against organization hierarchy', () => {
      const user = {
        id: 'user-1',
        memberships: [
          {
            organizationId: 'org-1',
            role: 'admin',
            permissions: ['read', 'write', 'delete'],
          },
        ],
      };

      const organizationTree = {
        'org-1': {
          id: 'org-1',
          name: 'Root Org',
          type: 'company',
          children: ['org-2'],
        },
        'org-2': {
          id: 'org-2',
          name: 'Child Org',
          type: 'division',
          parent: 'org-1',
        },
      };

      const result = validateUserPermissions(user, organizationTree);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should detect orphaned permissions', () => {
      const user = {
        id: 'user-1',
        memberships: [
          {
            organizationId: 'non-existent-org',
            role: 'admin',
            permissions: ['read', 'write'],
          },
        ],
      };

      const organizationTree = {
        'org-1': {
          id: 'org-1',
          name: 'Root Org',
          type: 'company',
        },
      };

      const result = validateUserPermissions(user, organizationTree);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'User has permissions for non-existent organization: non-existent-org',
      );
    });

    it('should validate role-permission compatibility', () => {
      const user = {
        id: 'user-1',
        memberships: [
          {
            organizationId: 'org-1',
            role: 'viewer',
            permissions: ['read', 'write', 'delete'], // Too many permissions for viewer role
          },
        ],
      };

      const organizationTree = {
        'org-1': {
          id: 'org-1',
          name: 'Root Org',
          type: 'company',
        },
      };

      const result = validateUserPermissions(user, organizationTree);
      expect(result.warnings).toContain('Role "viewer" has excessive permissions');
    });
  });
});
