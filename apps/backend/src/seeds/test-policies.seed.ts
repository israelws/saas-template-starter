import { DataSource } from 'typeorm';
import { Policy } from '../modules/abac/entities/policy.entity';
import { PolicyScope, PolicyEffect } from '@saas-template/shared';
import { v4 as uuidv4 } from 'uuid';

/**
 * Comprehensive test policies for validating the ABAC system
 * Including resource attribute conditions with variable substitution
 */
export async function seedTestPolicies(dataSource: DataSource) {
  const policyRepository = dataSource.getRepository(Policy);

  const testPolicies: Partial<Policy>[] = [
    // 1. Organization-scoped resource access
    {
      id: uuidv4(),
      name: 'Organization Scoped Products',
      description: 'Users can only access products from their own organization',
      scope: PolicyScope.ORGANIZATION,
      effect: PolicyEffect.ALLOW,
      priority: 50,
      isActive: true,
      actions: ['read', 'list'],
      subjects: {
        roles: ['user', 'manager', 'admin']
      },
      resources: {
        types: ['product'],
        attributes: {
          organizationId: '${subject.organizationId}'
        }
      },
      metadata: {
        resourceRules: [{
          resource: 'product',
          actions: ['read', 'list'],
          attributeConditions: [{
            id: '1',
            attribute: 'organizationId',
            operator: 'equals',
            value: '${subject.organizationId}',
            type: 'string'
          }]
        }]
      }
    },

    // 2. Department-level access control
    {
      id: uuidv4(),
      name: 'Department Reports Access',
      description: 'Users can only access reports from their department',
      scope: PolicyScope.ORGANIZATION,
      effect: PolicyEffect.ALLOW,
      priority: 55,
      isActive: true,
      actions: ['read', 'download'],
      subjects: {
        attributes: {
          departmentId: { $exists: true }
        }
      },
      resources: {
        types: ['report'],
        attributes: {
          departmentId: '${subject.departmentId}'
        }
      }
    },

    // 3. Personal resource ownership
    {
      id: uuidv4(),
      name: 'Personal Documents',
      description: 'Users have full access to their own documents',
      scope: PolicyScope.ORGANIZATION,
      effect: PolicyEffect.ALLOW,
      priority: 60,
      isActive: true,
      actions: ['*'],
      subjects: {
        users: ['*']
      },
      resources: {
        types: ['document'],
        attributes: {
          ownerId: '${subject.id}'
        }
      }
    },

    // 4. Manager access to team resources
    {
      id: uuidv4(),
      name: 'Manager Team Access',
      description: 'Managers can access resources owned by their team members',
      scope: PolicyScope.ORGANIZATION,
      effect: PolicyEffect.ALLOW,
      priority: 45,
      isActive: true,
      actions: ['read', 'update', 'approve'],
      subjects: {
        roles: ['manager'],
        attributes: {
          teamMemberIds: { $exists: true }
        }
      },
      resources: {
        types: ['order', 'transaction'],
        attributes: {
          ownerId: { $in: '${subject.teamMemberIds}' }
        }
      }
    },

    // 5. Cross-organization deny policy
    {
      id: uuidv4(),
      name: 'Cross-Organization Protection',
      description: 'Deny access to resources from other organizations',
      scope: PolicyScope.SYSTEM,
      effect: PolicyEffect.DENY,
      priority: 10,
      isActive: true,
      actions: ['*'],
      subjects: {
        users: ['*']
      },
      resources: {
        types: ['*'],
        attributes: {
          organizationId: { $ne: '${subject.organizationId}' }
        }
      }
    },

    // 6. Healthcare-specific: Therapist patient access
    {
      id: uuidv4(),
      name: 'Therapist Patient Records',
      description: 'Therapists can only access their assigned patients',
      scope: PolicyScope.ORGANIZATION,
      effect: PolicyEffect.ALLOW,
      priority: 50,
      isActive: true,
      actions: ['read', 'update', 'create'],
      subjects: {
        roles: ['therapist'],
        attributes: {
          patientIds: { $exists: true }
        }
      },
      resources: {
        types: ['patient', 'treatment', 'medical_record'],
        attributes: {
          patientId: { $in: '${subject.patientIds}' }
        }
      },
      metadata: {
        resourceRules: [{
          resource: 'patient',
          actions: ['read', 'update', 'create'],
          attributeConditions: [{
            id: '2',
            attribute: 'patientId',
            operator: 'in',
            value: '${subject.patientIds}',
            type: 'array'
          }]
        }]
      }
    },

    // 7. Time-based restriction
    {
      id: uuidv4(),
      name: 'Business Hours Only',
      description: 'Restrict sensitive operations to business hours',
      scope: PolicyScope.ORGANIZATION,
      effect: PolicyEffect.DENY,
      priority: 30,
      isActive: true,
      actions: ['delete', 'export', 'bulk_update'],
      subjects: {
        roles: ['user', 'manager']
      },
      resources: {
        types: ['customer', 'order', 'transaction']
      },
      conditions: {
        timeWindow: {
          start: '17:00',
          end: '09:00',
          timezone: 'UTC',
          daysOfWeek: [1, 2, 3, 4, 5] // Monday to Friday
        }
      }
    },

    // 8. Field-level permissions example
    {
      id: uuidv4(),
      name: 'Customer Data Protection',
      description: 'Restrict access to sensitive customer fields',
      scope: PolicyScope.ORGANIZATION,
      effect: PolicyEffect.ALLOW,
      priority: 40,
      isActive: true,
      actions: ['read'],
      subjects: {
        roles: ['user']
      },
      resources: {
        types: ['customer'],
        attributes: {
          organizationId: '${subject.organizationId}'
        }
      },
      metadata: {
        fieldPermissions: {
          customer: {
            readable: ['id', 'firstName', 'lastName', 'email', 'status'],
            denied: ['ssn', 'creditScore', 'income', 'dateOfBirth']
          }
        }
      }
    },

    // 9. Hierarchical organization access
    {
      id: uuidv4(),
      name: 'Parent Organization Access',
      description: 'Parent organization admins can access child organization resources',
      scope: PolicyScope.SYSTEM,
      effect: PolicyEffect.ALLOW,
      priority: 35,
      isActive: true,
      actions: ['read', 'list'],
      subjects: {
        roles: ['admin'],
        attributes: {
          childOrganizationIds: { $exists: true }
        }
      },
      resources: {
        types: ['*'],
        attributes: {
          organizationId: { $in: '${subject.childOrganizationIds}' }
        }
      }
    },

    // 10. Status-based access control
    {
      id: uuidv4(),
      name: 'Active Resources Only',
      description: 'Users can only access active resources',
      scope: PolicyScope.ORGANIZATION,
      effect: PolicyEffect.ALLOW,
      priority: 70,
      isActive: true,
      actions: ['read', 'update'],
      subjects: {
        roles: ['user']
      },
      resources: {
        types: ['product', 'customer'],
        attributes: {
          status: 'active',
          organizationId: '${subject.organizationId}'
        }
      }
    },

    // 11. IP-based restriction
    {
      id: uuidv4(),
      name: 'Office Network Only',
      description: 'Restrict admin actions to office network',
      scope: PolicyScope.ORGANIZATION,
      effect: PolicyEffect.DENY,
      priority: 20,
      isActive: true,
      actions: ['delete', 'bulk_update', 'export'],
      subjects: {
        roles: ['admin']
      },
      resources: {
        types: ['*']
      },
      conditions: {
        ipAddresses: ['!192.168.1.0/24', '!10.0.0.0/8']
      }
    },

    // 12. Audit log access
    {
      id: uuidv4(),
      name: 'Audit Log Access',
      description: 'Only auditors and admins can access audit logs',
      scope: PolicyScope.ORGANIZATION,
      effect: PolicyEffect.ALLOW,
      priority: 25,
      isActive: true,
      actions: ['read', 'list', 'export'],
      subjects: {
        roles: ['auditor', 'admin', 'super_admin']
      },
      resources: {
        types: ['audit_log'],
        attributes: {
          organizationId: '${subject.organizationId}'
        }
      }
    },

    // 13. Temporary elevated privileges
    {
      id: uuidv4(),
      name: 'Temporary Admin Access',
      description: 'Grant temporary admin privileges with time limit',
      scope: PolicyScope.ORGANIZATION,
      effect: PolicyEffect.ALLOW,
      priority: 15,
      isActive: true,
      actions: ['*'],
      subjects: {
        users: ['temp-admin-user-id'],
        attributes: {
          tempAdminUntil: { $gt: '${environment.timestamp}' }
        }
      },
      resources: {
        types: ['*'],
        attributes: {
          organizationId: '${subject.organizationId}'
        }
      }
    },

    // 14. Multi-condition policy
    {
      id: uuidv4(),
      name: 'Complex Multi-Condition Policy',
      description: 'Example of multiple conditions working together',
      scope: PolicyScope.ORGANIZATION,
      effect: PolicyEffect.ALLOW,
      priority: 65,
      isActive: true,
      actions: ['approve', 'reject'],
      subjects: {
        roles: ['manager'],
        attributes: {
          departmentId: { $exists: true },
          approvalLimit: { $exists: true }
        }
      },
      resources: {
        types: ['order', 'expense'],
        attributes: {
          departmentId: '${subject.departmentId}',
          amount: { $lte: '${subject.approvalLimit}' },
          status: 'pending'
        }
      }
    },

    // 15. Default deny-all policy
    {
      id: uuidv4(),
      name: 'Default Deny All',
      description: 'Deny all actions by default (lowest priority)',
      scope: PolicyScope.SYSTEM,
      effect: PolicyEffect.DENY,
      priority: 100,
      isActive: true,
      actions: ['*'],
      subjects: {
        users: ['*']
      },
      resources: {
        types: ['*']
      }
    }
  ];

  // Save all test policies
  for (const policyData of testPolicies) {
    await policyRepository.save(policyRepository.create(policyData));
  }

  console.log(`✅ Seeded ${testPolicies.length} test policies`);
}

// Export individual policies for testing
export const TEST_POLICIES = {
  ORG_SCOPED_PRODUCTS: 'Organization Scoped Products',
  DEPARTMENT_REPORTS: 'Department Reports Access',
  PERSONAL_DOCUMENTS: 'Personal Documents',
  MANAGER_TEAM_ACCESS: 'Manager Team Access',
  CROSS_ORG_PROTECTION: 'Cross-Organization Protection',
  THERAPIST_PATIENTS: 'Therapist Patient Records',
  BUSINESS_HOURS: 'Business Hours Only',
  CUSTOMER_PROTECTION: 'Customer Data Protection',
  PARENT_ORG_ACCESS: 'Parent Organization Access',
  ACTIVE_ONLY: 'Active Resources Only',
  OFFICE_NETWORK: 'Office Network Only',
  AUDIT_ACCESS: 'Audit Log Access',
  TEMP_ADMIN: 'Temporary Admin Access',
  MULTI_CONDITION: 'Complex Multi-Condition Policy',
  DEFAULT_DENY: 'Default Deny All'
};