import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInsurancePolicies1752910000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, find the insurance agency organization
    const insuranceAgencies = await queryRunner.query(`
      SELECT id, code FROM organizations 
      WHERE type = 'insurance_agency'
      LIMIT 1
    `);

    const agencyId = insuranceAgencies[0]?.id;

    if (!agencyId) {
      console.log('No insurance agency found. Skipping insurance-specific policies.');
      return;
    }

    // Create insurance-specific policies
    const policies = [
      // Agent Access Policies
      {
        name: 'Agent Customer Data Access',
        description: 'Allows agents to access customer data within their assigned territory',
        effect: 'Allow',
        priority: 70,
        resources: { types: ['Customer'] },
        actions: ['read', 'update'],
        subjects: { attributes: { 'agent.license_status': 'active' } },
        conditions: {
          matchType: 'all',
          conditions: [
            {
              attribute: 'agent.territory',
              operator: 'equals',
              value: '${resource.territory}',
            },
          ],
        },
        organizationId: agencyId,
        isActive: true,
      },
      {
        name: 'Agent Policy Creation',
        description: 'Allows licensed agents to create new insurance policies',
        effect: 'Allow',
        priority: 75,
        resources: { types: ['Policy'] },
        actions: ['create'],
        subjects: {
          attributes: {
            'agent.license_status': 'active',
            role: ['agent', 'senior_agent', 'manager'],
          },
        },
        conditions: {
          matchType: 'all',
          conditions: [
            {
              attribute: 'agent.license_type',
              operator: 'contains',
              value: '${resource.policy.type}',
            },
          ],
        },
        organizationId: agencyId,
        isActive: true,
      },
      {
        name: 'Senior Agent High-Value Policy Access',
        description: 'Allows senior agents to handle high-value policies',
        effect: 'Allow',
        priority: 80,
        resources: {
          types: ['Policy'],
          attributes: { 'policy.coverage_amount': { $gt: 500000 } },
        },
        actions: ['read', 'update', 'approve'],
        subjects: {
          attributes: {
            role: ['senior_agent', 'manager'],
            'agent.license_status': 'active',
          },
        },
        organizationId: agencyId,
        isActive: true,
      },

      // Branch Manager Policies
      {
        name: 'Branch Manager Full Access',
        description: 'Grants branch managers full access to their branch data',
        effect: 'Allow',
        priority: 85,
        resources: {
          types: ['InsuranceBranch', 'InsuranceAgent', 'Customer', 'Policy'],
        },
        actions: ['*'],
        subjects: {
          attributes: {
            role: 'manager',
            department: 'branch_management',
          },
        },
        conditions: {
          matchType: 'all',
          conditions: [
            {
              attribute: 'user.branchId',
              operator: 'equals',
              value: '${resource.branchId}',
            },
          ],
        },
        organizationId: agencyId,
        isActive: true,
      },
      {
        name: 'Branch Performance Metrics Access',
        description: 'Allows branch managers to view performance metrics',
        effect: 'Allow',
        priority: 70,
        resources: { types: ['PerformanceMetrics', 'Report'] },
        actions: ['read', 'export'],
        subjects: {
          attributes: {
            role: ['manager', 'director'],
            department: 'branch_management',
          },
        },
        organizationId: agencyId,
        isActive: true,
      },

      // Territory-based Policies
      {
        name: 'Territory-Restricted Access',
        description: 'Restricts access to resources within assigned territories',
        effect: 'Allow',
        priority: 60,
        resources: {
          types: ['Customer', 'Policy', 'Claim'],
        },
        actions: ['read', 'update'],
        subjects: {
          attributes: {
            'agent.territory': { $exists: true },
          },
        },
        conditions: {
          matchType: 'all',
          conditions: [
            {
              attribute: 'agent.territory',
              operator: 'equals',
              value: '${resource.territory}',
            },
          ],
        },
        organizationId: agencyId,
        isActive: true,
      },

      // Risk Assessment Policies
      {
        name: 'High-Risk Policy Approval',
        description: 'Requires manager approval for high-risk policies',
        effect: 'Deny',
        priority: 90,
        resources: {
          types: ['Policy'],
          attributes: { 'policy.risk_level': ['high', 'very_high'] },
        },
        actions: ['approve', 'activate'],
        subjects: {
          attributes: {
            role: 'agent',
          },
        },
        organizationId: agencyId,
        isActive: true,
      },
      {
        name: 'Risk Assessment Authority',
        description: 'Allows risk managers to assess and modify risk profiles',
        effect: 'Allow',
        priority: 85,
        resources: {
          types: ['Customer', 'Policy'],
          attributes: { 'customer.risk_profile': { $exists: true } },
        },
        actions: ['read', 'update', 'assess_risk'],
        subjects: {
          attributes: {
            role: ['risk_manager', 'director'],
            certifications: { $contains: 'risk_assessment' },
          },
        },
        organizationId: agencyId,
        isActive: true,
      },

      // Time-based Policies
      {
        name: 'Business Hours Only Access',
        description: 'Restricts certain operations to business hours',
        effect: 'Allow',
        priority: 50,
        resources: { types: ['Policy', 'Claim'] },
        actions: ['create', 'update', 'approve'],
        subjects: {
          attributes: {
            role: ['agent', 'junior_agent'],
          },
        },
        conditions: {
          matchType: 'all',
          conditions: [
            {
              attribute: 'environment.branch_hours',
              operator: 'equals',
              value: 'open',
            },
          ],
        },
        organizationId: agencyId,
        isActive: true,
      },

      // Customer Loyalty Policies
      {
        name: 'VIP Customer Access',
        description: 'Special access rules for VIP customers',
        effect: 'Allow',
        priority: 75,
        resources: {
          types: ['Customer'],
          attributes: {
            'customer.loyalty_status': ['gold', 'platinum'],
          },
        },
        actions: ['read', 'update', 'provide_discount'],
        subjects: {
          attributes: {
            role: ['agent', 'senior_agent', 'manager'],
          },
        },
        organizationId: agencyId,
        isActive: true,
      },

      // Field-level Access Policies
      {
        name: 'Agent Field Restrictions',
        description: 'Restricts access to sensitive customer fields for agents',
        effect: 'Allow',
        priority: 65,
        resources: { types: ['Customer'] },
        actions: ['read'],
        subjects: {
          attributes: {
            role: 'agent',
          },
        },
        fieldRules: [
          {
            fields: ['ssn', 'bankAccount', 'creditScore'],
            access: 'deny',
          },
          {
            fields: ['name', 'email', 'phone', 'address'],
            access: 'read',
          },
        ],
        organizationId: agencyId,
        isActive: true,
      },
      {
        name: 'Manager Full Field Access',
        description: 'Grants managers access to all customer fields',
        effect: 'Allow',
        priority: 85,
        resources: { types: ['Customer'] },
        actions: ['read', 'update'],
        subjects: {
          attributes: {
            role: ['manager', 'director'],
          },
        },
        fieldRules: [
          {
            fields: ['*'],
            access: 'write',
          },
        ],
        organizationId: agencyId,
        isActive: true,
      },

      // Compliance and Audit Policies
      {
        name: 'Compliance Officer Access',
        description: 'Grants compliance officers read access to all data for auditing',
        effect: 'Allow',
        priority: 95,
        resources: { types: ['*'] },
        actions: ['read', 'audit'],
        subjects: {
          attributes: {
            role: 'compliance_officer',
            department: 'compliance',
          },
        },
        organizationId: agencyId,
        isActive: true,
      },
    ];

    // Insert all policies
    for (const policy of policies) {
      const result = await queryRunner.query(
        `
        INSERT INTO policies (
          name, description, effect, priority, resources, 
          actions, subjects, conditions, "fieldRules", 
          "organizationId", "isActive", version, "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()
        ) RETURNING id
      `,
        [
          policy.name,
          policy.description,
          policy.effect,
          policy.priority,
          JSON.stringify(policy.resources),
          JSON.stringify(policy.actions),
          JSON.stringify(policy.subjects),
          policy.conditions ? JSON.stringify(policy.conditions) : null,
          policy.fieldRules ? JSON.stringify(policy.fieldRules) : null,
          policy.organizationId,
          policy.isActive,
          1, // version
        ],
      );

      console.log(`Created policy: ${policy.name} (ID: ${result[0].id})`);
    }

    console.log(`Created ${policies.length} insurance-specific policies`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove insurance-specific policies
    const insurancePolicyNames = [
      'Agent Customer Data Access',
      'Agent Policy Creation',
      'Senior Agent High-Value Policy Access',
      'Branch Manager Full Access',
      'Branch Performance Metrics Access',
      'Territory-Restricted Access',
      'High-Risk Policy Approval',
      'Risk Assessment Authority',
      'Business Hours Only Access',
      'VIP Customer Access',
      'Agent Field Restrictions',
      'Manager Full Field Access',
      'Compliance Officer Access',
    ];

    await queryRunner.query(
      `
      DELETE FROM policies 
      WHERE name IN (${insurancePolicyNames.map((_, i) => `$${i + 1}`).join(', ')})
    `,
      insurancePolicyNames,
    );
  }
}
