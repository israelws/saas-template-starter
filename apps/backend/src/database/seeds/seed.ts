import { DataSource } from 'typeorm';
import { Organization } from '../../modules/organizations/entities/organization.entity';
import { User } from '../../modules/users/entities/user.entity';
import { UserOrganizationMembership } from '../../modules/users/entities/user-organization-membership.entity';
import { UserAttribute } from '../../modules/users/entities/user-attribute.entity';
import { Policy } from '../../modules/abac/entities/policy.entity';
import { PolicySet } from '../../modules/abac/entities/policy-set.entity';
import { Product } from '../../modules/products/entities/product.entity';
import { Customer } from '../../modules/customers/entities/customer.entity';
import { Order } from '../../modules/orders/entities/order.entity';
import { OrderItem } from '../../modules/orders/entities/order-item.entity';
import { Transaction } from '../../modules/transactions/entities/transaction.entity';
import { AttributeDefinition } from '../../modules/abac/entities/attribute-definition.entity';
import { PolicyFieldRule } from '../../modules/abac/entities/policy-field-rule.entity';
import { config } from 'dotenv';
import { LoggerService } from '../../common/logger/logger.service';
import { OrganizationSeeder } from './organization.seeder';
import { UserSeeder } from './user.seeder';
import { PolicySeeder } from './policy.seeder';
import { AttributeSeeder } from './attribute.seeder';
import { BusinessObjectSeeder } from './business-object.seeder';

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
    User,
    UserOrganizationMembership,
    UserAttribute,
    Policy,
    PolicySet,
    PolicyFieldRule,
    Product,
    Customer,
    Order,
    OrderItem,
    Transaction,
    AttributeDefinition,
  ],
  synchronize: false,
});

async function seed() {
  const logger = new LoggerService('DatabaseSeeder');

  try {
    await AppDataSource.initialize();
    logger.log('Database connection initialized');

    // Initialize seeders
    const organizationSeeder = new OrganizationSeeder(AppDataSource);
    const attributeSeeder = new AttributeSeeder(AppDataSource);
    const userSeeder = new UserSeeder(AppDataSource);
    const policySeeder = new PolicySeeder(AppDataSource);
    const businessObjectSeeder = new BusinessObjectSeeder(AppDataSource);

    // Run seeders in order (dependencies matter)
    logger.log('🌱 Starting database seeding...');

    logger.log('📁 Seeding organizations...');
    await organizationSeeder.seed();

    logger.log('🔖 Seeding attribute definitions...');
    await attributeSeeder.seed();

    logger.log('👥 Seeding users and memberships...');
    await userSeeder.seed();

    logger.log('🛡️ Seeding policies and policy sets...');
    await policySeeder.seed();

    logger.log('💼 Seeding business objects...');
    await businessObjectSeeder.seed();

    logger.log('\n✅ All seed data created successfully!');
    logger.log('\n📊 Summary:');
    logger.log('- Organizations: TechCorp Global, RetailMax Enterprises, FinanceFlow Solutions');
    logger.log('- Users: Admins, Managers, Employees across all organizations');
    logger.log('- Policies: Comprehensive ABAC policies with inheritance');
    logger.log('- Business Objects: Products, Customers, Orders, Transactions');
    logger.log('\n🎯 Demo credentials and access information logged above.');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error seeding database:', error);
    logger.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seed();
