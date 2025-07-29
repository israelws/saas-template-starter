import { Test, TestingModule } from '@nestjs/testing';
import { PolicyController } from './policy.controller';
import { PolicyService } from '../services/policy.service';
import { PolicyEvaluatorService } from '../services/policy-evaluator.service';
import { HierarchicalAbacService } from '../services/hierarchical-abac.service';
import {
  CreatePolicyDto,
  UpdatePolicyDto,
  PolicyEffect,
  PolicyScope,
  PolicyEvaluationContext,
} from '@saas-template/shared';

describe('PolicyController', () => {
  let controller: PolicyController;
  let policyService: PolicyService;
  let hierarchicalAbacService: HierarchicalAbacService;

  const mockPolicyService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    clone: jest.fn(),
    testPolicy: jest.fn(),
    createPolicySet: jest.fn(),
    findPolicySets: jest.fn(),
    addPolicyToSet: jest.fn(),
    removePolicyFromSet: jest.fn(),
  };

  const mockPolicyEvaluatorService = {
    clearCache: jest.fn(),
    clearCacheForOrganization: jest.fn(),
  };

  const mockHierarchicalAbacService = {
    evaluateWithHierarchy: jest.fn(),
    evaluateCrossOrganization: jest.fn(),
    getEffectivePolicies: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PolicyController],
      providers: [
        {
          provide: PolicyService,
          useValue: mockPolicyService,
        },
        {
          provide: PolicyEvaluatorService,
          useValue: mockPolicyEvaluatorService,
        },
        {
          provide: HierarchicalAbacService,
          useValue: mockHierarchicalAbacService,
        },
      ],
    }).compile();

    controller = module.get<PolicyController>(PolicyController);
    policyService = module.get<PolicyService>(PolicyService);
    hierarchicalAbacService = module.get<HierarchicalAbacService>(HierarchicalAbacService);

    jest.clearAllMocks();
  });

  describe('CRUD Operations', () => {
    it('should create a new policy', async () => {
      const createPolicyDto: CreatePolicyDto = {
        name: 'Test Policy',
        description: 'Test policy description',
        scope: PolicyScope.ORGANIZATION,
        effect: PolicyEffect.ALLOW,
        priority: 50,
        subjects: { roles: ['user'] },
        resources: { 
          types: ['product'],
          attributes: {
            organizationId: '${subject.organizationId}'
          }
        },
        actions: ['read'],
        organizationId: 'org-123',
      };

      const expectedPolicy = {
        id: 'policy-123',
        ...createPolicyDto,
        isActive: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPolicyService.create.mockResolvedValue(expectedPolicy);

      const result = await controller.create(createPolicyDto);

      expect(result).toEqual(expectedPolicy);
      expect(mockPolicyService.create).toHaveBeenCalledWith(createPolicyDto);
    });

    it('should find all policies with organization filter', async () => {
      const organizationId = 'org-123';
      const paginationParams = { page: 1, limit: 10 };

      const expectedResponse = {
        data: [
          {
            id: 'policy-1',
            name: 'Org Policy',
            scope: PolicyScope.ORGANIZATION,
            organizationId,
          },
          {
            id: 'policy-2',
            name: 'System Policy',
            scope: PolicyScope.SYSTEM,
          },
        ],
        total: 2,
        page: 1,
        limit: 10,
      };

      mockPolicyService.findAll.mockResolvedValue(expectedResponse);

      const result = await controller.findAll(organizationId, paginationParams);

      expect(result).toEqual(expectedResponse);
      expect(mockPolicyService.findAll).toHaveBeenCalledWith(organizationId, paginationParams);
    });

    it('should find one policy by id', async () => {
      const policyId = 'policy-123';
      const expectedPolicy = {
        id: policyId,
        name: 'Test Policy',
        scope: PolicyScope.ORGANIZATION,
      };

      mockPolicyService.findOne.mockResolvedValue(expectedPolicy);

      const result = await controller.findOne(policyId);

      expect(result).toEqual(expectedPolicy);
      expect(mockPolicyService.findOne).toHaveBeenCalledWith(policyId);
    });

    it('should update a policy', async () => {
      const policyId = 'policy-123';
      const updatePolicyDto: UpdatePolicyDto = {
        name: 'Updated Policy',
        priority: 75,
        resources: {
          types: ['product', 'customer'],
          attributes: {
            organizationId: '${subject.organizationId}',
            status: 'active'
          }
        }
      };

      const expectedPolicy = {
        id: policyId,
        ...updatePolicyDto,
        updatedAt: new Date(),
      };

      mockPolicyService.update.mockResolvedValue(expectedPolicy);

      const result = await controller.update(policyId, updatePolicyDto);

      expect(result).toEqual(expectedPolicy);
      expect(mockPolicyService.update).toHaveBeenCalledWith(policyId, updatePolicyDto);
    });

    it('should remove (deactivate) a policy', async () => {
      const policyId = 'policy-123';
      const expectedResponse = { success: true, id: policyId };

      mockPolicyService.remove.mockResolvedValue(expectedResponse);

      const result = await controller.remove(policyId);

      expect(result).toEqual(expectedResponse);
      expect(mockPolicyService.remove).toHaveBeenCalledWith(policyId);
    });
  });

  describe('Policy Testing and Evaluation', () => {
    it('should test a policy against a context', async () => {
      const policyId = 'policy-123';
      const context: PolicyEvaluationContext = {
        subject: {
          id: 'user-456',
          roles: ['user'],
          groups: [],
          attributes: {
            organizationId: 'org-789',
          },
        },
        resource: {
          type: 'product',
          id: 'prod-111',
          attributes: {
            organizationId: 'org-789',
          },
        },
        action: 'read',
        environment: {
          timestamp: new Date(),
          ipAddress: '192.168.1.1',
          attributes: {},
        },
        organizationId: 'org-789',
      };

      const expectedResult = {
        allowed: true,
        matchedPolicies: ['Test Policy'],
        reasons: ['Allowed by Test Policy'],
      };

      mockPolicyService.testPolicy.mockResolvedValue(expectedResult);

      const result = await controller.testPolicy(policyId, context);

      expect(result).toEqual(expectedResult);
      expect(mockPolicyService.testPolicy).toHaveBeenCalledWith(policyId, context);
    });

    it('should evaluate policies with user context', async () => {
      const context: PolicyEvaluationContext = {
        subject: {
          id: '',
          roles: ['user'],
          groups: [],
          attributes: {
            organizationId: 'org-123',
          },
        },
        resource: {
          type: 'product',
          id: 'prod-456',
          attributes: {
            organizationId: 'org-123',
          },
        },
        action: 'read',
        environment: {
          timestamp: new Date(),
          ipAddress: '127.0.0.1',
          attributes: {},
        },
        organizationId: 'org-123',
      };

      const req = {
        user: {
          id: 'user-789',
        },
      };

      const expectedResult = {
        allowed: true,
        reason: 'Policy "Org Scoped Products" allowed the action',
        policiesEvaluated: ['Org Scoped Products', 'Default Deny'],
        evaluationTime: 23,
        cacheHit: false,
      };

      mockHierarchicalAbacService.evaluateWithHierarchy.mockResolvedValue(expectedResult);

      const result = await controller.evaluate(context, req);

      expect(result).toEqual(expectedResult);
      expect(context.subject.id).toBe('user-789');
      expect(mockHierarchicalAbacService.evaluateWithHierarchy).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.objectContaining({
            id: 'user-789',
          }),
        }),
      );
    });

    it('should evaluate cross-organization access', async () => {
      const body = {
        context: {
          subject: {
            id: '',
            roles: ['admin'],
            groups: [],
            attributes: {
              organizationId: 'org-parent',
              childOrganizationIds: ['org-child-1', 'org-child-2'],
            },
          },
          resource: {
            type: 'report',
            id: 'report-123',
            attributes: {},
          },
          action: 'read',
          environment: {
            timestamp: new Date(),
            ipAddress: '127.0.0.1',
            attributes: {},
          },
          organizationId: 'org-parent',
        },
        targetOrganizationId: 'org-child-1',
      };

      const req = {
        user: {
          id: 'admin-123',
        },
      };

      const expectedResult = {
        allowed: true,
        reason: 'Cross-organization access allowed',
      };

      mockHierarchicalAbacService.evaluateCrossOrganization.mockResolvedValue(expectedResult);

      const result = await controller.evaluateCrossOrganization(body, req);

      expect(result).toEqual(expectedResult);
      expect(body.context.subject.id).toBe('admin-123');
      expect(mockHierarchicalAbacService.evaluateCrossOrganization).toHaveBeenCalledWith(
        body.context,
        body.targetOrganizationId,
      );
    });
  });

  describe('Policy Management', () => {
    it('should clone a policy', async () => {
      const policyId = 'policy-123';
      const newName = 'Cloned Policy';

      const expectedPolicy = {
        id: 'policy-456',
        name: newName,
        description: 'Clone of original policy',
      };

      mockPolicyService.clone.mockResolvedValue(expectedPolicy);

      const result = await controller.clone(policyId, newName);

      expect(result).toEqual(expectedPolicy);
      expect(mockPolicyService.clone).toHaveBeenCalledWith(policyId, newName);
    });

    it('should get effective policies for a user', async () => {
      const userId = 'user-123';
      const organizationId = 'org-456';
      const resourceType = 'product';

      const expectedPolicies = [
        { id: 'policy-1', name: 'Org Policy', priority: 50 },
        { id: 'policy-2', name: 'System Policy', priority: 100 },
      ];

      mockHierarchicalAbacService.getEffectivePolicies.mockResolvedValue(expectedPolicies);

      const result = await controller.getEffectivePolicies(userId, organizationId, resourceType);

      expect(result).toEqual(expectedPolicies);
      expect(mockHierarchicalAbacService.getEffectivePolicies).toHaveBeenCalledWith(
        userId,
        organizationId,
        resourceType,
      );
    });
  });

  describe('Cache Management', () => {
    it('should clear all cache', async () => {
      await controller.clearCache();

      expect(mockPolicyEvaluatorService.clearCache).toHaveBeenCalled();
    });

    it('should clear cache for specific organization', async () => {
      const organizationId = 'org-123';

      await controller.clearCache(organizationId);

      expect(mockPolicyEvaluatorService.clearCacheForOrganization).toHaveBeenCalledWith(
        organizationId,
      );
    });
  });

  describe('PolicySet Management', () => {
    it('should create a policy set', async () => {
      const body = {
        name: 'Department Policies',
        description: 'Policies for HR department',
        organizationId: 'org-123',
      };

      const expectedPolicySet = {
        id: 'set-123',
        ...body,
      };

      mockPolicyService.createPolicySet.mockResolvedValue(expectedPolicySet);

      const result = await controller.createPolicySet(body);

      expect(result).toEqual(expectedPolicySet);
      expect(mockPolicyService.createPolicySet).toHaveBeenCalledWith(
        body.name,
        body.description,
        body.organizationId,
      );
    });

    it('should find policy sets for organization', async () => {
      const organizationId = 'org-123';
      const expectedSets = [
        { id: 'set-1', name: 'HR Policies' },
        { id: 'set-2', name: 'Sales Policies' },
      ];

      mockPolicyService.findPolicySets.mockResolvedValue(expectedSets);

      const result = await controller.findPolicySets(organizationId);

      expect(result).toEqual(expectedSets);
      expect(mockPolicyService.findPolicySets).toHaveBeenCalledWith(organizationId);
    });

    it('should add policy to a set', async () => {
      const policyId = 'policy-123';
      const setId = 'set-456';

      const expectedResponse = { success: true };

      mockPolicyService.addPolicyToSet.mockResolvedValue(expectedResponse);

      const result = await controller.addToSet(policyId, setId);

      expect(result).toEqual(expectedResponse);
      expect(mockPolicyService.addPolicyToSet).toHaveBeenCalledWith(policyId, setId);
    });

    it('should remove policy from its set', async () => {
      const policyId = 'policy-123';

      const expectedResponse = { success: true };

      mockPolicyService.removePolicyFromSet.mockResolvedValue(expectedResponse);

      const result = await controller.removeFromSet(policyId);

      expect(result).toEqual(expectedResponse);
      expect(mockPolicyService.removePolicyFromSet).toHaveBeenCalledWith(policyId);
    });
  });
});