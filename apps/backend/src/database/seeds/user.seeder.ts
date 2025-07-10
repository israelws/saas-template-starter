import { DataSource } from 'typeorm';
import { User } from '../../modules/users/entities/user.entity';
import { UserOrganizationMembership } from '../../modules/users/entities/user-organization-membership.entity';
import { Organization } from '../../modules/organizations/entities/organization.entity';
import { LoggerService } from '../../common/logger/logger.service';

export interface UserSeedData {
  cognitoId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  status: 'active' | 'inactive' | 'pending';
  attributes?: Record<string, any>;
  memberships: Array<{
    organizationCode: string;
    role: string;
    attributes?: Record<string, any>;
  }>;
}

export class UserSeeder {
  private logger = new LoggerService('UserSeeder');
  private userRepository: any;
  private membershipRepository: any;
  private organizationRepository: any;

  constructor(private dataSource: DataSource) {
    this.userRepository = this.dataSource.getRepository(User);
    this.membershipRepository = this.dataSource.getRepository(UserOrganizationMembership);
    this.organizationRepository = this.dataSource.getRepository(Organization);
  }

  async seed(): Promise<void> {
    this.logger.log('Starting user seeding...');

    // Clear existing users and memberships
    await this.membershipRepository.query('TRUNCATE TABLE user_organization_memberships CASCADE');
    await this.userRepository.query('TRUNCATE TABLE users CASCADE');

    const userData: UserSeedData[] = [
      // TechCorp Global Users
      {
        cognitoId: 'cognito-admin-techcorp-001',
        email: 'john.admin@techcorp.com',
        firstName: 'John',
        lastName: 'Administrator',
        phone: '+1-555-0001',
        status: 'active',
        attributes: { 
          role: 'admin',
          clearanceLevel: 'top-secret',
          department: 'executive',
          employeeId: 'TC001',
          hireDate: '2020-01-15',
          location: 'San Francisco, CA'
        },
        memberships: [
          {
            organizationCode: 'TECHCORP',
            role: 'admin',
            attributes: { permissions: ['all'], accessLevel: 'global' }
          }
        ]
      },
      {
        cognitoId: 'cognito-cto-techcorp-002',
        email: 'sarah.cto@techcorp.com',
        firstName: 'Sarah',
        lastName: 'Chen',
        phone: '+1-555-0002',
        status: 'active',
        attributes: {
          role: 'executive',
          clearanceLevel: 'high',
          department: 'engineering',
          employeeId: 'TC002',
          title: 'Chief Technology Officer',
          hireDate: '2020-03-01',
          location: 'San Francisco, CA'
        },
        memberships: [
          {
            organizationCode: 'TECHCORP',
            role: 'executive',
            attributes: { title: 'CTO', scope: 'global' }
          },
          {
            organizationCode: 'ENG_DIV',
            role: 'director',
            attributes: { title: 'Engineering Director' }
          }
        ]
      },
      {
        cognitoId: 'cognito-engmgr-techcorp-003',
        email: 'mike.engmgr@techcorp.com',
        firstName: 'Mike',
        lastName: 'Johnson',
        phone: '+1-555-0003',
        status: 'active',
        attributes: {
          role: 'manager',
          clearanceLevel: 'high',
          department: 'engineering',
          employeeId: 'TC003',
          title: 'Engineering Manager',
          hireDate: '2021-06-15',
          location: 'San Francisco, CA'
        },
        memberships: [
          {
            organizationCode: 'ENG_DIV',
            role: 'manager',
            attributes: { team: 'backend', scope: 'division' }
          },
          {
            organizationCode: 'BACKEND_TEAM',
            role: 'lead',
            attributes: { title: 'Team Lead' }
          }
        ]
      },
      {
        cognitoId: 'cognito-dev-techcorp-004',
        email: 'alice.dev@techcorp.com',
        firstName: 'Alice',
        lastName: 'Williams',
        phone: '+1-555-0004',
        status: 'active',
        attributes: {
          role: 'developer',
          clearanceLevel: 'medium',
          department: 'engineering',
          employeeId: 'TC004',
          title: 'Senior Backend Developer',
          hireDate: '2022-01-10',
          location: 'San Francisco, CA',
          skills: ['nodejs', 'python', 'postgresql', 'redis']
        },
        memberships: [
          {
            organizationCode: 'BACKEND_TEAM',
            role: 'member',
            attributes: { level: 'senior', specialization: 'api_development' }
          }
        ]
      },
      {
        cognitoId: 'cognito-dev-techcorp-005',
        email: 'bob.frontend@techcorp.com',
        firstName: 'Bob',
        lastName: 'Davis',
        phone: '+1-555-0005',
        status: 'active',
        attributes: {
          role: 'developer',
          clearanceLevel: 'medium',
          department: 'engineering',
          employeeId: 'TC005',
          title: 'Frontend Developer',
          hireDate: '2022-03-20',
          location: 'Austin, TX',
          skills: ['react', 'typescript', 'nextjs', 'tailwind']
        },
        memberships: [
          {
            organizationCode: 'FRONTEND_TEAM',
            role: 'member',
            attributes: { level: 'mid', specialization: 'ui_components' }
          }
        ]
      },
      {
        cognitoId: 'cognito-salesmgr-techcorp-006',
        email: 'emma.sales@techcorp.com',
        firstName: 'Emma',
        lastName: 'Rodriguez',
        phone: '+1-555-0006',
        status: 'active',
        attributes: {
          role: 'manager',
          clearanceLevel: 'medium',
          department: 'sales',
          employeeId: 'TC006',
          title: 'Sales Manager',
          hireDate: '2021-09-01',
          location: 'New York, NY',
          quota: 2000000
        },
        memberships: [
          {
            organizationCode: 'SALES_DIV',
            role: 'manager',
            attributes: { territory: 'east_coast', quota: 2000000 }
          },
          {
            organizationCode: 'ENT_SALES',
            role: 'lead',
            attributes: { focus: 'enterprise_accounts' }
          }
        ]
      },

      // RetailMax Enterprises Users
      {
        cognitoId: 'cognito-ceo-retailmax-007',
        email: 'david.ceo@retailmax.com',
        firstName: 'David',
        lastName: 'Thompson',
        phone: '+1-555-0007',
        status: 'active',
        attributes: {
          role: 'executive',
          clearanceLevel: 'top-secret',
          department: 'executive',
          employeeId: 'RM001',
          title: 'Chief Executive Officer',
          hireDate: '2018-01-01',
          location: 'Chicago, IL'
        },
        memberships: [
          {
            organizationCode: 'RETAILMAX',
            role: 'admin',
            attributes: { title: 'CEO', scope: 'global' }
          }
        ]
      },
      {
        cognitoId: 'cognito-regional-retailmax-008',
        email: 'lisa.na@retailmax.com',
        firstName: 'Lisa',
        lastName: 'Park',
        phone: '+1-555-0008',
        status: 'active',
        attributes: {
          role: 'director',
          clearanceLevel: 'high',
          department: 'operations',
          employeeId: 'RM002',
          title: 'Regional Director - North America',
          hireDate: '2019-03-15',
          location: 'Chicago, IL'
        },
        memberships: [
          {
            organizationCode: 'NA_REGION',
            role: 'director',
            attributes: { region: 'north_america', stores: 250 }
          },
          {
            organizationCode: 'US_EAST',
            role: 'manager',
            attributes: { stores: 120 }
          },
          {
            organizationCode: 'US_WEST',
            role: 'manager',
            attributes: { stores: 100 }
          }
        ]
      },
      {
        cognitoId: 'cognito-ops-retailmax-009',
        email: 'james.ops@retailmax.com',
        firstName: 'James',
        lastName: 'Wilson',
        phone: '+1-555-0009',
        status: 'active',
        attributes: {
          role: 'manager',
          clearanceLevel: 'medium',
          department: 'operations',
          employeeId: 'RM003',
          title: 'Operations Manager',
          hireDate: '2020-07-01',
          location: 'Chicago, IL'
        },
        memberships: [
          {
            organizationCode: 'OPS_DIV',
            role: 'manager',
            attributes: { focus: 'supply_chain', warehouses: 25 }
          },
          {
            organizationCode: 'SUPPLY_CHAIN',
            role: 'lead',
            attributes: { suppliers: 500 }
          }
        ]
      },

      // FinanceFlow Solutions Users
      {
        cognitoId: 'cognito-founder-finflow-010',
        email: 'alex.founder@financeflow.com',
        firstName: 'Alex',
        lastName: 'Kumar',
        phone: '+1-555-0010',
        status: 'active',
        attributes: {
          role: 'executive',
          clearanceLevel: 'top-secret',
          department: 'executive',
          employeeId: 'FF001',
          title: 'Founder & CEO',
          hireDate: '2018-06-01',
          location: 'Austin, TX'
        },
        memberships: [
          {
            organizationCode: 'FINFLOW',
            role: 'admin',
            attributes: { title: 'Founder & CEO', equity: 35 }
          }
        ]
      },
      {
        cognitoId: 'cognito-cto-finflow-011',
        email: 'priya.cto@financeflow.com',
        firstName: 'Priya',
        lastName: 'Patel',
        phone: '+1-555-0011',
        status: 'active',
        attributes: {
          role: 'executive',
          clearanceLevel: 'high',
          department: 'engineering',
          employeeId: 'FF002',
          title: 'Chief Technology Officer',
          hireDate: '2018-08-15',
          location: 'Austin, TX'
        },
        memberships: [
          {
            organizationCode: 'FINFLOW',
            role: 'executive',
            attributes: { title: 'CTO', equity: 15 }
          },
          {
            organizationCode: 'PROD_ENG',
            role: 'director',
            attributes: { title: 'Engineering Director', microservices: 45 }
          }
        ]
      },
      {
        cognitoId: 'cognito-risk-finflow-012',
        email: 'carlos.risk@financeflow.com',
        firstName: 'Carlos',
        lastName: 'Martinez',
        phone: '+1-555-0012',
        status: 'active',
        attributes: {
          role: 'director',
          clearanceLevel: 'high',
          department: 'risk',
          employeeId: 'FF003',
          title: 'Risk & Compliance Director',
          hireDate: '2019-02-01',
          location: 'Austin, TX',
          certifications: ['frm', 'cisa', 'cism']
        },
        memberships: [
          {
            organizationCode: 'RISK_COMP',
            role: 'director',
            attributes: { frameworks: ['basel', 'coso'], clearances: ['pci_dss'] }
          }
        ]
      },

      // Cross-organization consultant
      {
        cognitoId: 'cognito-consultant-001',
        email: 'jane.consultant@external.com',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+1-555-0099',
        status: 'active',
        attributes: {
          role: 'consultant',
          clearanceLevel: 'medium',
          department: 'external',
          contractorId: 'EXT001',
          title: 'Senior Business Consultant',
          startDate: '2023-01-01',
          endDate: '2024-12-31',
          specialization: 'digital_transformation'
        },
        memberships: [
          {
            organizationCode: 'TECHCORP',
            role: 'consultant',
            attributes: { project: 'digital_transformation', access: 'limited' }
          },
          {
            organizationCode: 'RETAILMAX',
            role: 'consultant',
            attributes: { project: 'omnichannel_strategy', access: 'limited' }
          }
        ]
      }
    ];

    // Create users and their memberships
    for (const userInfo of userData) {
      const user = await this.createUser(userInfo);
      await this.createMemberships(user, userInfo.memberships);
    }

    this.logger.log('User seeding completed successfully');
    this.logger.log(`Created ${userData.length} users with organization memberships`);
  }

  private async createUser(userInfo: UserSeedData): Promise<User> {
    const user = this.userRepository.create({
      cognitoId: userInfo.cognitoId,
      email: userInfo.email,
      firstName: userInfo.firstName,
      lastName: userInfo.lastName,
      phone: userInfo.phone,
      status: userInfo.status,
      attributes: userInfo.attributes || {},
      isActive: userInfo.status === 'active',
    });

    const savedUser = await this.userRepository.save(user);
    this.logger.debug(`Created user: ${userInfo.firstName} ${userInfo.lastName} (${userInfo.email})`);
    
    return savedUser;
  }

  private async createMemberships(
    user: User, 
    memberships: Array<{organizationCode: string, role: string, attributes?: Record<string, any>}>
  ): Promise<void> {
    for (const membershipInfo of memberships) {
      // Find organization by code
      const organization = await this.organizationRepository.findOne({
        where: { code: membershipInfo.organizationCode }
      });

      if (!organization) {
        this.logger.warn(`Organization not found: ${membershipInfo.organizationCode}`);
        continue;
      }

      const membership = this.membershipRepository.create({
        user,
        organization,
        role: membershipInfo.role,
        attributes: membershipInfo.attributes || {},
        isActive: true,
      });

      await this.membershipRepository.save(membership);
      this.logger.debug(`Created membership: ${user.email} -> ${organization.name} (${membershipInfo.role})`);
    }
  }
}