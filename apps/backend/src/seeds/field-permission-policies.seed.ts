import { DataSource } from 'typeorm';
import { Policy } from '../modules/abac/entities/policy.entity';
import { PolicyFieldRule, FieldPermissionType } from '../modules/abac/entities/policy-field-rule.entity';
import { Organization } from '../modules/organizations/entities/organization.entity';

export async function seedFieldPermissionPolicies(dataSource: DataSource) {
  const policyRepository = dataSource.getRepository(Policy);
  const fieldRuleRepository = dataSource.getRepository(PolicyFieldRule);
  const organizationRepository = dataSource.getRepository(Organization);

  // Get the first organization (or create a test one)
  let organization = await organizationRepository.findOne({ where: {} });
  if (!organization) {
    organization = await organizationRepository.save({
      name: 'Test Insurance Agency',
      type: 'agency',
      status: 'active',
    });
  }

  console.log('Seeding field permission policies for organization:', organization.name);

  // 1. Insurance Agent Policy with Field Restrictions
  const agentPolicy = await policyRepository.save({
    name: 'Insurance Agent - Limited Customer Data Access',
    description: 'Agents can view policies but not sensitive customer data',
    organizationId: organization.id,
    effect: 'Allow',
    priority: 100,
    subjects: {
      roles: ['agent', 'insurance_agent'],
    },
    resources: {
      types: ['Customer', 'InsurancePolicy'],
    },
    actions: ['read', 'create', 'update'],
    conditions: {
      time: {
        businessHours: true,
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

  // Add field rules for the agent policy
  await fieldRuleRepository.save([
    {
      policyId: agentPolicy.id,
      resourceType: 'Customer',
      fieldName: 'ssn',
      permission: FieldPermissionType.DENY,
    },
    {
      policyId: agentPolicy.id,
      resourceType: 'Customer',
      fieldName: 'dateOfBirth',
      permission: FieldPermissionType.DENY,
    },
    {
      policyId: agentPolicy.id,
      resourceType: 'Customer',
      fieldName: 'medicalHistory',
      permission: FieldPermissionType.DENY,
    },
    {
      policyId: agentPolicy.id,
      resourceType: 'Customer',
      fieldName: 'creditScore',
      permission: FieldPermissionType.DENY,
    },
  ]);

  // 2. Branch Manager Policy with Approval Limits
  const managerPolicy = await policyRepository.save({
    name: 'Branch Manager - Enhanced Access with Limits',
    description: 'Branch managers have more access but with approval limits',
    organizationId: organization.id,
    effect: 'Allow',
    priority: 80,
    subjects: {
      roles: ['branch_manager', 'manager'],
    },
    resources: {
      types: ['Customer', 'InsurancePolicy', 'Claim', 'User'],
    },
    actions: ['read', 'create', 'update', 'approve'],
    conditions: {
      approval: {
        maxAmount: 100000,
      },
    },
    fieldPermissions: {
      Customer: {
        readable: ['*'],
        denied: ['medicalHistory'], // Still can't see medical history
      },
      User: {
        readable: ['id', 'name', 'email', 'role', 'department'],
        writable: ['role', 'department'],
        denied: ['password', 'salary', 'performanceRating'],
      },
    },
    isActive: true,
  });

  // 3. Customer Self-Service Policy
  const customerPolicy = await policyRepository.save({
    name: 'Customer Self-Service Portal Access',
    description: 'Customers can only see their own data with restrictions',
    organizationId: organization.id,
    effect: 'Allow',
    priority: 120,
    subjects: {
      roles: ['customer'],
    },
    resources: {
      types: ['Customer', 'InsurancePolicy', 'Claim'],
      attributes: {
        ownerId: '${subject.id}', // Only their own resources
      },
    },
    actions: ['read', 'update'],
    conditions: {
      mfa: {
        required: true,
      },
      session: {
        maxDuration: 1800, // 30 minutes
      },
    },
    fieldPermissions: {
      Customer: {
        readable: ['*'],
        writable: ['email', 'phone', 'address'],
        denied: ['internalRating', 'riskScore', 'notes'],
      },
      InsurancePolicy: {
        readable: ['policyNumber', 'type', 'premium', 'coverage', 'startDate', 'endDate'],
        denied: ['profitMargin', 'agentCommission', 'internalNotes'],
      },
    },
    isActive: true,
  });

  // 4. Secretary/Admin Staff Policy
  const secretaryPolicy = await policyRepository.save({
    name: 'Administrative Staff - Data Entry Focus',
    description: 'Admin staff can enter data but not see financial details',
    organizationId: organization.id,
    effect: 'Allow',
    priority: 110,
    subjects: {
      roles: ['secretary', 'admin_staff'],
    },
    resources: {
      types: ['Customer', 'InsurancePolicy', 'Claim'],
    },
    actions: ['read', 'create', 'update'],
    fieldPermissions: {
      Customer: {
        readable: ['*'],
        writable: ['*'],
        denied: ['creditScore', 'income', 'netWorth'],
      },
      InsurancePolicy: {
        readable: ['policyNumber', 'type', 'startDate', 'endDate', 'status'],
        writable: ['status', 'notes'],
        denied: ['premium', 'deductible', 'coverage', 'commission'],
      },
      Claim: {
        readable: ['*'],
        writable: ['status', 'notes', 'documents'],
        denied: ['approvedAmount', 'internalNotes'],
      },
    },
    isActive: true,
  });

  // 5. Auditor Policy - Read-only with Full Access
  const auditorPolicy = await policyRepository.save({
    name: 'Auditor - Read-Only Full Access',
    description: 'Auditors can read everything but modify nothing',
    organizationId: organization.id,
    effect: 'Allow',
    priority: 50,
    subjects: {
      roles: ['auditor'],
    },
    resources: {
      types: ['*'], // All resource types
    },
    actions: ['read', 'export'],
    conditions: {
      auditLog: {
        required: true,
      },
    },
    fieldPermissions: {
      '*': {
        readable: ['*'], // Can read all fields
        writable: [], // Can't write anything
      },
    },
    isActive: true,
  });

  // 6. Deny Policy for Terminated Employees
  const denyTerminatedPolicy = await policyRepository.save({
    name: 'Deny Access - Terminated Employees',
    description: 'Explicitly deny all access for terminated users',
    organizationId: organization.id,
    effect: 'Deny',
    priority: 10, // High priority to ensure it's evaluated first
    subjects: {
      attributes: {
        employmentStatus: 'terminated',
      },
    },
    resources: {
      types: ['*'],
    },
    actions: ['*'],
    isActive: true,
  });

  // 7. Multi-Role Example: Agent who is also a Branch Manager
  const multiRolePolicy = await policyRepository.save({
    name: 'Multi-Role - Agent with Manager Privileges',
    description: 'Special policy for users with multiple roles',
    organizationId: organization.id,
    effect: 'Allow',
    priority: 70,
    subjects: {
      roles: ['agent', 'branch_manager'], // User must have BOTH roles
      attributes: {
        certified: true,
        yearsOfExperience: { $gte: 5 },
      },
    },
    resources: {
      types: ['Customer', 'InsurancePolicy', 'Claim'],
    },
    actions: ['read', 'create', 'update', 'approve', 'delete'],
    conditions: {
      approval: {
        maxAmount: 250000, // Higher limit for multi-role users
      },
    },
    fieldPermissions: {
      Customer: {
        readable: ['*'], // Full read access
        writable: ['*'], // Full write access
        denied: [], // No restrictions
      },
    },
    isActive: true,
  });

  console.log('✅ Field permission policies seeded successfully');
  
  return {
    policies: [
      agentPolicy,
      managerPolicy,
      customerPolicy,
      secretaryPolicy,
      auditorPolicy,
      denyTerminatedPolicy,
      multiRolePolicy,
    ],
  };
}

// Example of how to use these policies in your application:
/*

// In a controller with the new CASL guard:
@Controller('customers')
@UseGuards(JwtAuthGuard, CaslAbacGuard)
@UseInterceptors(FieldAccessInterceptor)
export class CustomerController {
  
  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'Customer' })
  @UseFieldFiltering('Customer')
  async getCustomer(@Param('id') id: string) {
    // The response will be automatically filtered based on field permissions
    return this.customerService.findOne(id);
  }
  
  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'Customer' })
  async updateCustomer(
    @Param('id') id: string,
    @Body() updateDto: UpdateCustomerDto,
    @Request() req
  ) {
    // Use the field filter service to remove fields the user can't write
    const filteredDto = await this.fieldFilterService.filterFieldsForWrite(
      req.user,
      req.organizationId,
      'Customer',
      updateDto
    );
    
    return this.customerService.update(id, filteredDto);
  }
}

// Example of multi-role user creation:
const user = await userService.findOne(userId);
const organizationId = 'agency-123';

// Assign multiple roles with different priorities
await userService.assignRole(userId, organizationId, 'agent', adminUserId, {
  priority: 100,
});

await userService.assignRole(userId, organizationId, 'branch_manager', adminUserId, {
  priority: 200, // Higher priority
  validFrom: new Date(),
  validTo: new Date('2025-12-31'), // Temporary promotion
});

// The user will have the combined permissions of both roles,
// with branch_manager taking precedence in conflicts

*/