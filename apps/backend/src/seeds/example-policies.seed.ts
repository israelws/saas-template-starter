import { DataSource } from 'typeorm';
import { Policy } from '../modules/abac/entities/policy.entity';
import {
  PolicyScope,
  PolicyEffect,
  PolicySubjects,
  PolicyResources,
  PolicyConditions,
} from '@saas-template/shared';

export async function seedExamplePolicies(dataSource: DataSource) {
  const policyRepository = dataSource.getRepository(Policy);

  // Clear existing policies for clean seed
  await policyRepository.query('DELETE FROM policies');

  // System-level policies
  const systemPolicies: Partial<Policy>[] = [
    {
      name: 'Super Admin Full Access',
      description: 'System-wide policy granting super admins full access to all resources',
      scope: PolicyScope.SYSTEM,
      effect: PolicyEffect.ALLOW,
      priority: 1,
      isActive: true,
      actions: ['*'],
      subjects: {
        roles: ['super_admin'],
      },
      resources: {
        types: ['*'],
      },
      conditions: {},
    },
    {
      name: 'Default Read Access',
      description: 'System-wide policy allowing all authenticated users to read their own profile',
      scope: PolicyScope.SYSTEM,
      effect: PolicyEffect.ALLOW,
      priority: 100,
      isActive: true,
      actions: ['read'],
      subjects: {
        attributes: {
          authenticated: true,
        },
      },
      resources: {
        types: ['user'],
        attributes: {
          id: '${user.id}',
        },
      },
      conditions: {},
    },
    {
      name: 'Business Hours Restriction',
      description: 'System-wide policy restricting certain actions to business hours',
      scope: PolicyScope.SYSTEM,
      effect: PolicyEffect.DENY,
      priority: 50,
      isActive: true,
      actions: ['delete', 'update'],
      subjects: {
        attributes: {
          role: {
            $ne: 'super_admin',
          },
        },
      },
      resources: {
        types: ['customer', 'order'],
      },
      conditions: {
        timeWindow: {
          start: '09:00',
          end: '17:00',
        },
      },
    },
    {
      name: 'Cross-Organization Data Protection',
      description:
        'System-wide policy preventing users from accessing data outside their organization',
      scope: PolicyScope.SYSTEM,
      effect: PolicyEffect.DENY,
      priority: 10,
      isActive: true,
      actions: ['*'],
      subjects: {
        attributes: {
          role: {
            $nin: ['super_admin', 'admin'],
          },
        },
      },
      resources: {
        types: ['*'],
        attributes: {
          organizationId: {
            $ne: '${user.organizationId}',
          },
        },
      },
      conditions: {},
    },
  ];

  // Get some organization IDs for org-specific policies
  const orgResult = await dataSource.query(
    `SELECT id, name FROM organizations WHERE type = 'company' LIMIT 2`,
  );

  if (orgResult.length > 0) {
    // Organization-specific policies
    const orgPolicies: Partial<Policy>[] = [
      {
        name: 'Organization Admin Policy',
        description: 'Policy granting admins full access within their organization',
        scope: PolicyScope.ORGANIZATION,
        organizationId: orgResult[0].id,
        effect: PolicyEffect.ALLOW,
        priority: 20,
        isActive: true,
        actions: ['*'],
        subjects: {
          roles: ['admin'],
        },
        resources: {
          types: ['*'],
          attributes: {
            organizationId: orgResult[0].id,
          },
        },
        conditions: {},
      },
      {
        name: 'Manager Product Access',
        description: 'Policy allowing managers to manage products in their organization',
        scope: PolicyScope.ORGANIZATION,
        organizationId: orgResult[0].id,
        effect: PolicyEffect.ALLOW,
        priority: 30,
        isActive: true,
        actions: ['create', 'read', 'update'],
        subjects: {
          roles: ['manager'],
        },
        resources: {
          types: ['product'],
        },
        conditions: {},
      },
    ];

    if (orgResult.length > 1) {
      orgPolicies.push({
        name: 'Customer Service Policy',
        description: 'Policy for customer service team to view orders and customers',
        scope: PolicyScope.ORGANIZATION,
        organizationId: orgResult[1].id,
        effect: PolicyEffect.ALLOW,
        priority: 40,
        isActive: true,
        actions: ['read', 'list'],
        subjects: {
          attributes: {
            department: 'customer_service',
          },
        },
        resources: {
          types: ['customer', 'order'],
        },
        conditions: {},
      });
    }

    // Save all policies
    const allPolicies = [...systemPolicies, ...orgPolicies];
    for (const policyData of allPolicies) {
      const policy = policyRepository.create(policyData);
      await policyRepository.save(policy);
    }

    console.log(`Seeded ${systemPolicies.length} system-level policies`);
    console.log(`Seeded ${orgPolicies.length} organization-specific policies`);
  } else {
    // Save only system policies if no organizations exist
    for (const policyData of systemPolicies) {
      const policy = policyRepository.create(policyData);
      await policyRepository.save(policy);
    }
    console.log(`Seeded ${systemPolicies.length} system-level policies`);
    console.log('No organizations found - skipped organization-specific policies');
  }
}
