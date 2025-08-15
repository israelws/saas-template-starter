import { DataSource } from 'typeorm';
import { Organization } from '../../modules/organizations/entities/organization.entity';
import { Policy } from '../../modules/abac/entities/policy.entity';
import { PolicySet } from '../../modules/abac/entities/policy-set.entity';
import { UserRole as UserRoleEntity } from '../../modules/users/entities/user-role.entity';
import { UserOrganizationMembership } from '../../modules/users/entities/user-organization-membership.entity';
import { UserRole } from '@saas-template/shared';
import { config } from 'dotenv';
import { LoggerService } from '../../common/logger/logger.service';
import { PolicySeeder } from './policy.seeder';

// Load environment variables
config({ path: `.env.${process.env.NODE_ENV || 'dev'}` });

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'saas_template',
  entities: [
    Organization,
    Policy,
    PolicySet,
    UserRoleEntity,
    UserOrganizationMembership,
  ],
  synchronize: false,
});

async function restorePoliciesAndRoles() {
  const logger = new LoggerService('PolicyRestorer');

  try {
    await AppDataSource.initialize();
    logger.log('Database connection initialized');

    // Check current state
    const policyRepository = AppDataSource.getRepository(Policy);
    const policySetRepository = AppDataSource.getRepository(PolicySet);
    const userRoleRepository = AppDataSource.getRepository(UserRoleEntity);
    const membershipRepository = AppDataSource.getRepository(UserOrganizationMembership);
    
    const currentPolicies = await policyRepository.count();
    const currentPolicySets = await policySetRepository.count();
    const currentRoles = await userRoleRepository.count();
    const currentMemberships = await membershipRepository.count();
    
    logger.log(`Current state:`);
    logger.log(`- Policies: ${currentPolicies}`);
    logger.log(`- Policy Sets: ${currentPolicySets}`);
    logger.log(`- User Roles: ${currentRoles}`);
    logger.log(`- User Memberships: ${currentMemberships}`);

    // Only restore policies if they're missing
    if (currentPolicies === 0 && currentPolicySets === 0) {
      logger.log('\n🛡️ Restoring policies and policy sets...');
      
      const policySeeder = new PolicySeeder(AppDataSource);
      await policySeeder.seed();
      
      logger.log('✅ Policies restored successfully!');
    } else {
      logger.log('⚠️ Policies already exist, skipping policy restoration');
    }

    // Update user memberships to ensure they have roles
    if (currentMemberships > 0) {
      logger.log('\n👥 Updating user membership roles...');
      
      // Update existing memberships that don't have roles assigned
      const membershipsWithoutRoles = await membershipRepository.find({
        where: { role: null as any },
        relations: ['user', 'organization'],
      });
      
      if (membershipsWithoutRoles.length > 0) {
        logger.log(`Found ${membershipsWithoutRoles.length} memberships without roles`);
        
        for (const membership of membershipsWithoutRoles) {
          // Assign default role based on user email or organization
          let role = UserRole.USER; // default role
          
          if (membership.user?.email?.includes('admin')) {
            role = UserRole.ADMIN;
          } else if (membership.user?.email?.includes('manager')) {
            role = UserRole.MANAGER;
          } else if (membership.user?.email?.includes('executive') || membership.user?.email?.includes('cto')) {
            role = UserRole.ADMIN;
          }
          
          membership.role = role;
          await membershipRepository.save(membership);
          logger.log(`Assigned role '${role}' to ${membership.user?.email}`);
        }
      } else {
        logger.log('All memberships already have roles assigned');
      }
    }

    // Final count
    const finalPolicies = await policyRepository.count();
    const finalPolicySets = await policySetRepository.count();
    const finalRoles = await userRoleRepository.count();
    const finalMemberships = await membershipRepository.count();
    
    logger.log('\n📊 Final state:');
    logger.log(`- Policies: ${finalPolicies}`);
    logger.log(`- Policy Sets: ${finalPolicySets}`);
    logger.log(`- User Roles: ${finalRoles}`);
    logger.log(`- User Memberships: ${finalMemberships}`);
    
    await AppDataSource.destroy();
    logger.log('\n✅ Restoration completed successfully!');
  } catch (error) {
    console.error('Error restoring policies and roles:', error);
    process.exit(1);
  }
}

// Run the restoration
restorePoliciesAndRoles();