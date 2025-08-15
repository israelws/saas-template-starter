import { DataSource } from 'typeorm';
import { AttributeDefinition } from '../../modules/abac/entities/attribute-definition.entity';
import { Organization } from '../../modules/organizations/entities/organization.entity';
import { LoggerService } from '../../common/logger/logger.service';

export interface AttributeDefinitionSeedData {
  name: string;
  key: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date';
  category: 'subject' | 'resource' | 'environment' | 'action';
  description: string;
  required: boolean;
  defaultValue?: any;
  validationRules?: Record<string, any>;
  organizationCode: string;
}

export class AttributeSeeder {
  private logger = new LoggerService('AttributeSeeder');
  private attributeRepository: any;
  private organizationRepository: any;

  constructor(private dataSource: DataSource) {
    this.attributeRepository = this.dataSource.getRepository(AttributeDefinition);
    this.organizationRepository = this.dataSource.getRepository(Organization);
  }

  async seed(): Promise<void> {
    this.logger.log('Starting attribute definitions seeding...');

    // Clear existing attribute definitions
    await this.attributeRepository.query('TRUNCATE TABLE attribute_definitions CASCADE');

    const attributeData: AttributeDefinitionSeedData[] = [
      // Global Subject Attributes (TechCorp)
      {
        name: 'User Role',
        key: 'role',
        type: 'string',
        category: 'subject',
        description: 'User role within the organization',
        required: true,
        defaultValue: 'employee',
        validationRules: {
          enum: [
            'admin',
            'executive',
            'director',
            'manager',
            'developer',
            'employee',
            'consultant',
            'contractor',
          ],
        },
        organizationCode: 'TECHCORP',
      },
      {
        name: 'Security Clearance Level',
        key: 'clearanceLevel',
        type: 'string',
        category: 'subject',
        description: 'Security clearance level for access control',
        required: true,
        defaultValue: 'low',
        validationRules: {
          enum: ['low', 'medium', 'high', 'top-secret'],
        },
        organizationCode: 'TECHCORP',
      },
      {
        name: 'Department',
        key: 'department',
        type: 'string',
        category: 'subject',
        description: 'User department or functional area',
        required: false,
        validationRules: {
          enum: [
            'executive',
            'engineering',
            'sales',
            'marketing',
            'hr',
            'finance',
            'operations',
            'risk',
            'customer_success',
            'external',
          ],
        },
        organizationCode: 'TECHCORP',
      },
      {
        name: 'Employee ID',
        key: 'employeeId',
        type: 'string',
        category: 'subject',
        description: 'Unique employee identifier',
        required: false,
        validationRules: {
          pattern: '^[A-Z]{2}\\d{3,6}$',
        },
        organizationCode: 'TECHCORP',
      },
      {
        name: 'Job Title',
        key: 'title',
        type: 'string',
        category: 'subject',
        description: 'Official job title',
        required: false,
        validationRules: {
          maxLength: 100,
        },
        organizationCode: 'TECHCORP',
      },
      {
        name: 'Hire Date',
        key: 'hireDate',
        type: 'date',
        category: 'subject',
        description: 'Date when employee was hired',
        required: false,
        organizationCode: 'TECHCORP',
      },
      {
        name: 'Work Location',
        key: 'location',
        type: 'string',
        category: 'subject',
        description: 'Primary work location',
        required: false,
        validationRules: {
          pattern: '^[A-Za-z\\s]+,\\s[A-Z]{2}$',
        },
        organizationCode: 'TECHCORP',
      },
      {
        name: 'Technical Skills',
        key: 'skills',
        type: 'array',
        category: 'subject',
        description: 'Technical skills and competencies',
        required: false,
        organizationCode: 'TECHCORP',
      },
      {
        name: 'Certifications',
        key: 'certifications',
        type: 'array',
        category: 'subject',
        description: 'Professional certifications held',
        required: false,
        organizationCode: 'TECHCORP',
      },

      // Engineering Specific Attributes
      {
        name: 'Engineering Level',
        key: 'engineeringLevel',
        type: 'string',
        category: 'subject',
        description: 'Engineering experience level',
        required: false,
        validationRules: {
          enum: ['junior', 'mid', 'senior', 'staff', 'principal', 'distinguished'],
        },
        organizationCode: 'ENG_DIV',
      },
      {
        name: 'Team Specialization',
        key: 'specialization',
        type: 'string',
        category: 'subject',
        description: 'Engineering team specialization',
        required: false,
        validationRules: {
          enum: [
            'frontend',
            'backend',
            'fullstack',
            'devops',
            'qa',
            'mobile',
            'data',
            'ml',
            'security',
          ],
        },
        organizationCode: 'ENG_DIV',
      },
      {
        name: 'Code Review Authority',
        key: 'codeReviewAuthority',
        type: 'boolean',
        category: 'subject',
        description: 'Authorization to approve code reviews',
        required: false,
        defaultValue: false,
        organizationCode: 'ENG_DIV',
      },

      // Sales Specific Attributes
      {
        name: 'Sales Quota',
        key: 'quota',
        type: 'number',
        category: 'subject',
        description: 'Annual sales quota in dollars',
        required: false,
        validationRules: {
          minimum: 0,
          maximum: 10000000,
        },
        organizationCode: 'SALES_DIV',
      },
      {
        name: 'Sales Territory',
        key: 'territory',
        type: 'string',
        category: 'subject',
        description: 'Assigned sales territory',
        required: false,
        validationRules: {
          enum: ['east_coast', 'west_coast', 'central', 'international', 'enterprise', 'smb'],
        },
        organizationCode: 'SALES_DIV',
      },

      // RetailMax Specific Attributes
      {
        name: 'Store Access List',
        key: 'storeAccess',
        type: 'array',
        category: 'subject',
        description: 'List of store IDs user can access',
        required: false,
        organizationCode: 'RETAILMAX',
      },
      {
        name: 'Regional Authority',
        key: 'regionalAuthority',
        type: 'string',
        category: 'subject',
        description: 'Regional management authority',
        required: false,
        validationRules: {
          enum: ['north_america', 'europe', 'apac', 'global'],
        },
        organizationCode: 'RETAILMAX',
      },

      // FinanceFlow Specific Attributes
      {
        name: 'Financial Clearances',
        key: 'financialClearances',
        type: 'array',
        category: 'subject',
        description: 'Financial compliance clearances',
        required: false,
        validationRules: {
          items: {
            enum: ['pci_dss', 'sox', 'gdpr', 'basel', 'coso', 'iso27001'],
          },
        },
        organizationCode: 'FINFLOW',
      },
      {
        name: 'Risk Assessment Authority',
        key: 'riskAssessmentAuthority',
        type: 'boolean',
        category: 'subject',
        description: 'Authority to perform risk assessments',
        required: false,
        defaultValue: false,
        organizationCode: 'FINFLOW',
      },

      // Resource Attributes
      {
        name: 'Resource Owner',
        key: 'owner',
        type: 'string',
        category: 'resource',
        description: 'User ID of the resource owner',
        required: false,
        organizationCode: 'TECHCORP',
      },
      {
        name: 'Classification Level',
        key: 'classificationLevel',
        type: 'string',
        category: 'resource',
        description: 'Data classification level',
        required: false,
        defaultValue: 'public',
        validationRules: {
          enum: ['public', 'internal', 'confidential', 'restricted', 'top-secret'],
        },
        organizationCode: 'TECHCORP',
      },
      {
        name: 'Resource Type',
        key: 'resourceType',
        type: 'string',
        category: 'resource',
        description: 'Type of the resource',
        required: false,
        validationRules: {
          enum: ['document', 'api', 'database', 'system', 'application', 'file', 'repository'],
        },
        organizationCode: 'TECHCORP',
      },
      {
        name: 'Data Sensitivity',
        key: 'dataSensitivity',
        type: 'string',
        category: 'resource',
        description: 'Sensitivity level of the data',
        required: false,
        validationRules: {
          enum: [
            'public',
            'internal',
            'sensitive',
            'highly-sensitive',
            'pii',
            'financial',
            'medical',
          ],
        },
        organizationCode: 'TECHCORP',
      },
      {
        name: 'Retention Period',
        key: 'retentionPeriod',
        type: 'number',
        category: 'resource',
        description: 'Data retention period in days',
        required: false,
        validationRules: {
          minimum: 1,
          maximum: 3650,
        },
        organizationCode: 'TECHCORP',
      },
      {
        name: 'Compliance Tags',
        key: 'complianceTags',
        type: 'array',
        category: 'resource',
        description: 'Compliance requirements for the resource',
        required: false,
        validationRules: {
          items: {
            enum: ['gdpr', 'ccpa', 'hipaa', 'pci_dss', 'sox', 'ferpa'],
          },
        },
        organizationCode: 'TECHCORP',
      },

      // Environment Attributes
      {
        name: 'Access Time',
        key: 'time',
        type: 'string',
        category: 'environment',
        description: 'Time of access (HH:MM format)',
        required: false,
        validationRules: {
          pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$',
        },
        organizationCode: 'TECHCORP',
      },
      {
        name: 'Access Date',
        key: 'date',
        type: 'date',
        category: 'environment',
        description: 'Date of access',
        required: false,
        organizationCode: 'TECHCORP',
      },
      {
        name: 'IP Address',
        key: 'ipAddress',
        type: 'string',
        category: 'environment',
        description: 'Client IP address',
        required: false,
        validationRules: {
          pattern:
            '^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$',
        },
        organizationCode: 'TECHCORP',
      },
      {
        name: 'Network Zone',
        key: 'networkZone',
        type: 'string',
        category: 'environment',
        description: 'Network security zone',
        required: false,
        validationRules: {
          enum: ['public', 'dmz', 'internal', 'secure_zone', 'isolated'],
        },
        organizationCode: 'TECHCORP',
      },
      {
        name: 'Device Type',
        key: 'deviceType',
        type: 'string',
        category: 'environment',
        description: 'Type of device used for access',
        required: false,
        validationRules: {
          enum: ['desktop', 'laptop', 'mobile', 'tablet', 'server', 'api_client'],
        },
        organizationCode: 'TECHCORP',
      },
      {
        name: 'Geographic Location',
        key: 'location',
        type: 'object',
        category: 'environment',
        description: 'Geographic location information',
        required: false,
        validationRules: {
          properties: {
            country: { type: 'string', pattern: '^[A-Z]{2}$' },
            state: { type: 'string' },
            city: { type: 'string' },
            coordinates: {
              type: 'object',
              properties: {
                latitude: { type: 'number', minimum: -90, maximum: 90 },
                longitude: { type: 'number', minimum: -180, maximum: 180 },
              },
            },
          },
        },
        organizationCode: 'TECHCORP',
      },
      {
        name: 'Authentication Method',
        key: 'authMethod',
        type: 'string',
        category: 'environment',
        description: 'Authentication method used',
        required: false,
        validationRules: {
          enum: ['password', 'mfa', 'sso', 'api_key', 'certificate', 'biometric'],
        },
        organizationCode: 'TECHCORP',
      },
      {
        name: 'Session Risk Score',
        key: 'riskScore',
        type: 'number',
        category: 'environment',
        description: 'Risk score for the current session (0-100)',
        required: false,
        validationRules: {
          minimum: 0,
          maximum: 100,
        },
        organizationCode: 'TECHCORP',
      },

      // Action Attributes
      {
        name: 'Bulk Operation Size',
        key: 'bulkSize',
        type: 'number',
        category: 'action',
        description: 'Number of items in bulk operation',
        required: false,
        validationRules: {
          minimum: 1,
          maximum: 10000,
        },
        organizationCode: 'TECHCORP',
      },
      {
        name: 'Data Export Format',
        key: 'exportFormat',
        type: 'string',
        category: 'action',
        description: 'Format for data export operations',
        required: false,
        validationRules: {
          enum: ['csv', 'json', 'xml', 'pdf', 'xlsx'],
        },
        organizationCode: 'TECHCORP',
      },
      {
        name: 'Approval Required',
        key: 'approvalRequired',
        type: 'boolean',
        category: 'action',
        description: 'Whether the action requires approval',
        required: false,
        defaultValue: false,
        organizationCode: 'TECHCORP',
      },
      {
        name: 'Audit Level',
        key: 'auditLevel',
        type: 'string',
        category: 'action',
        description: 'Level of auditing required for the action',
        required: false,
        defaultValue: 'standard',
        validationRules: {
          enum: ['none', 'basic', 'standard', 'detailed', 'comprehensive'],
        },
        organizationCode: 'TECHCORP',
      },
    ];

    // Create attribute definitions
    for (const attributeInfo of attributeData) {
      await this.createAttributeDefinition(attributeInfo);
    }

    this.logger.log('Attribute definitions seeding completed successfully');
    this.logger.log(`Created ${attributeData.length} attribute definitions across all categories`);
  }

  private async createAttributeDefinition(
    attributeInfo: AttributeDefinitionSeedData,
  ): Promise<void> {
    // Find organization by code
    const organization = await this.organizationRepository.findOne({
      where: { code: attributeInfo.organizationCode },
    });

    if (!organization) {
      this.logger.warn(`Organization not found: ${attributeInfo.organizationCode}`);
      return;
    }

    const attributeDefinition = this.attributeRepository.create({
      name: attributeInfo.name,
      key: attributeInfo.key,
      type: attributeInfo.type,
      category: attributeInfo.category,
      description: attributeInfo.description,
      required: attributeInfo.required,
      defaultValue: attributeInfo.defaultValue,
      validationRules: attributeInfo.validationRules || {},
      organization,
      isActive: true,
    });

    await this.attributeRepository.save(attributeDefinition);
    this.logger.debug(`Created attribute definition: ${attributeInfo.name} (${attributeInfo.key})`);
  }
}
