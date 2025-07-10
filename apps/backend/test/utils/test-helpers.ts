import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Organization } from '../../src/modules/organizations/entities/organization.entity';
import { User } from '../../src/modules/users/entities/user.entity';
import { UserOrganizationMembership } from '../../src/modules/users/entities/user-organization-membership.entity';
import { Policy } from '../../src/modules/abac/entities/policy.entity';
import { PolicySet } from '../../src/modules/abac/entities/policy-set.entity';
import { AttributeDefinition } from '../../src/modules/abac/entities/attribute-definition.entity';
import { Product } from '../../src/modules/products/entities/product.entity';
import { Customer } from '../../src/modules/customers/entities/customer.entity';
import { Order } from '../../src/modules/orders/entities/order.entity';
import { OrderItem } from '../../src/modules/orders/entities/order-item.entity';
import { Transaction } from '../../src/modules/transactions/entities/transaction.entity';

export class TestDatabaseModule {
  static forRoot() {
    return TypeOrmModule.forRoot({
      type: 'sqlite',
      database: ':memory:',
      entities: [
        Organization,
        User,
        UserOrganizationMembership,
        Policy,
        PolicySet,
        AttributeDefinition,
        Product,
        Customer,
        Order,
        OrderItem,
        Transaction,
      ],
      synchronize: true,
      logging: false,
    });
  }

  static forFeature(entities: any[]) {
    return TypeOrmModule.forFeature(entities);
  }
}

export const createTestingModule = async (providers: any[] = [], imports: any[] = []) => {
  const module: TestingModule = await Test.createTestingModule({
    imports: [
      TestDatabaseModule.forRoot(),
      ...imports,
    ],
    providers,
  }).compile();

  return module;
};

export const cleanupDatabase = async (dataSource: DataSource) => {
  const entities = dataSource.entityMetadatas;
  
  for (const entity of entities) {
    const repository = dataSource.getRepository(entity.name);
    await repository.clear();
  }
};

export const createMockUser = (overrides: Partial<User> = {}): User => {
  const user = new User();
  user.id = overrides.id || 'test-user-id';
  user.cognitoId = overrides.cognitoId || 'cognito-test-123';
  user.email = overrides.email || 'test@example.com';
  user.firstName = overrides.firstName || 'Test';
  user.lastName = overrides.lastName || 'User';
  user.status = overrides.status || 'active';
  user.attributes = overrides.attributes || {};
  user.isActive = overrides.isActive !== undefined ? overrides.isActive : true;
  user.createdAt = overrides.createdAt || new Date();
  user.updatedAt = overrides.updatedAt || new Date();
  return user;
};

export const createMockOrganization = (overrides: Partial<Organization> = {}): Organization => {
  const org = new Organization();
  org.id = overrides.id || 'test-org-id';
  org.name = overrides.name || 'Test Organization';
  org.code = overrides.code || 'TEST_ORG';
  org.description = overrides.description || 'Test organization description';
  org.type = overrides.type || 'company';
  org.status = overrides.status || 'active';
  org.settings = overrides.settings || {};
  org.isActive = overrides.isActive !== undefined ? overrides.isActive : true;
  org.createdAt = overrides.createdAt || new Date();
  org.updatedAt = overrides.updatedAt || new Date();
  org.parent = overrides.parent || null;
  org.children = overrides.children || [];
  return org;
};

export const createMockPolicy = (overrides: Partial<Policy> = {}): Policy => {
  const policy = new Policy();
  policy.id = overrides.id || 'test-policy-id';
  policy.name = overrides.name || 'Test Policy';
  policy.description = overrides.description || 'Test policy description';
  policy.resource = overrides.resource || 'test:resource';
  policy.action = overrides.action || ['read'];
  policy.effect = overrides.effect || 'allow';
  policy.conditions = overrides.conditions || {};
  policy.priority = overrides.priority || 50;
  policy.status = overrides.status || 'active';
  policy.isActive = overrides.isActive !== undefined ? overrides.isActive : true;
  policy.createdAt = overrides.createdAt || new Date();
  policy.updatedAt = overrides.updatedAt || new Date();
  return policy;
};

export const createMockPolicySet = (overrides: Partial<PolicySet> = {}): PolicySet => {
  const policySet = new PolicySet();
  policySet.id = overrides.id || 'test-policyset-id';
  policySet.name = overrides.name || 'Test Policy Set';
  policySet.description = overrides.description || 'Test policy set description';
  policySet.priority = overrides.priority || 50;
  policySet.status = overrides.status || 'active';
  policySet.isActive = overrides.isActive !== undefined ? overrides.isActive : true;
  policySet.createdAt = overrides.createdAt || new Date();
  policySet.updatedAt = overrides.updatedAt || new Date();
  policySet.policies = overrides.policies || [];
  return policySet;
};

export const createMockAttributeDefinition = (overrides: Partial<AttributeDefinition> = {}): AttributeDefinition => {
  const attr = new AttributeDefinition();
  attr.id = overrides.id || 'test-attr-id';
  attr.name = overrides.name || 'Test Attribute';
  attr.key = overrides.key || 'test_attribute';
  attr.type = overrides.type || 'string';
  attr.category = overrides.category || 'subject';
  attr.description = overrides.description || 'Test attribute description';
  attr.required = overrides.required !== undefined ? overrides.required : false;
  attr.defaultValue = overrides.defaultValue;
  attr.validationRules = overrides.validationRules || {};
  attr.isActive = overrides.isActive !== undefined ? overrides.isActive : true;
  attr.createdAt = overrides.createdAt || new Date();
  attr.updatedAt = overrides.updatedAt || new Date();
  return attr;
};

export const createMockProduct = (overrides: Partial<Product> = {}): Product => {
  const product = new Product();
  product.id = overrides.id || 'test-product-id';
  product.name = overrides.name || 'Test Product';
  product.description = overrides.description || 'Test product description';
  product.sku = overrides.sku || 'TEST-001';
  product.price = overrides.price || 99.99;
  product.stockQuantity = overrides.stockQuantity || 100;
  product.status = overrides.status || 'active';
  product.attributes = overrides.attributes || {};
  product.isActive = overrides.isActive !== undefined ? overrides.isActive : true;
  product.createdAt = overrides.createdAt || new Date();
  product.updatedAt = overrides.updatedAt || new Date();
  return product;
};

export const createMockCustomer = (overrides: Partial<Customer> = {}): Customer => {
  const customer = new Customer();
  customer.id = overrides.id || 'test-customer-id';
  customer.name = overrides.name || 'Test Customer';
  customer.email = overrides.email || 'customer@example.com';
  customer.phone = overrides.phone || '+1-555-0123';
  customer.address = overrides.address || '123 Test St, Test City, TC 12345';
  customer.balance = overrides.balance || 0;
  customer.status = overrides.status || 'active';
  customer.attributes = overrides.attributes || {};
  customer.isActive = overrides.isActive !== undefined ? overrides.isActive : true;
  customer.createdAt = overrides.createdAt || new Date();
  customer.updatedAt = overrides.updatedAt || new Date();
  return customer;
};

export const mockAbacContext = {
  subject: {
    id: 'test-user-id',
    attributes: {
      role: 'admin',
      clearanceLevel: 'high',
      department: 'engineering'
    },
    organizationId: 'test-org-id',
    authenticated: true
  },
  resource: {
    id: 'test-resource-id',
    type: 'organization',
    attributes: {
      owner: 'test-user-id',
      classificationLevel: 'internal'
    }
  },
  environment: {
    time: new Date().toISOString(),
    ipAddress: '192.168.1.100',
    location: {
      country: 'US',
      state: 'CA'
    }
  },
  action: 'read'
};

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));