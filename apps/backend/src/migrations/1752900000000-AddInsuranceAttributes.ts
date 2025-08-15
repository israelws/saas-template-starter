import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInsuranceAttributes1752900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, find the insurance agency organization IDs
    const insuranceAgencies = await queryRunner.query(`
      SELECT id, code FROM organizations 
      WHERE type = 'insurance_agency'
      LIMIT 1
    `);

    const agencyId = insuranceAgencies[0]?.id;

    if (!agencyId) {
      console.log('No insurance agency found. Skipping insurance-specific attributes.');
      return;
    }

    // Insert insurance-specific attribute definitions
    const attributes = [
      // Agent Attributes (USER/SUBJECT category)
      {
        key: 'agent.license_type',
        name: 'Agent License Type',
        category: 'USER',
        dataType: 'ARRAY',
        description: 'Types of insurance licenses held by the agent',
        isRequired: false,
        isSystem: false,
        allowedValues: JSON.stringify([
          'life',
          'health',
          'property',
          'casualty',
          'auto',
          'disability',
          'long_term_care',
          'business',
        ]),
        organizationId: agencyId,
      },
      {
        key: 'agent.license_status',
        name: 'Agent License Status',
        category: 'USER',
        dataType: 'STRING',
        description: 'Current status of agent license',
        isRequired: false,
        isSystem: false,
        allowedValues: JSON.stringify(['active', 'inactive', 'suspended', 'expired']),
        defaultValue: 'active',
        organizationId: agencyId,
      },
      {
        key: 'agent.certifications',
        name: 'Agent Certifications',
        category: 'USER',
        dataType: 'ARRAY',
        description: 'Professional certifications held by the agent',
        isRequired: false,
        isSystem: false,
        organizationId: agencyId,
      },
      {
        key: 'agent.territory',
        name: 'Agent Territory',
        category: 'USER',
        dataType: 'STRING',
        description: 'Assigned sales territory for the agent',
        isRequired: false,
        isSystem: false,
        organizationId: agencyId,
      },
      {
        key: 'agent.commission_rate',
        name: 'Agent Commission Rate',
        category: 'USER',
        dataType: 'NUMBER',
        description: 'Commission rate percentage for the agent',
        isRequired: false,
        isSystem: false,
        defaultValue: '0',
        organizationId: agencyId,
      },
      {
        key: 'agent.specialization',
        name: 'Agent Specialization',
        category: 'USER',
        dataType: 'ARRAY',
        description: 'Areas of insurance specialization',
        isRequired: false,
        isSystem: false,
        allowedValues: JSON.stringify([
          'personal_lines',
          'commercial_lines',
          'life_health',
          'employee_benefits',
          'senior_market',
        ]),
        organizationId: agencyId,
      },

      // Branch Attributes (RESOURCE category)
      {
        key: 'branch.territory',
        name: 'Branch Territory',
        category: 'RESOURCE',
        dataType: 'STRING',
        description: 'Geographic territory covered by the branch',
        isRequired: false,
        isSystem: false,
        organizationId: agencyId,
      },
      {
        key: 'branch.type',
        name: 'Branch Type',
        category: 'RESOURCE',
        dataType: 'STRING',
        description: 'Type of insurance branch',
        isRequired: false,
        isSystem: false,
        allowedValues: JSON.stringify(['main', 'satellite', 'virtual', 'franchise']),
        defaultValue: 'satellite',
        organizationId: agencyId,
      },
      {
        key: 'branch.tier',
        name: 'Branch Service Tier',
        category: 'RESOURCE',
        dataType: 'STRING',
        description: 'Service tier level of the branch',
        isRequired: false,
        isSystem: false,
        allowedValues: JSON.stringify(['tier1', 'tier2', 'tier3', 'premium']),
        defaultValue: 'tier1',
        organizationId: agencyId,
      },
      {
        key: 'branch.service_types',
        name: 'Branch Service Types',
        category: 'RESOURCE',
        dataType: 'ARRAY',
        description: 'Types of insurance services offered at the branch',
        isRequired: false,
        isSystem: false,
        allowedValues: JSON.stringify([
          'life',
          'health',
          'property',
          'casualty',
          'auto',
          'disability',
          'long_term_care',
          'business',
        ]),
        organizationId: agencyId,
      },

      // Policy Attributes (RESOURCE category)
      {
        key: 'policy.coverage_amount',
        name: 'Policy Coverage Amount',
        category: 'RESOURCE',
        dataType: 'NUMBER',
        description: 'Coverage amount for insurance policies',
        isRequired: false,
        isSystem: false,
        organizationId: agencyId,
      },
      {
        key: 'policy.type',
        name: 'Insurance Policy Type',
        category: 'RESOURCE',
        dataType: 'STRING',
        description: 'Type of insurance policy',
        isRequired: false,
        isSystem: false,
        allowedValues: JSON.stringify([
          'life',
          'health',
          'property',
          'casualty',
          'auto',
          'disability',
          'long_term_care',
          'business',
        ]),
        organizationId: agencyId,
      },
      {
        key: 'policy.risk_level',
        name: 'Policy Risk Level',
        category: 'RESOURCE',
        dataType: 'STRING',
        description: 'Risk assessment level for the policy',
        isRequired: false,
        isSystem: false,
        allowedValues: JSON.stringify(['low', 'medium', 'high', 'very_high']),
        defaultValue: 'medium',
        organizationId: agencyId,
      },
      {
        key: 'policy.premium_amount',
        name: 'Policy Premium Amount',
        category: 'RESOURCE',
        dataType: 'NUMBER',
        description: 'Premium amount for the insurance policy',
        isRequired: false,
        isSystem: false,
        organizationId: agencyId,
      },

      // Customer Attributes (RESOURCE category)
      {
        key: 'customer.risk_profile',
        name: 'Customer Risk Profile',
        category: 'RESOURCE',
        dataType: 'STRING',
        description: 'Risk profile assessment of the customer',
        isRequired: false,
        isSystem: false,
        allowedValues: JSON.stringify(['low_risk', 'moderate_risk', 'high_risk', 'declined']),
        defaultValue: 'moderate_risk',
        organizationId: agencyId,
      },
      {
        key: 'customer.loyalty_status',
        name: 'Customer Loyalty Status',
        category: 'RESOURCE',
        dataType: 'STRING',
        description: 'Customer loyalty program status',
        isRequired: false,
        isSystem: false,
        allowedValues: JSON.stringify(['new', 'bronze', 'silver', 'gold', 'platinum']),
        defaultValue: 'new',
        organizationId: agencyId,
      },

      // Environment Attributes specific to insurance
      {
        key: 'environment.branch_hours',
        name: 'Branch Operating Hours',
        category: 'ENVIRONMENT',
        dataType: 'STRING',
        description: 'Current branch operating status',
        isRequired: false,
        isSystem: false,
        allowedValues: JSON.stringify(['open', 'closed', 'limited_hours']),
        organizationId: agencyId,
      },
      {
        key: 'environment.claim_season',
        name: 'High Claim Season',
        category: 'ENVIRONMENT',
        dataType: 'BOOLEAN',
        description: 'Whether it is currently a high claim season',
        isRequired: false,
        isSystem: false,
        defaultValue: 'false',
        organizationId: agencyId,
      },
    ];

    // Insert all attributes
    for (const attr of attributes) {
      await queryRunner.query(
        `
        INSERT INTO attribute_definitions (
          key, name, category, "dataType", description, 
          "isRequired", "isSystem", "allowedValues", "defaultValue", 
          "organizationId", "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()
        )
      `,
        [
          attr.key,
          attr.name,
          attr.category,
          attr.dataType,
          attr.description,
          attr.isRequired,
          attr.isSystem,
          attr.allowedValues,
          attr.defaultValue,
          attr.organizationId,
        ],
      );
    }

    console.log(`Created ${attributes.length} insurance-specific attribute definitions`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove insurance-specific attributes
    const insuranceAttributeKeys = [
      'agent.license_type',
      'agent.license_status',
      'agent.certifications',
      'agent.territory',
      'agent.commission_rate',
      'agent.specialization',
      'branch.territory',
      'branch.type',
      'branch.tier',
      'branch.service_types',
      'policy.coverage_amount',
      'policy.type',
      'policy.risk_level',
      'policy.premium_amount',
      'customer.risk_profile',
      'customer.loyalty_status',
      'environment.branch_hours',
      'environment.claim_season',
    ];

    await queryRunner.query(
      `
      DELETE FROM attribute_definitions 
      WHERE key IN (${insuranceAttributeKeys.map((_, i) => `$${i + 1}`).join(', ')})
    `,
      insuranceAttributeKeys,
    );
  }
}
