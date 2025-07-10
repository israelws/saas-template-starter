import { DataSource } from 'typeorm';
import { Organization } from '../../modules/organizations/entities/organization.entity';
import { LoggerService } from '../../common/logger/logger.service';

export interface OrganizationSeedData {
  name: string;
  code: string;
  description: string;
  type: 'company' | 'division' | 'department' | 'team' | 'region';
  status: 'active' | 'inactive' | 'archived';
  settings?: Record<string, any>;
  children?: OrganizationSeedData[];
}

export class OrganizationSeeder {
  private logger = new LoggerService('OrganizationSeeder');
  private organizationRepository: any;

  constructor(private dataSource: DataSource) {
    this.organizationRepository = this.dataSource.getRepository(Organization);
  }

  async seed(): Promise<void> {
    this.logger.log('Starting organization seeding...');

    // Clear existing organizations
    await this.organizationRepository.query('TRUNCATE TABLE organizations CASCADE');

    const organizationStructures: OrganizationSeedData[] = [
      {
        name: 'TechCorp Global',
        code: 'TECHCORP',
        description: 'Global technology corporation specializing in enterprise software solutions',
        type: 'company',
        status: 'active',
        settings: {
          industry: 'technology',
          employees: 5000,
          founded: 2010,
          headquarters: 'San Francisco, CA',
          website: 'https://techcorp.com',
          revenue: '500M',
          features: ['multi_tenant', 'api_access', 'custom_branding'],
        },
        children: [
          {
            name: 'Engineering Division',
            code: 'ENG_DIV',
            description: 'Product development and engineering teams',
            type: 'division',
            status: 'active',
            settings: { focus: 'product_development', teams: 15 },
            children: [
              {
                name: 'Backend Engineering',
                code: 'BACKEND_TEAM',
                description: 'Server-side development team',
                type: 'team',
                status: 'active',
                settings: { tech_stack: ['nodejs', 'python', 'go'], size: 12 },
              },
              {
                name: 'Frontend Engineering',
                code: 'FRONTEND_TEAM',
                description: 'Client-side development team',
                type: 'team',
                status: 'active',
                settings: { tech_stack: ['react', 'vue', 'angular'], size: 10 },
              },
              {
                name: 'DevOps Team',
                code: 'DEVOPS_TEAM',
                description: 'Infrastructure and deployment team',
                type: 'team',
                status: 'active',
                settings: { cloud_providers: ['aws', 'gcp', 'azure'], size: 8 },
              },
              {
                name: 'QA Engineering',
                code: 'QA_TEAM',
                description: 'Quality assurance and testing team',
                type: 'team',
                status: 'active',
                settings: { automation_tools: ['selenium', 'cypress', 'jest'], size: 6 },
              },
            ],
          },
          {
            name: 'Sales Division',
            code: 'SALES_DIV',
            description: 'Customer acquisition and account management',
            type: 'division',
            status: 'active',
            settings: { focus: 'enterprise_sales', quota: '100M' },
            children: [
              {
                name: 'Enterprise Sales',
                code: 'ENT_SALES',
                description: 'Large enterprise account sales',
                type: 'team',
                status: 'active',
                settings: { target_segment: 'enterprise', deal_size: '500K+' },
              },
              {
                name: 'SMB Sales',
                code: 'SMB_SALES',
                description: 'Small and medium business sales',
                type: 'team',
                status: 'active',
                settings: { target_segment: 'smb', deal_size: '10K-500K' },
              },
              {
                name: 'Customer Success',
                code: 'CS_TEAM',
                description: 'Customer onboarding and success',
                type: 'team',
                status: 'active',
                settings: { focus: 'retention', nps_target: 8.5 },
              },
            ],
          },
          {
            name: 'Marketing Division',
            code: 'MKT_DIV',
            description: 'Brand marketing and lead generation',
            type: 'division',
            status: 'active',
            settings: { focus: 'digital_marketing', budget: '20M' },
            children: [
              {
                name: 'Digital Marketing',
                code: 'DIGITAL_MKT',
                description: 'Online marketing and campaigns',
                type: 'team',
                status: 'active',
                settings: { channels: ['google', 'facebook', 'linkedin'] },
              },
              {
                name: 'Content Marketing',
                code: 'CONTENT_MKT',
                description: 'Content creation and strategy',
                type: 'team',
                status: 'active',
                settings: { focus: 'thought_leadership', publications: 50 },
              },
            ],
          },
          {
            name: 'Finance Department',
            code: 'FINANCE_DEPT',
            description: 'Financial planning and operations',
            type: 'department',
            status: 'active',
            settings: { focus: 'corporate_finance', compliance: ['sox', 'gaap'] },
            children: [
              {
                name: 'Accounting Team',
                code: 'ACCOUNTING',
                description: 'Financial reporting and bookkeeping',
                type: 'team',
                status: 'active',
                settings: { erp_system: 'netsuite' },
              },
              {
                name: 'FP&A Team',
                code: 'FPA_TEAM',
                description: 'Financial planning and analysis',
                type: 'team',
                status: 'active',
                settings: { forecasting_cycles: 'quarterly' },
              },
            ],
          },
          {
            name: 'HR Department',
            code: 'HR_DEPT',
            description: 'Human resources and talent management',
            type: 'department',
            status: 'active',
            settings: { focus: 'talent_acquisition', headcount: 5000 },
          },
        ],
      },
      {
        name: 'RetailMax Enterprises',
        code: 'RETAILMAX',
        description: 'International retail chain with omnichannel presence',
        type: 'company',
        status: 'active',
        settings: {
          industry: 'retail',
          stores: 450,
          founded: 1995,
          headquarters: 'Chicago, IL',
          website: 'https://retailmax.com',
          revenue: '2.1B',
          channels: ['physical', 'online', 'mobile'],
        },
        children: [
          {
            name: 'North America Region',
            code: 'NA_REGION',
            description: 'North American operations',
            type: 'region',
            status: 'active',
            settings: { stores: 250, markets: ['us', 'canada'] },
            children: [
              {
                name: 'US East Division',
                code: 'US_EAST',
                description: 'Eastern United States operations',
                type: 'division',
                status: 'active',
                settings: { states: ['ny', 'nj', 'ct', 'ma', 'pa'], stores: 120 },
              },
              {
                name: 'US West Division',
                code: 'US_WEST',
                description: 'Western United States operations',
                type: 'division',
                status: 'active',
                settings: { states: ['ca', 'wa', 'or', 'nv', 'az'], stores: 100 },
              },
              {
                name: 'Canada Division',
                code: 'CANADA',
                description: 'Canadian operations',
                type: 'division',
                status: 'active',
                settings: { provinces: ['on', 'bc', 'qc', 'ab'], stores: 30 },
              },
            ],
          },
          {
            name: 'Europe Region',
            code: 'EU_REGION',
            description: 'European operations',
            type: 'region',
            status: 'active',
            settings: { stores: 150, markets: ['uk', 'de', 'fr', 'es', 'it'] },
            children: [
              {
                name: 'UK Division',
                code: 'UK_DIV',
                description: 'United Kingdom operations',
                type: 'division',
                status: 'active',
                settings: { cities: ['london', 'manchester', 'birmingham'], stores: 60 },
              },
              {
                name: 'Continental Europe',
                code: 'CONT_EU',
                description: 'Continental European operations',
                type: 'division',
                status: 'active',
                settings: { countries: ['de', 'fr', 'es', 'it'], stores: 90 },
              },
            ],
          },
          {
            name: 'APAC Region',
            code: 'APAC_REGION',
            description: 'Asia-Pacific operations',
            type: 'region',
            status: 'active',
            settings: { stores: 50, markets: ['au', 'sg', 'jp'] },
          },
          {
            name: 'Operations Division',
            code: 'OPS_DIV',
            description: 'Supply chain and logistics',
            type: 'division',
            status: 'active',
            settings: { warehouses: 25, suppliers: 500 },
            children: [
              {
                name: 'Supply Chain',
                code: 'SUPPLY_CHAIN',
                description: 'Procurement and vendor management',
                type: 'team',
                status: 'active',
                settings: { suppliers: 500, categories: 50 },
              },
              {
                name: 'Logistics',
                code: 'LOGISTICS',
                description: 'Distribution and fulfillment',
                type: 'team',
                status: 'active',
                settings: { carriers: ['fedex', 'ups', 'dhl'], same_day: true },
              },
              {
                name: 'Inventory Management',
                code: 'INVENTORY',
                description: 'Stock planning and management',
                type: 'team',
                status: 'active',
                settings: { turnover_target: 12, sku_count: 50000 },
              },
            ],
          },
        ],
      },
      {
        name: 'FinanceFlow Solutions',
        code: 'FINFLOW',
        description: 'Financial technology and payment processing company',
        type: 'company',
        status: 'active',
        settings: {
          industry: 'fintech',
          employees: 1200,
          founded: 2018,
          headquarters: 'Austin, TX',
          website: 'https://financeflow.com',
          revenue: '150M',
          compliance: ['pci_dss', 'sox', 'gdpr'],
        },
        children: [
          {
            name: 'Product Engineering',
            code: 'PROD_ENG',
            description: 'Product development and platform engineering',
            type: 'division',
            status: 'active',
            settings: { focus: 'payments_platform', microservices: 45 },
          },
          {
            name: 'Risk & Compliance',
            code: 'RISK_COMP',
            description: 'Risk management and regulatory compliance',
            type: 'division',
            status: 'active',
            settings: { frameworks: ['basel', 'coso'], audits: 'quarterly' },
          },
          {
            name: 'Customer Success',
            code: 'CUST_SUCCESS',
            description: 'Client onboarding and support',
            type: 'division',
            status: 'active',
            settings: { sla_target: '99.9%', response_time: '2h' },
          },
        ],
      },
    ];

    // Create organizations recursively
    for (const orgData of organizationStructures) {
      await this.createOrganizationHierarchy(orgData, null);
    }

    this.logger.log('Organization seeding completed successfully');
  }

  private async createOrganizationHierarchy(
    orgData: OrganizationSeedData,
    parent: Organization | null,
  ): Promise<Organization> {
    // Create the organization
    const organization = this.organizationRepository.create({
      name: orgData.name,
      code: orgData.code,
      description: orgData.description,
      type: orgData.type,
      status: orgData.status,
      settings: orgData.settings || {},
      parent,
      isActive: orgData.status === 'active',
    });

    const savedOrganization = await this.organizationRepository.save(organization);

    this.logger.debug(`Created organization: ${orgData.name} (${orgData.code})`);

    // Create children if they exist
    if (orgData.children && orgData.children.length > 0) {
      for (const childData of orgData.children) {
        await this.createOrganizationHierarchy(childData, savedOrganization);
      }
    }

    return savedOrganization;
  }
}