import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AbacGuard } from './abac.guard';
import { HierarchicalAbacService } from '../services/hierarchical-abac.service';
import { PolicyEvaluationResult } from '@saas-template/shared';

describe('AbacGuard', () => {
  let guard: AbacGuard;
  let reflector: Reflector;
  let hierarchicalAbacService: HierarchicalAbacService;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const mockHierarchicalAbacService = {
    evaluateWithHierarchy: jest.fn(),
  };

  const createMockExecutionContext = (
    user: any,
    params: any = {},
    query: any = {},
    body: any = {},
    headers: any = {},
  ): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user,
          params,
          query,
          body,
          headers,
          ip: '127.0.0.1',
        }),
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    } as any;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AbacGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
        {
          provide: HierarchicalAbacService,
          useValue: mockHierarchicalAbacService,
        },
      ],
    }).compile();

    guard = module.get<AbacGuard>(AbacGuard);
    reflector = module.get<Reflector>(Reflector);
    hierarchicalAbacService = module.get<HierarchicalAbacService>(HierarchicalAbacService);

    jest.clearAllMocks();
  });

  describe('Basic functionality', () => {
    it('should allow access when no permission decorator is present', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(undefined);

      const context = createMockExecutionContext({ id: 'user-123' });
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockHierarchicalAbacService.evaluateWithHierarchy).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when user is not authenticated', async () => {
      mockReflector.getAllAndOverride.mockReturnValue({
        resource: 'product',
        action: 'read',
      });

      const context = createMockExecutionContext(null);

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should allow super admin to bypass ABAC checks', async () => {
      mockReflector.getAllAndOverride.mockReturnValue({
        resource: 'product',
        action: 'delete',
      });

      const superAdminUser = {
        id: 'super-admin-123',
        metadata: { isSuperAdmin: true },
      };

      const context = createMockExecutionContext(superAdminUser);
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockHierarchicalAbacService.evaluateWithHierarchy).not.toHaveBeenCalled();
    });
  });

  describe('Organization context resolution', () => {
    it('should get organizationId from query parameter', async () => {
      mockReflector.getAllAndOverride.mockReturnValue({
        resource: 'product',
        action: 'read',
      });

      const user = {
        id: 'user-123',
        memberships: [{
          organizationId: 'org-456',
          role: 'user',
        }],
      };

      const evaluationResult: PolicyEvaluationResult = {
        allowed: true,
        matchedPolicies: [],
        deniedPolicies: [],
        reasons: ['Allowed by policy'],
        evaluationTime: 10,
      };

      mockHierarchicalAbacService.evaluateWithHierarchy.mockResolvedValue(evaluationResult);

      const context = createMockExecutionContext(
        user,
        {},
        { organizationId: 'org-456' },
      );

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockHierarchicalAbacService.evaluateWithHierarchy).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'org-456',
        }),
      );
    });

    it('should get organizationId from request body', async () => {
      mockReflector.getAllAndOverride.mockReturnValue({
        resource: 'product',
        action: 'create',
      });

      const user = {
        id: 'user-123',
        memberships: [{
          organizationId: 'org-789',
          role: 'manager',
        }],
      };

      const evaluationResult: PolicyEvaluationResult = {
        allowed: true,
        matchedPolicies: [],
        deniedPolicies: [],
        reasons: ['Allowed by policy'],
        evaluationTime: 10,
      };

      mockHierarchicalAbacService.evaluateWithHierarchy.mockResolvedValue(evaluationResult);

      const context = createMockExecutionContext(
        user,
        {},
        {},
        { organizationId: 'org-789' },
      );

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockHierarchicalAbacService.evaluateWithHierarchy).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'org-789',
        }),
      );
    });

    it('should throw ForbiddenException when no organization context is available', async () => {
      mockReflector.getAllAndOverride.mockReturnValue({
        resource: 'product',
        action: 'read',
      });

      const user = {
        id: 'user-123',
        memberships: [],
      };

      const context = createMockExecutionContext(user);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      await expect(guard.canActivate(context)).rejects.toThrow('No organization context available');
    });
  });

  describe('Evaluation context building', () => {
    it('should build correct evaluation context with all attributes', async () => {
      mockReflector.getAllAndOverride.mockReturnValue({
        resource: 'product',
        action: 'update',
      });

      const user = {
        id: 'user-123',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        memberships: [{
          organizationId: 'org-456',
          role: 'manager',
        }],
        metadata: {
          departmentId: 'dept-sales',
        },
      };

      const evaluationResult: PolicyEvaluationResult = {
        allowed: true,
        matchedPolicies: [],
        deniedPolicies: [],
        reasons: [],
        evaluationTime: 10,
      };

      mockHierarchicalAbacService.evaluateWithHierarchy.mockResolvedValue(evaluationResult);

      const context = createMockExecutionContext(
        user,
        { id: 'prod-789' },
        { organizationId: 'org-456' },
      );

      await guard.canActivate(context);

      expect(mockHierarchicalAbacService.evaluateWithHierarchy).toHaveBeenCalledWith({
        subject: {
          id: 'user-123',
          roles: ['manager'],
          groups: [],
          attributes: {
            id: 'user-123',
            email: 'user@example.com',
            role: 'manager',
            organizationId: 'org-456',
            firstName: 'John',
            lastName: 'Doe',
            departmentId: 'dept-sales',
          },
        },
        resource: {
          type: 'product',
          id: 'prod-789',
          attributes: {
            type: 'product',
            id: 'prod-789',
            organizationId: 'org-456',
          },
        },
        action: 'update',
        environment: expect.objectContaining({
          timestamp: expect.any(Date),
          ipAddress: '127.0.0.1',
          attributes: expect.objectContaining({
            'env.time': expect.any(String),
            'env.date': expect.any(String),
            'env.dayOfWeek': expect.any(Number),
            'env.ipAddress': '127.0.0.1',
          }),
        }),
        organizationId: 'org-456',
      });
    });
  });

  describe('Access control decisions', () => {
    it('should allow access when evaluation result is allowed', async () => {
      mockReflector.getAllAndOverride.mockReturnValue({
        resource: 'product',
        action: 'read',
      });

      const user = {
        id: 'user-123',
        memberships: [{
          organizationId: 'org-456',
          role: 'user',
        }],
      };

      const evaluationResult: PolicyEvaluationResult = {
        allowed: true,
        matchedPolicies: [],
        deniedPolicies: [],
        reasons: ['Allowed by Organization Scoped Products policy'],
        evaluationTime: 15,
      };

      mockHierarchicalAbacService.evaluateWithHierarchy.mockResolvedValue(evaluationResult);

      const context = createMockExecutionContext(
        user,
        {},
        { organizationId: 'org-456' },
      );

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny access when evaluation result is denied', async () => {
      mockReflector.getAllAndOverride.mockReturnValue({
        resource: 'product',
        action: 'delete',
      });

      const user = {
        id: 'user-123',
        memberships: [{
          organizationId: 'org-456',
          role: 'user',
        }],
      };

      const evaluationResult: PolicyEvaluationResult = {
        allowed: false,
        matchedPolicies: [],
        deniedPolicies: [],
        reasons: ['Access denied by policy: Insufficient permissions'],
        evaluationTime: 20,
      };

      mockHierarchicalAbacService.evaluateWithHierarchy.mockResolvedValue(evaluationResult);

      const context = createMockExecutionContext(
        user,
        {},
        { organizationId: 'org-456' },
      );

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Access denied: Access denied by policy: Insufficient permissions',
      );
    });
  });

  describe('Error handling', () => {
    it('should allow admin access when evaluation fails', async () => {
      mockReflector.getAllAndOverride.mockReturnValue({
        resource: 'product',
        action: 'read',
      });

      const adminUser = {
        id: 'admin-123',
        memberships: [{
          organizationId: 'org-456',
          role: 'admin',
        }],
      };

      mockHierarchicalAbacService.evaluateWithHierarchy.mockRejectedValue(
        new Error('Database connection error'),
      );

      const context = createMockExecutionContext(
        adminUser,
        {},
        { organizationId: 'org-456' },
      );

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny regular user access when evaluation fails', async () => {
      mockReflector.getAllAndOverride.mockReturnValue({
        resource: 'product',
        action: 'read',
      });

      const regularUser = {
        id: 'user-123',
        memberships: [{
          organizationId: 'org-456',
          role: 'user',
        }],
      };

      mockHierarchicalAbacService.evaluateWithHierarchy.mockRejectedValue(
        new Error('Database connection error'),
      );

      const context = createMockExecutionContext(
        regularUser,
        {},
        { organizationId: 'org-456' },
      );

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Access denied due to policy evaluation error',
      );
    });
  });

  describe('Request enrichment', () => {
    it('should add evaluation result to request object', async () => {
      mockReflector.getAllAndOverride.mockReturnValue({
        resource: 'product',
        action: 'read',
      });

      const user = {
        id: 'user-123',
        memberships: [{
          organizationId: 'org-456',
          role: 'user',
        }],
      };

      const evaluationResult: PolicyEvaluationResult = {
        allowed: true,
        matchedPolicies: [{ name: 'Test Policy' }] as any,
        deniedPolicies: [],
        reasons: ['Allowed by Test Policy'],
        evaluationTime: 25,
      };

      mockHierarchicalAbacService.evaluateWithHierarchy.mockResolvedValue(evaluationResult);

      const request: any = {
        user,
        params: {},
        query: { organizationId: 'org-456' },
        body: {},
        headers: {},
        ip: '127.0.0.1',
      };

      const context = {
        switchToHttp: () => ({
          getRequest: () => request,
        }),
        getHandler: () => jest.fn(),
        getClass: () => jest.fn(),
      } as any;

      await guard.canActivate(context);

      expect(request.abacResult).toEqual(evaluationResult);
    });
  });
});