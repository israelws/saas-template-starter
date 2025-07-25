import { DataSource } from 'typeorm';
import { Policy, PolicyEffect } from '../modules/abac/entities/policy.entity';
import { PolicyFieldRule, FieldPermissionType } from '../modules/abac/entities/policy-field-rule.entity';
import { Organization } from '../modules/organizations/entities/organization.entity';
import { OrganizationType } from '@saas-template/shared';

export async function seedFieldPermissionPolicies(dataSource: DataSource) {
  const policyRepository = dataSource.getRepository(Policy);
  const fieldRuleRepository = dataSource.getRepository(PolicyFieldRule);
  const organizationRepository = dataSource.getRepository(Organization);

  // Get the first organization (or create a test one)
  let organization = await organizationRepository.findOne({ where: {} });
  if (!organization) {
    organization = organizationRepository.create({
      name: 'Test Insurance Agency',
      type: OrganizationType.INSURANCE_AGENCY,
      isActive: true,
    });
    organization = await organizationRepository.save(organization);
  }

  console.log('Seeding field permission policies for organization:', organization.name);

  // 1. Insurance Agent Policy with Field Restrictions
  const agentPolicy = policyRepository.create({
    name: 'Insurance Agent - Limited Customer Data Access',
    description: 'Agents can view policies but not sensitive customer data',
    organizationId: organization.id,
    effect: PolicyEffect.ALLOW,
    priority: 100,
    subjects: {
      roles: ['agent', 'insurance_agent'],
    },
    resources: {
      types: ['Customer', 'InsurancePolicy'],
    },
    actions: ['read', 'create', 'update'],
    conditions: {
      customConditions: {
        time: {
          businessHours: true,
        },
      },
    },
    fieldPermissions: {
      Customer: {
        readable: ['id', 'name', 'email', 'phone', 'policyNumbers'],
        denied: ['ssn', 'dateOfBirth', 'medicalHistory', 'creditScore', 'income'],
      },
      InsurancePolicy: {
        readable: ['*'], // All fields except denied
        denied: ['internalNotes', 'profitMargin', 'commissionStructure'],
      },
    },
    isActive: true,
  });
  const savedAgentPolicy = await policyRepository.save(agentPolicy);

  // Add field rules for the agent policy
  const agentFieldRules = [
    {
      policyId: savedAgentPolicy.id,
      resourceType: 'Customer',
      fieldName: 'ssn',
      permission: FieldPermissionType.DENY,
    },
    {
      policyId: savedAgentPolicy.id,
      resourceType: 'Customer',
      fieldName: 'dateOfBirth',
      permission: FieldPermissionType.DENY,
    },
    {
      policyId: savedAgentPolicy.id,
      resourceType: 'Customer',
      fieldName: 'medicalHistory',
      permission: FieldPermissionType.DENY,
    },
    {
      policyId: savedAgentPolicy.id,
      resourceType: 'Customer',
      fieldName: 'creditScore',
      permission: FieldPermissionType.DENY,
    },
  ];
  await fieldRuleRepository.save(agentFieldRules);

  // 2. Manager Policy with Full Customer Access but Product Restrictions
  const managerPolicy = policyRepository.create({
    name: 'Manager - Full Customer Access',
    description: 'Managers can see all customer data but have limited product cost visibility',
    organizationId: organization.id,
    effect: PolicyEffect.ALLOW,
    priority: 200,
    subjects: {
      roles: ['manager', 'branch_manager'],
    },
    resources: {
      types: ['Customer', 'Product', 'Order', 'InsurancePolicy'],
    },
    actions: ['read', 'create', 'update', 'delete'],
    conditions: {
      customConditions: {
        approval: {
          required: true,
          approvers: ['admin', 'executive'],
        },
      },
    },
    fieldPermissions: {
      Customer: {
        readable: ['*'], // All fields
        writable: ['*'],
      },
      Product: {
        readable: ['*'],
        writable: ['name', 'description', 'price', 'category'],
        denied: ['costPrice', 'profitMargin'], // Can't see or edit cost data
      },
      Order: {
        readable: ['*'],
        writable: ['status', 'notes'],
      },
    },
    isActive: true,
  });
  const savedManagerPolicy = await policyRepository.save(managerPolicy);

  // 3. Customer Service Rep Policy
  const customerPolicy = policyRepository.create({
    name: 'Customer Service - Limited Access',
    description: 'CS reps can view and update basic customer info, view orders but not modify',
    organizationId: organization.id,
    effect: PolicyEffect.ALLOW,
    priority: 50,
    subjects: {
      roles: ['customer_service', 'secretary'],
    },
    resources: {
      types: ['Customer', 'Order', 'Product'],
    },
    actions: ['read', 'update'],
    conditions: {
      customConditions: {
        mfa: {
          required: true,
        },
        timeOfDay: {
          start: '08:00',
          end: '18:00',
        },
      },
    },
    fieldPermissions: {
      Customer: {
        readable: ['id', 'name', 'email', 'phone', 'address', 'orderHistory'],
        writable: ['phone', 'email', 'address'],
        denied: ['ssn', 'dateOfBirth', 'creditScore', 'income', 'internalNotes'],
      },
      Order: {
        readable: ['*'],
        writable: [], // Read-only
      },
      Product: {
        readable: ['id', 'name', 'description', 'price', 'availability'],
        writable: [],
        denied: ['costPrice', 'profitMargin', 'supplierInfo'],
      },
    },
    isActive: true,
  });
  const savedCustomerPolicy = await policyRepository.save(customerPolicy);

  // Add field rules for customer service policy
  const customerFieldRules = [
    {
      policyId: savedCustomerPolicy.id,
      resourceType: 'Customer',
      fieldName: 'phone',
      permission: FieldPermissionType.WRITE,
    },
    {
      policyId: savedCustomerPolicy.id,
      resourceType: 'Customer',
      fieldName: 'email',
      permission: FieldPermissionType.WRITE,
    },
    {
      policyId: savedCustomerPolicy.id,
      resourceType: 'Customer',
      fieldName: 'address',
      permission: FieldPermissionType.WRITE,
    },
  ];
  await fieldRuleRepository.save(customerFieldRules);

  // 4. Auditor Policy - Read-only access to everything
  const auditorPolicy = policyRepository.create({
    name: 'Auditor - Full Read Access',
    description: 'Auditors can read all data but cannot modify anything',
    organizationId: organization.id,
    effect: PolicyEffect.ALLOW,
    priority: 300,
    subjects: {
      roles: ['auditor'],
      groups: ['compliance_team'],
    },
    resources: {
      types: ['*'], // All resource types
    },
    actions: ['read', 'list', 'export'],
    conditions: {
      customConditions: {
        auditLog: {
          required: true,
          retentionDays: 365,
        },
      },
    },
    fieldPermissions: {
      '*': {
        readable: ['*'], // All fields on all resources
        writable: [], // No write access
      },
    },
    isActive: true,
  });
  const savedAuditorPolicy = await policyRepository.save(auditorPolicy);

  // 5. Finance Team Policy - Transaction and Financial Data
  const financePolicy = policyRepository.create({
    name: 'Finance Team - Financial Data Access',
    description: 'Finance team can manage transactions and see cost data',
    organizationId: organization.id,
    effect: PolicyEffect.ALLOW,
    priority: 150,
    subjects: {
      groups: ['finance_team'],
      attributes: {
        department: 'finance',
      },
    },
    resources: {
      types: ['Transaction', 'Order', 'Product', 'Customer'],
    },
    actions: ['read', 'create', 'update', 'approve'],
    conditions: {
      customConditions: {
        amount: {
          maxApproval: 100000,
        },
      },
    },
    fieldPermissions: {
      Transaction: {
        readable: ['*'],
        writable: ['*'],
      },
      Product: {
        readable: ['*'], // Including cost data
        writable: ['costPrice', 'profitMargin'],
      },
      Customer: {
        readable: ['id', 'name', 'creditScore', 'paymentHistory', 'balance'],
        writable: ['creditLimit'],
        denied: ['ssn', 'medicalHistory'],
      },
    },
    isActive: true,
  });
  await policyRepository.save(financePolicy);

  // 6. Multi-Role Priority Example
  const multiRolePolicy = policyRepository.create({
    name: 'Multi-Role Priority Demo',
    description: 'Demonstrates how higher priority roles override lower ones',
    organizationId: organization.id,
    effect: PolicyEffect.ALLOW,
    priority: 1000, // Highest priority
    subjects: {
      roles: ['admin', 'super_admin'],
    },
    resources: {
      types: ['*'],
    },
    actions: ['*'], // All actions
    conditions: {
      customConditions: {
        approval: {
          selfApprove: true,
        },
      },
    },
    fieldPermissions: {
      '*': {
        readable: ['*'],
        writable: ['*'],
        denied: [], // Admins have no denied fields
      },
    },
    isActive: true,
  });
  await policyRepository.save(multiRolePolicy);

  console.log('✅ Field permission policies seeded successfully');

  // Log summary
  const totalPolicies = await policyRepository.count({ where: { organizationId: organization.id } });
  const totalFieldRules = await fieldRuleRepository.count();
  
  console.log(`📊 Summary:`);
  console.log(`   - Organization: ${organization.name}`);
  console.log(`   - Total policies: ${totalPolicies}`);
  console.log(`   - Total field rules: ${totalFieldRules}`);
}