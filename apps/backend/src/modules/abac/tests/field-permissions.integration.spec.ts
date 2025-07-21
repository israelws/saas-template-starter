import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { AppModule } from '../../../app.module';
import { UsersService } from '../../users/users.service';
import { PolicyService } from '../services/policy.service';
import { Organization } from '../../organizations/entities/organization.entity';
import { User } from '../../users/entities/user.entity';
import { Policy } from '../entities/policy.entity';
import { PolicyFieldRule, FieldPermissionType } from '../entities/policy-field-rule.entity';
import { Product } from '../../products/entities/product.entity';

describe('Field Permissions Integration Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let usersService: UsersService;
  let policyService: PolicyService;
  let jwtService: JwtService;
  
  let testOrganization: Organization;
  let adminUser: User;
  let agentUser: User;
  let customerUser: User;
  let testProduct: Product;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
    usersService = moduleFixture.get<UsersService>(UsersService);
    policyService = moduleFixture.get<PolicyService>(PolicyService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    // Set up test data
    await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  async function setupTestData() {
    // Create test organization
    testOrganization = await dataSource.getRepository(Organization).save({
      name: 'Test Insurance Agency',
      type: 'agency',
      status: 'active',
    });

    // Create test users
    adminUser = await dataSource.getRepository(User).save({
      email: 'admin@test.com',
      cognitoId: 'admin-cognito-123',
      status: 'active',
    });

    agentUser = await dataSource.getRepository(User).save({
      email: 'agent@test.com',
      cognitoId: 'agent-cognito-123',
      status: 'active',
    });

    customerUser = await dataSource.getRepository(User).save({
      email: 'customer@test.com',
      cognitoId: 'customer-cognito-123',
      status: 'active',
    });

    // Assign roles
    await usersService.assignRole(
      adminUser.id,
      testOrganization.id,
      'admin',
      adminUser.id,
      { priority: 300 }
    );

    await usersService.assignRole(
      agentUser.id,
      testOrganization.id,
      'agent',
      adminUser.id,
      { priority: 100 }
    );

    await usersService.assignRole(
      customerUser.id,
      testOrganization.id,
      'customer',
      adminUser.id,
      { priority: 50 }
    );

    // Create test product with sensitive fields
    testProduct = await dataSource.getRepository(Product).save({
      organizationId: testOrganization.id,
      name: 'Premium Insurance Package',
      description: 'Comprehensive coverage',
      sku: 'INS-PREM-001',
      price: 199.99,
      costPrice: 120.00, // Sensitive field
      profitMargin: 0.4, // Sensitive field
      supplierNotes: 'Confidential supplier info', // Sensitive field
      quantity: 100,
      reservedQuantity: 0,
      lowStockThreshold: 10,
      trackInventory: true,
      status: 'active',
    });

    // Create field permission policies
    await createFieldPermissionPolicies();
  }

  async function createFieldPermissionPolicies() {
    // Agent policy - limited access to product fields
    const agentPolicy = await dataSource.getRepository(Policy).save({
      name: 'Agent - Limited Product Access',
      organizationId: testOrganization.id,
      effect: 'Allow',
      priority: 100,
      subjects: {
        roles: ['agent'],
      },
      resources: {
        types: ['Product'],
      },
      actions: ['read', 'list'],
      fieldPermissions: {
        Product: {
          readable: ['id', 'name', 'description', 'sku', 'price', 'quantity', 'status'],
          denied: ['costPrice', 'profitMargin', 'supplierNotes'],
        },
      },
      isActive: true,
    });

    // Add field rules for agent policy
    await dataSource.getRepository(PolicyFieldRule).save([
      {
        policyId: agentPolicy.id,
        resourceType: 'Product',
        fieldName: 'costPrice',
        permission: FieldPermissionType.DENY,
      },
      {
        policyId: agentPolicy.id,
        resourceType: 'Product',
        fieldName: 'profitMargin',
        permission: FieldPermissionType.DENY,
      },
      {
        policyId: agentPolicy.id,
        resourceType: 'Product',
        fieldName: 'supplierNotes',
        permission: FieldPermissionType.DENY,
      },
    ]);

    // Admin policy - full access
    await dataSource.getRepository(Policy).save({
      name: 'Admin - Full Access',
      organizationId: testOrganization.id,
      effect: 'Allow',
      priority: 50,
      subjects: {
        roles: ['admin'],
      },
      resources: {
        types: ['*'],
      },
      actions: ['*'],
      fieldPermissions: {
        '*': {
          readable: ['*'],
          writable: ['*'],
        },
      },
      isActive: true,
    });

    // Customer policy - very limited access
    await dataSource.getRepository(Policy).save({
      name: 'Customer - Public Fields Only',
      organizationId: testOrganization.id,
      effect: 'Allow',
      priority: 150,
      subjects: {
        roles: ['customer'],
      },
      resources: {
        types: ['Product'],
      },
      actions: ['read', 'list'],
      fieldPermissions: {
        Product: {
          readable: ['id', 'name', 'description', 'price'],
          denied: ['*'], // Deny everything else
        },
      },
      isActive: true,
    });
  }

  async function cleanupTestData() {
    // Clean up in reverse order of creation
    await dataSource.getRepository(PolicyFieldRule).delete({});
    await dataSource.getRepository(Policy).delete({ organizationId: testOrganization.id });
    await dataSource.getRepository(Product).delete({ organizationId: testOrganization.id });
    await usersService.removeRole(adminUser.id, testOrganization.id, 'admin');
    await usersService.removeRole(agentUser.id, testOrganization.id, 'agent');
    await usersService.removeRole(customerUser.id, testOrganization.id, 'customer');
    await dataSource.getRepository(User).delete([adminUser.id, agentUser.id, customerUser.id]);
    await dataSource.getRepository(Organization).delete(testOrganization.id);
  }

  function generateToken(user: User): string {
    return jwtService.sign({
      sub: user.cognitoId,
      email: user.email,
      userId: user.id,
    });
  }

  describe('Product Field Permissions', () => {
    it('should return all fields for admin user', async () => {
      const token = generateToken(adminUser);
      
      const response = await request(app.getHttpServer())
        .get(`/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${token}`)
        .set('x-organization-id', testOrganization.id)
        .expect(200);

      // Admin should see all fields
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('price');
      expect(response.body).toHaveProperty('costPrice', 120.00);
      expect(response.body).toHaveProperty('profitMargin', 0.4);
      expect(response.body).toHaveProperty('supplierNotes');
    });

    it('should filter sensitive fields for agent user', async () => {
      const token = generateToken(agentUser);
      
      const response = await request(app.getHttpServer())
        .get(`/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${token}`)
        .set('x-organization-id', testOrganization.id)
        .expect(200);

      // Agent should see basic fields
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('price');
      expect(response.body).toHaveProperty('quantity');
      
      // Agent should NOT see sensitive fields
      expect(response.body).not.toHaveProperty('costPrice');
      expect(response.body).not.toHaveProperty('profitMargin');
      expect(response.body).not.toHaveProperty('supplierNotes');
    });

    it('should return only public fields for customer user', async () => {
      const token = generateToken(customerUser);
      
      const response = await request(app.getHttpServer())
        .get(`/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${token}`)
        .set('x-organization-id', testOrganization.id)
        .expect(200);

      // Customer should only see public fields
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('description');
      expect(response.body).toHaveProperty('price');
      
      // Customer should NOT see any other fields
      expect(response.body).not.toHaveProperty('sku');
      expect(response.body).not.toHaveProperty('quantity');
      expect(response.body).not.toHaveProperty('costPrice');
      expect(response.body).not.toHaveProperty('profitMargin');
    });

    it('should check field permissions endpoint', async () => {
      const token = generateToken(agentUser);
      
      const response = await request(app.getHttpServer())
        .get(`/products/${testProduct.id}/field-permissions`)
        .set('Authorization', `Bearer ${token}`)
        .set('x-organization-id', testOrganization.id)
        .expect(200);

      expect(response.body).toEqual({
        resourceType: 'Product',
        resourceId: testProduct.id,
        permissions: {
          readable: ['id', 'name', 'description', 'sku', 'price', 'quantity', 'status'],
          writable: expect.any(Array),
          denied: ['costPrice', 'profitMargin', 'supplierNotes'],
        },
        canDelete: false,
        canApprove: false,
      });
    });
  });

  describe('Multi-Role Scenarios', () => {
    it('should handle user with multiple roles correctly', async () => {
      // Give agent user an additional manager role
      await usersService.assignRole(
        agentUser.id,
        testOrganization.id,
        'manager',
        adminUser.id,
        { priority: 200 } // Higher priority than agent
      );

      // Create manager policy with more permissions
      await dataSource.getRepository(Policy).save({
        name: 'Manager - Enhanced Access',
        organizationId: testOrganization.id,
        effect: 'Allow',
        priority: 80,
        subjects: {
          roles: ['manager'],
        },
        resources: {
          types: ['Product'],
        },
        actions: ['read', 'list', 'update'],
        fieldPermissions: {
          Product: {
            readable: ['*'],
            denied: ['supplierNotes'], // Can see cost/profit but not supplier notes
          },
        },
        isActive: true,
      });

      const token = generateToken(agentUser);
      
      const response = await request(app.getHttpServer())
        .get(`/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${token}`)
        .set('x-organization-id', testOrganization.id)
        .expect(200);

      // With manager role, should now see cost and profit
      expect(response.body).toHaveProperty('costPrice');
      expect(response.body).toHaveProperty('profitMargin');
      // But still not supplier notes
      expect(response.body).not.toHaveProperty('supplierNotes');

      // Clean up
      await usersService.removeRole(agentUser.id, testOrganization.id, 'manager');
    });
  });

  describe('Field Filtering in Lists', () => {
    it('should filter fields in product list based on role', async () => {
      const token = generateToken(agentUser);
      
      const response = await request(app.getHttpServer())
        .get('/products')
        .query({ organizationId: testOrganization.id })
        .set('Authorization', `Bearer ${token}`)
        .set('x-organization-id', testOrganization.id)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      const product = response.body.data[0];
      // Agent should see allowed fields
      expect(product).toHaveProperty('name');
      expect(product).toHaveProperty('price');
      // But not sensitive fields
      expect(product).not.toHaveProperty('costPrice');
      expect(product).not.toHaveProperty('profitMargin');
    });
  });
});