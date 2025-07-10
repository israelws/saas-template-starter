import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import request from 'supertest';
import { OrganizationsModule } from '../../src/modules/organizations/organizations.module';
import { UsersModule } from '../../src/modules/users/users.module';
import { AbacModule } from '../../src/modules/abac/abac.module';
import { LoggerModule } from '../../src/common/logger/logger.module';
import { CacheModule } from '../../src/common/cache/cache.module';
import { Organization } from '../../src/modules/organizations/entities/organization.entity';
import { User } from '../../src/modules/users/entities/user.entity';
import { TestDatabaseModule, cleanupDatabase, createMockUser, createMockOrganization } from '../utils/test-helpers';
import { DataSource, Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('Organizations Integration', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let organizationRepository: Repository<Organization>;
  let userRepository: Repository<User>;
  let authToken: string;
  let testUser: User;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        TestDatabaseModule.forRoot(),
        LoggerModule,
        CacheModule,
        OrganizationsModule,
        UsersModule,
        AbacModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    dataSource = moduleFixture.get<DataSource>(DataSource);
    organizationRepository = moduleFixture.get<Repository<Organization>>(getRepositoryToken(Organization));
    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    
    await app.init();
  });

  beforeEach(async () => {
    await cleanupDatabase(dataSource);
    
    // Create test user and auth token
    testUser = await userRepository.save(
      createMockUser({
        id: 'test-user-id',
        email: 'test@example.com',
        attributes: { role: 'admin', clearanceLevel: 'high' },
      })
    );

    // Mock JWT token (in real tests, you'd generate a proper JWT)
    authToken = 'mock-jwt-token';

    // Mock JWT verification middleware
    jest.spyOn(require('../../src/modules/auth/guards/jwt-auth.guard'), 'JwtAuthGuard')
      .mockImplementation(() => ({
        canActivate: () => true,
      }));
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /organizations', () => {
    it('should create a new organization', async () => {
      const createDto = {
        name: 'Test Organization',
        code: 'TEST_ORG',
        description: 'Test organization description',
        type: 'company',
        settings: { industry: 'technology' },
      };

      const response = await request(app.getHttpServer())
        .post('/organizations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createDto)
        .expect(201);

      expect(response.body).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: 'Test Organization',
          code: 'TEST_ORG',
          description: 'Test organization description',
          type: 'company',
          status: 'active',
          isActive: true,
          settings: { industry: 'technology' },
        })
      );

      // Verify organization was saved to database
      const savedOrg = await organizationRepository.findOne({
        where: { code: 'TEST_ORG' },
      });
      expect(savedOrg).toBeDefined();
      expect(savedOrg?.name).toBe('Test Organization');
    });

    it('should create organization with parent', async () => {
      // Create parent organization first
      const parentOrg = await organizationRepository.save(
        createMockOrganization({
          name: 'Parent Organization',
          code: 'PARENT_ORG',
          type: 'company',
        })
      );

      const createDto = {
        name: 'Child Organization',
        code: 'CHILD_ORG',
        description: 'Child organization',
        type: 'division',
        parentId: parentOrg.id,
      };

      const response = await request(app.getHttpServer())
        .post('/organizations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createDto)
        .expect(201);

      expect(response.body.parent).toEqual(
        expect.objectContaining({
          id: parentOrg.id,
          name: 'Parent Organization',
        })
      );
    });

    it('should return 409 for duplicate organization code', async () => {
      // Create existing organization
      await organizationRepository.save(
        createMockOrganization({
          name: 'Existing Organization',
          code: 'EXISTING_CODE',
        })
      );

      const createDto = {
        name: 'New Organization',
        code: 'EXISTING_CODE', // Duplicate code
        description: 'New organization',
        type: 'company',
      };

      await request(app.getHttpServer())
        .post('/organizations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createDto)
        .expect(409);
    });

    it('should return 400 for missing required fields', async () => {
      const createDto = {
        name: 'Test Organization',
        // Missing code, description, type
      };

      await request(app.getHttpServer())
        .post('/organizations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createDto)
        .expect(400);
    });

    it('should return 404 for non-existent parent', async () => {
      const createDto = {
        name: 'Child Organization',
        code: 'CHILD_ORG',
        description: 'Child organization',
        type: 'division',
        parentId: 'non-existent-parent-id',
      };

      await request(app.getHttpServer())
        .post('/organizations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createDto)
        .expect(404);
    });
  });

  describe('GET /organizations', () => {
    beforeEach(async () => {
      // Create test organizations
      const org1 = createMockOrganization({
        name: 'Organization 1',
        code: 'ORG1',
        type: 'company',
        status: 'active',
      });
      const org2 = createMockOrganization({
        name: 'Organization 2',
        code: 'ORG2',
        type: 'division',
        status: 'active',
      });
      const org3 = createMockOrganization({
        name: 'Inactive Organization',
        code: 'ORG3',
        type: 'company',
        status: 'inactive',
      });

      await organizationRepository.save([org1, org2, org3]);
    });

    it('should return paginated organizations', async () => {
      const response = await request(app.getHttpServer())
        .get('/organizations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual({
        data: expect.arrayContaining([
          expect.objectContaining({ name: 'Organization 1' }),
          expect.objectContaining({ name: 'Organization 2' }),
          expect.objectContaining({ name: 'Inactive Organization' }),
        ]),
        total: 3,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should filter organizations by type', async () => {
      const response = await request(app.getHttpServer())
        .get('/organizations?type=company')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every((org: any) => org.type === 'company')).toBe(true);
    });

    it('should filter organizations by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/organizations?status=active')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every((org: any) => org.status === 'active')).toBe(true);
    });

    it('should search organizations by name', async () => {
      const response = await request(app.getHttpServer())
        .get('/organizations?name=Organization 1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Organization 1');
    });

    it('should apply pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/organizations?page=1&limit=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(2);
      expect(response.body.totalPages).toBe(2);
    });
  });

  describe('GET /organizations/:id', () => {
    let testOrganization: Organization;

    beforeEach(async () => {
      testOrganization = await organizationRepository.save(
        createMockOrganization({
          name: 'Test Organization',
          code: 'TEST_ORG',
        })
      );
    });

    it('should return organization by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/organizations/${testOrganization.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          id: testOrganization.id,
          name: 'Test Organization',
          code: 'TEST_ORG',
        })
      );
    });

    it('should return 404 for non-existent organization', async () => {
      await request(app.getHttpServer())
        .get('/organizations/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PATCH /organizations/:id', () => {
    let testOrganization: Organization;

    beforeEach(async () => {
      testOrganization = await organizationRepository.save(
        createMockOrganization({
          name: 'Original Name',
          code: 'ORIGINAL_CODE',
          description: 'Original description',
        })
      );
    });

    it('should update organization', async () => {
      const updateDto = {
        name: 'Updated Name',
        description: 'Updated description',
        settings: { key: 'updated-value' },
      };

      const response = await request(app.getHttpServer())
        .patch(`/organizations/${testOrganization.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          id: testOrganization.id,
          name: 'Updated Name',
          description: 'Updated description',
          code: 'ORIGINAL_CODE', // Should remain unchanged
          settings: { key: 'updated-value' },
        })
      );

      // Verify changes were persisted
      const updatedOrg = await organizationRepository.findOne({
        where: { id: testOrganization.id },
      });
      expect(updatedOrg?.name).toBe('Updated Name');
    });

    it('should return 404 for non-existent organization', async () => {
      const updateDto = { name: 'Updated Name' };

      await request(app.getHttpServer())
        .patch('/organizations/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateDto)
        .expect(404);
    });

    it('should return 409 when updating to existing code', async () => {
      // Create another organization with a code
      await organizationRepository.save(
        createMockOrganization({
          name: 'Other Organization',
          code: 'OTHER_CODE',
        })
      );

      const updateDto = {
        code: 'OTHER_CODE', // Trying to use existing code
      };

      await request(app.getHttpServer())
        .patch(`/organizations/${testOrganization.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateDto)
        .expect(409);
    });
  });

  describe('DELETE /organizations/:id', () => {
    let testOrganization: Organization;

    beforeEach(async () => {
      testOrganization = await organizationRepository.save(
        createMockOrganization({
          name: 'Test Organization',
          code: 'TEST_ORG',
        })
      );
    });

    it('should soft delete organization', async () => {
      await request(app.getHttpServer())
        .delete(`/organizations/${testOrganization.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify organization was soft deleted
      const deletedOrg = await organizationRepository.findOne({
        where: { id: testOrganization.id },
      });
      expect(deletedOrg?.isActive).toBe(false);
      expect(deletedOrg?.status).toBe('archived');
    });

    it('should return 404 for non-existent organization', async () => {
      await request(app.getHttpServer())
        .delete('/organizations/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 400 when trying to delete organization with children', async () => {
      // Create child organization
      const childOrg = createMockOrganization({
        name: 'Child Organization',
        code: 'CHILD_ORG',
        parent: testOrganization,
      });
      await organizationRepository.save(childOrg);

      await request(app.getHttpServer())
        .delete(`/organizations/${testOrganization.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('POST /organizations/bulk', () => {
    it('should create multiple organizations', async () => {
      const bulkCreateDto = {
        organizations: [
          {
            name: 'Bulk Org 1',
            code: 'BULK1',
            description: 'First bulk organization',
            type: 'company',
          },
          {
            name: 'Bulk Org 2',
            code: 'BULK2',
            description: 'Second bulk organization',
            type: 'division',
          },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/organizations/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bulkCreateDto)
        .expect(201);

      expect(response.body.successful).toHaveLength(2);
      expect(response.body.failed).toHaveLength(0);
      expect(response.body.successful[0]).toEqual(
        expect.objectContaining({
          name: 'Bulk Org 1',
          code: 'BULK1',
        })
      );
    });

    it('should handle partial failures in bulk create', async () => {
      // Create existing organization to cause conflict
      await organizationRepository.save(
        createMockOrganization({
          name: 'Existing Organization',
          code: 'EXISTING',
        })
      );

      const bulkCreateDto = {
        organizations: [
          {
            name: 'Valid Org',
            code: 'VALID',
            description: 'Valid organization',
            type: 'company',
          },
          {
            name: 'Invalid Org',
            code: 'EXISTING', // Conflicts with existing
            description: 'Invalid organization',
            type: 'division',
          },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/organizations/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bulkCreateDto)
        .expect(201);

      expect(response.body.successful).toHaveLength(1);
      expect(response.body.failed).toHaveLength(1);
      expect(response.body.failed[0].error).toContain('already exists');
    });
  });

  describe('GET /organizations/:id/hierarchy', () => {
    let parentOrg: Organization;
    let childOrg1: Organization;
    let childOrg2: Organization;

    beforeEach(async () => {
      parentOrg = await organizationRepository.save(
        createMockOrganization({
          name: 'Parent Organization',
          code: 'PARENT',
          type: 'company',
        })
      );

      childOrg1 = await organizationRepository.save(
        createMockOrganization({
          name: 'Child Organization 1',
          code: 'CHILD1',
          type: 'division',
          parent: parentOrg,
        })
      );

      childOrg2 = await organizationRepository.save(
        createMockOrganization({
          name: 'Child Organization 2',
          code: 'CHILD2',
          type: 'division',
          parent: parentOrg,
        })
      );
    });

    it('should return organization hierarchy', async () => {
      const response = await request(app.getHttpServer())
        .get(`/organizations/${parentOrg.id}/hierarchy`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          id: parentOrg.id,
          name: 'Parent Organization',
          children: expect.arrayContaining([
            expect.objectContaining({
              id: childOrg1.id,
              name: 'Child Organization 1',
            }),
            expect.objectContaining({
              id: childOrg2.id,
              name: 'Child Organization 2',
            }),
          ]),
        })
      );
    });
  });

  describe('PATCH /organizations/:id/move', () => {
    let orgToMove: Organization;
    let newParent: Organization;

    beforeEach(async () => {
      orgToMove = await organizationRepository.save(
        createMockOrganization({
          name: 'Organization to Move',
          code: 'MOVE_ORG',
        })
      );

      newParent = await organizationRepository.save(
        createMockOrganization({
          name: 'New Parent',
          code: 'NEW_PARENT',
        })
      );
    });

    it('should move organization to new parent', async () => {
      const moveDto = {
        newParentId: newParent.id,
      };

      const response = await request(app.getHttpServer())
        .patch(`/organizations/${orgToMove.id}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(moveDto)
        .expect(200);

      expect(response.body.parent).toEqual(
        expect.objectContaining({
          id: newParent.id,
          name: 'New Parent',
        })
      );
    });

    it('should return 400 when trying to move organization to itself', async () => {
      const moveDto = {
        newParentId: orgToMove.id,
      };

      await request(app.getHttpServer())
        .patch(`/organizations/${orgToMove.id}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(moveDto)
        .expect(400);
    });
  });
});