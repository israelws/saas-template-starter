import { DataSource } from 'typeorm';
import { Policy } from '../../modules/abac/entities/policy.entity';
import { PolicySet } from '../../modules/abac/entities/policy-set.entity';
import { Organization } from '../../modules/organizations/entities/organization.entity';
import { LoggerService } from '../../common/logger/logger.service';

export interface PolicySetSeedData {
  name: string;
  description: string;
  priority: number;
  status: 'active' | 'inactive' | 'draft';
  organizationCode: string;
  policies: PolicySeedData[];
}

export interface PolicySeedData {
  name: string;
  description: string;
  resource: string;
  actions: string[];
  effect: 'allow' | 'deny';
  conditions: Record<string, any>;
  priority: number;
  status: 'active' | 'inactive' | 'draft';
}

export class PolicySeeder {
  private logger = new LoggerService('PolicySeeder');
  private policyRepository: any;
  private policySetRepository: any;
  private organizationRepository: any;

  constructor(private dataSource: DataSource) {
    this.policyRepository = this.dataSource.getRepository(Policy);
    this.policySetRepository = this.dataSource.getRepository(PolicySet);
    this.organizationRepository = this.dataSource.getRepository(Organization);
  }

  async seed(): Promise<void> {
    this.logger.log('Starting policy seeding...');

    // Clear existing policies
    await this.policyRepository.query('TRUNCATE TABLE policies CASCADE');
    await this.policySetRepository.query('TRUNCATE TABLE policy_sets CASCADE');

    const policySetData: PolicySetSeedData[] = [
      // Global TechCorp Policies
      {
        name: 'Global Access Control',
        description: 'Company-wide access control policies',
        priority: 100,
        status: 'active',
        organizationCode: 'TECHCORP',
        policies: [
          {
            name: 'Super Admin Access',
            description: 'System administrators have full access to everything',
            resource: '*',
            actions: ['*'],
            effect: 'allow',
            conditions: {
              'subject.attributes.role': { equals: 'admin' },
              'subject.attributes.clearanceLevel': { equals: 'top-secret' }
            },
            priority: 100,
            status: 'active'
          },
          {
            name: 'Executive Access',
            description: 'Executives have broad organizational access',
            resource: 'organization:*',
            actions: ['*'],
            effect: 'allow',
            conditions: {
              'subject.attributes.role': { equals: 'executive' },
              'subject.attributes.clearanceLevel': { in: ['high', 'top-secret'] }
            },
            priority: 95,
            status: 'active'
          },
          {
            name: 'Manager Organization Management',
            description: 'Managers can manage their organization and sub-organizations',
            resource: 'organization:*',
            actions: ['read', 'update', 'manage_users'],
            effect: 'allow',
            conditions: {
              'subject.attributes.role': { equals: 'manager' },
              'context.organizationHierarchy': { contains: 'subject.organizationId' }
            },
            priority: 80,
            status: 'active'
          },
          {
            name: 'User Self Management',
            description: 'Users can view and update their own profile',
            resource: 'user:profile',
            actions: ['read', 'update'],
            effect: 'allow',
            conditions: {
              'resource.attributes.userId': { equals: 'subject.id' }
            },
            priority: 70,
            status: 'active'
          },
          {
            name: 'Default Organization Read',
            description: 'All authenticated users can read basic organization info',
            resource: 'organization:basic',
            actions: ['read'],
            effect: 'allow',
            conditions: {
              'subject.authenticated': { equals: true },
              'context.organizationMembership': { exists: true }
            },
            priority: 50,
            status: 'active'
          },
          {
            name: 'Sensitive Data Protection',
            description: 'Deny access to sensitive data without proper clearance',
            resource: '*:sensitive',
            actions: ['*'],
            effect: 'deny',
            conditions: {
              'subject.attributes.clearanceLevel': { not_in: ['high', 'top-secret'] }
            },
            priority: 90,
            status: 'active'
          }
        ]
      },

      // Engineering Division Policies
      {
        name: 'Engineering Access Control',
        description: 'Engineering-specific access policies',
        priority: 80,
        status: 'active',
        organizationCode: 'ENG_DIV',
        policies: [
          {
            name: 'Engineering Resource Access',
            description: 'Engineering team members can access development resources',
            resource: 'development:*',
            actions: ['*'],
            effect: 'allow',
            conditions: {
              'subject.attributes.department': { equals: 'engineering' },
              'subject.membership.organizationCode': { in: ['ENG_DIV', 'BACKEND_TEAM', 'FRONTEND_TEAM', 'DEVOPS_TEAM', 'QA_TEAM'] }
            },
            priority: 85,
            status: 'active'
          },
          {
            name: 'Code Repository Access',
            description: 'Developers can access code repositories',
            resource: 'repository:*',
            actions: ['read', 'write', 'create_branch'],
            effect: 'allow',
            conditions: {
              'subject.attributes.role': { in: ['developer', 'manager'] },
              'subject.attributes.department': { equals: 'engineering' }
            },
            priority: 80,
            status: 'active'
          },
          {
            name: 'Production Deploy Restriction',
            description: 'Only senior engineers and managers can deploy to production',
            resource: 'deployment:production',
            actions: ['deploy'],
            effect: 'allow',
            conditions: {
              'subject.attributes.role': { in: ['manager'] },
              'subject.attributes.clearanceLevel': { in: ['high', 'top-secret'] }
            },
            priority: 95,
            status: 'active'
          },
          {
            name: 'API Documentation Access',
            description: 'All engineering team members can access API documentation',
            resource: 'documentation:api',
            actions: ['read', 'comment'],
            effect: 'allow',
            conditions: {
              'subject.attributes.department': { equals: 'engineering' }
            },
            priority: 60,
            status: 'active'
          }
        ]
      },

      // Sales Division Policies  
      {
        name: 'Sales Access Control',
        description: 'Sales team access policies',
        priority: 75,
        status: 'active',
        organizationCode: 'SALES_DIV',
        policies: [
          {
            name: 'Customer Data Access',
            description: 'Sales team can access customer information',
            resource: 'customer:*',
            actions: ['read', 'update', 'create'],
            effect: 'allow',
            conditions: {
              'subject.attributes.department': { equals: 'sales' },
              'subject.membership.organizationCode': { in: ['SALES_DIV', 'ENT_SALES', 'SMB_SALES', 'CS_TEAM'] }
            },
            priority: 80,
            status: 'active'
          },
          {
            name: 'Sales Analytics Access',
            description: 'Sales managers can access sales analytics',
            resource: 'analytics:sales',
            actions: ['read'],
            effect: 'allow',
            conditions: {
              'subject.attributes.role': { in: ['manager', 'director'] },
              'subject.attributes.department': { equals: 'sales' }
            },
            priority: 75,
            status: 'active'
          },
          {
            name: 'Quote Generation',
            description: 'Sales team can generate quotes',
            resource: 'quote:*',
            actions: ['read', 'create', 'update'],
            effect: 'allow',
            conditions: {
              'subject.attributes.department': { equals: 'sales' },
              'subject.attributes.role': { in: ['manager', 'member'] }
            },
            priority: 70,
            status: 'active'
          }
        ]
      },

      // RetailMax Global Policies
      {
        name: 'RetailMax Global Policies',
        description: 'Company-wide policies for RetailMax',
        priority: 100,
        status: 'active',
        organizationCode: 'RETAILMAX',
        policies: [
          {
            name: 'Executive Full Access',
            description: 'Executives have full access to all retail operations',
            resource: '*',
            actions: ['*'],
            effect: 'allow',
            conditions: {
              'subject.attributes.role': { equals: 'executive' },
              'subject.attributes.clearanceLevel': { in: ['high', 'top-secret'] }
            },
            priority: 100,
            status: 'active'
          },
          {
            name: 'Regional Director Access',
            description: 'Regional directors can manage their regions',
            resource: 'region:*',
            actions: ['*'],
            effect: 'allow',
            conditions: {
              'subject.attributes.role': { equals: 'director' },
              'subject.membership.attributes.region': { equals: 'resource.attributes.region' }
            },
            priority: 85,
            status: 'active'
          },
          {
            name: 'Store Operations Access',
            description: 'Store managers can access store operations',
            resource: 'store:*',
            actions: ['read', 'update', 'manage_inventory'],
            effect: 'allow',
            conditions: {
              'subject.attributes.role': { in: ['manager', 'assistant_manager'] },
              'subject.membership.attributes.stores': { contains: 'resource.attributes.storeId' }
            },
            priority: 70,
            status: 'active'
          },
          {
            name: 'Inventory Management',
            description: 'Inventory team can manage stock levels',
            resource: 'inventory:*',
            actions: ['read', 'update', 'transfer'],
            effect: 'allow',
            conditions: {
              'subject.attributes.department': { equals: 'operations' },
              'subject.membership.organizationCode': { in: ['OPS_DIV', 'INVENTORY'] }
            },
            priority: 75,
            status: 'active'
          }
        ]
      },

      // FinanceFlow Compliance Policies
      {
        name: 'FinanceFlow Security Policies',
        description: 'Financial services compliance and security policies',
        priority: 100,
        status: 'active',
        organizationCode: 'FINFLOW',
        policies: [
          {
            name: 'PCI DSS Compliance',
            description: 'Access to payment card data requires PCI compliance',
            resource: 'payment:card_data',
            actions: ['*'],
            effect: 'allow',
            conditions: {
              'subject.attributes.clearanceLevel': { in: ['high', 'top-secret'] },
              'subject.membership.attributes.clearances': { contains: 'pci_dss' },
              'environment.attributes.network': { equals: 'secure_zone' }
            },
            priority: 100,
            status: 'active'
          },
          {
            name: 'Financial Data Access',
            description: 'Risk and compliance team can access financial data',
            resource: 'financial:*',
            actions: ['read'],
            effect: 'allow',
            conditions: {
              'subject.attributes.department': { equals: 'risk' },
              'subject.attributes.certifications': { contains_any: ['frm', 'cisa', 'cism'] }
            },
            priority: 90,
            status: 'active'
          },
          {
            name: 'Platform Engineering Access',
            description: 'Engineering team can access platform resources',
            resource: 'platform:*',
            actions: ['read', 'update', 'deploy'],
            effect: 'allow',
            conditions: {
              'subject.attributes.department': { equals: 'engineering' },
              'subject.membership.organizationCode': { equals: 'PROD_ENG' }
            },
            priority: 80,
            status: 'active'
          },
          {
            name: 'Customer Support Access',
            description: 'Customer success team can access support tools',
            resource: 'support:*',
            actions: ['read', 'update', 'create_ticket'],
            effect: 'allow',
            conditions: {
              'subject.attributes.department': { equals: 'customer_success' },
              'subject.membership.organizationCode': { equals: 'CUST_SUCCESS' }
            },
            priority: 70,
            status: 'active'
          }
        ]
      },

      // Cross-Organization Consultant Policies
      {
        name: 'External Consultant Policies',
        description: 'Policies for external consultants and contractors',
        priority: 60,
        status: 'active',
        organizationCode: 'TECHCORP', // Applied globally but managed by TechCorp
        policies: [
          {
            name: 'Consultant Limited Access',
            description: 'Consultants have limited read access to project data',
            resource: 'project:*',
            actions: ['read'],
            effect: 'allow',
            conditions: {
              'subject.attributes.role': { equals: 'consultant' },
              'subject.membership.attributes.access': { equals: 'limited' },
              'environment.attributes.time': { between: ['09:00', '17:00'] }
            },
            priority: 60,
            status: 'active'
          },
          {
            name: 'Consultant Data Export Restriction',
            description: 'Consultants cannot export sensitive data',
            resource: '*:sensitive',
            actions: ['export', 'download', 'copy'],
            effect: 'deny',
            conditions: {
              'subject.attributes.role': { equals: 'consultant' }
            },
            priority: 90,
            status: 'active'
          }
        ]
      },

      // Default Deny Policies (Security)
      {
        name: 'Security Baseline',
        description: 'Default security policies and access denials',
        priority: 10,
        status: 'active',
        organizationCode: 'TECHCORP', // Applied globally
        policies: [
          {
            name: 'Administrative Actions Require High Clearance',
            description: 'Administrative actions require high security clearance',
            resource: '*:admin',
            actions: ['*'],
            effect: 'deny',
            conditions: {
              'subject.attributes.clearanceLevel': { not_in: ['high', 'top-secret'] }
            },
            priority: 95,
            status: 'active'
          },
          {
            name: 'After Hours Access Restriction',
            description: 'Restrict access to sensitive resources after hours',
            resource: '*:sensitive',
            actions: ['*'],
            effect: 'deny',
            conditions: {
              'environment.attributes.time': { not_between: ['08:00', '18:00'] },
              'subject.attributes.role': { not_in: ['admin', 'on_call'] }
            },
            priority: 85,
            status: 'active'
          },
          {
            name: 'Geographic Access Restriction',
            description: 'Restrict access from unauthorized locations',
            resource: '*:restricted',
            actions: ['*'],
            effect: 'deny',
            conditions: {
              'environment.attributes.location.country': { not_in: ['US', 'CA', 'GB', 'DE'] }
            },
            priority: 80,
            status: 'active'
          },
          {
            name: 'Default Deny All',
            description: 'Deny all access by default if no other policy matches',
            resource: '*',
            actions: ['*'],
            effect: 'deny',
            conditions: {},
            priority: 1,
            status: 'active'
          }
        ]
      }
    ];

    // Create policy sets and their policies
    for (const policySetInfo of policySetData) {
      await this.createPolicySetWithPolicies(policySetInfo);
    }

    this.logger.log('Policy seeding completed successfully');
    this.logger.log(`Created ${policySetData.length} policy sets with comprehensive ABAC policies`);
  }

  private async createPolicySetWithPolicies(policySetInfo: PolicySetSeedData): Promise<void> {
    // Find organization by code
    const organization = await this.organizationRepository.findOne({
      where: { code: policySetInfo.organizationCode }
    });

    if (!organization) {
      this.logger.warn(`Organization not found: ${policySetInfo.organizationCode}`);
      return;
    }

    // Create policy set
    const policySet = this.policySetRepository.create({
      name: policySetInfo.name,
      description: policySetInfo.description,
      priority: policySetInfo.priority,
      status: policySetInfo.status,
      organization,
      isActive: policySetInfo.status === 'active',
    });

    const savedPolicySet = await this.policySetRepository.save(policySet);
    this.logger.debug(`Created policy set: ${policySetInfo.name}`);

    // Create policies within the policy set
    for (const policyInfo of policySetInfo.policies) {
      const policy = this.policyRepository.create({
        name: policyInfo.name,
        description: policyInfo.description,
        resource: policyInfo.resource,
        actions: policyInfo.actions,
        effect: policyInfo.effect,
        conditions: policyInfo.conditions,
        priority: policyInfo.priority,
        status: policyInfo.status,
        organization,
        policySet: savedPolicySet,
        isActive: policyInfo.status === 'active',
      });

      await this.policyRepository.save(policy);
      this.logger.debug(`Created policy: ${policyInfo.name}`);
    }
  }
}