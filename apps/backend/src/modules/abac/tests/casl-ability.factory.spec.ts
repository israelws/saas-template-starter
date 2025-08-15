import { Test, TestingModule } from '@nestjs/testing';
import { CaslAbilityFactory } from '../factories/casl-ability.factory';
import { PolicyService } from '../services/policy.service';
import { UsersService } from '../../users/users.service';
import { User } from '../../users/entities/user.entity';
import { PolicyEffect } from '@saas-template/shared';

describe('CaslAbilityFactory', () => {
  let factory: CaslAbilityFactory;
  let policyService: PolicyService;
  let usersService: UsersService;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    metadata: {},
  } as User;

  const mockOrganizationId = 'org-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CaslAbilityFactory,
        {
          provide: PolicyService,
          useValue: {
            findApplicablePolicies: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            getUserRoles: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    factory = module.get<CaslAbilityFactory>(CaslAbilityFactory);
    policyService = module.get<PolicyService>(PolicyService);
    usersService = module.get<UsersService>(UsersService);
  });

  describe('createForUser', () => {
    it('should grant all permissions to super admin', async () => {
      const superAdmin = {
        ...mockUser,
        metadata: { isSuperAdmin: true },
      };

      const ability = await factory.createForUser(superAdmin, mockOrganizationId);

      expect(ability.can('manage', 'all')).toBe(true);
      expect(ability.can('delete', 'Organization')).toBe(true);
      expect(ability.can('read', 'Product')).toBe(true);
    });

    it('should apply field permissions from policies', async () => {
      jest.spyOn(usersService, 'getUserRoles').mockResolvedValue([{ roleName: 'agent' } as any]);

      jest.spyOn(policyService, 'findApplicablePolicies').mockResolvedValue([
        {
          id: 'policy-1',
          effect: PolicyEffect.ALLOW,
          actions: ['read'],
          resources: { types: ['Customer'] },
          field_permissions: {
            Customer: {
              readable: ['id', 'name', 'email'],
              denied: ['ssn', 'creditScore'],
            },
          },
          is_active: true,
        } as any,
      ]);

      const ability = await factory.createForUser(mockUser, mockOrganizationId, {
        includeFieldPermissions: true,
      });

      const fieldPerms = ability.fieldPermissions.get('Customer');
      expect(fieldPerms).toBeDefined();
      expect(fieldPerms.readable).toContain('id');
      expect(fieldPerms.readable).toContain('name');
      expect(fieldPerms.denied).toContain('ssn');
      expect(fieldPerms.denied).toContain('creditScore');
    });

    it('should handle multiple roles with priority', async () => {
      const mockRoles = [
        {
          roleName: 'branch_manager',
          priority: 200,
        },
        {
          roleName: 'agent',
          priority: 100,
        },
      ];

      jest.spyOn(usersService, 'getUserRoles').mockResolvedValue(mockRoles as any);
      jest.spyOn(policyService, 'findApplicablePolicies').mockResolvedValue([]);

      const ability = await factory.createForUser(mockUser, mockOrganizationId);

      // Should have called getUserRoles
      expect(usersService.getUserRoles).toHaveBeenCalledWith(mockUser.id, mockOrganizationId);
    });

    it('should apply role-based defaults when no policies found', async () => {
      jest.spyOn(usersService, 'getUserRoles').mockResolvedValue([{ roleName: 'manager' } as any]);
      jest.spyOn(policyService, 'findApplicablePolicies').mockResolvedValue([]);

      const ability = await factory.createForUser(mockUser, mockOrganizationId);

      expect(ability.can('read', 'Product', { organizationId: mockOrganizationId })).toBe(true);
      expect(ability.can('create', 'Product', { organizationId: mockOrganizationId })).toBe(true);
      expect(ability.can('update', 'Product', { organizationId: mockOrganizationId })).toBe(true);
      expect(ability.can('approve', 'Order', { organizationId: mockOrganizationId })).toBe(true);
    });

    it('should handle deny policies correctly', async () => {
      jest.spyOn(usersService, 'getUserRoles').mockResolvedValue([{ roleName: 'agent' } as any]);

      jest.spyOn(policyService, 'findApplicablePolicies').mockResolvedValue([
        {
          id: 'allow-policy',
          effect: PolicyEffect.ALLOW,
          actions: ['read', 'create'],
          resources: { types: ['Product'] },
          is_active: true,
        } as any,
        {
          id: 'deny-policy',
          effect: PolicyEffect.DENY,
          actions: ['delete'],
          resources: { types: ['Product'] },
          is_active: true,
        } as any,
      ]);

      const ability = await factory.createForUser(mockUser, mockOrganizationId);

      expect(ability.can('read', 'Product', { organizationId: mockOrganizationId })).toBe(true);
      expect(ability.can('create', 'Product', { organizationId: mockOrganizationId })).toBe(true);
      expect(ability.can('delete', 'Product', { organizationId: mockOrganizationId })).toBe(false);
    });

    it('should replace template variables in conditions', async () => {
      jest.spyOn(usersService, 'getUserRoles').mockResolvedValue([{ roleName: 'user' } as any]);

      jest.spyOn(policyService, 'findApplicablePolicies').mockResolvedValue([
        {
          id: 'self-policy',
          effect: PolicyEffect.ALLOW,
          actions: ['read', 'update'],
          resources: {
            types: ['User'],
            attributes: {
              id: '${subject.id}',
            },
          },
          is_active: true,
        } as any,
      ]);

      const ability = await factory.createForUser(mockUser, mockOrganizationId);

      // User can read/update their own record
      expect(
        ability.can('read', 'User', { id: mockUser.id, organizationId: mockOrganizationId }),
      ).toBe(true);
      expect(
        ability.can('update', 'User', { id: mockUser.id, organizationId: mockOrganizationId }),
      ).toBe(true);

      // But not others
      expect(
        ability.can('read', 'User', { id: 'other-user', organizationId: mockOrganizationId }),
      ).toBe(false);
    });
  });

  describe('canWithFields', () => {
    it('should check action permission and return field permissions', async () => {
      jest.spyOn(usersService, 'getUserRoles').mockResolvedValue([{ roleName: 'agent' } as any]);

      jest.spyOn(policyService, 'findApplicablePolicies').mockResolvedValue([
        {
          id: 'policy-1',
          effect: PolicyEffect.ALLOW,
          actions: ['read'],
          resources: { types: ['Customer'] },
          field_permissions: {
            Customer: {
              readable: ['id', 'name', 'email'],
              writable: ['email'],
              denied: ['ssn'],
            },
          },
          is_active: true,
        } as any,
      ]);

      const customer = {
        constructor: { name: 'Customer' },
        id: 'cust-123',
        organizationId: mockOrganizationId,
      };

      const result = await factory.canWithFields(mockUser, 'read', customer, mockOrganizationId);

      expect(result.allowed).toBe(true);
      expect(result.readableFields).toEqual(['id', 'name', 'email']);
      expect(result.writableFields).toEqual(['email']);
      expect(result.deniedFields).toEqual(['ssn']);
    });

    it('should return allowed false when action is denied', async () => {
      jest.spyOn(usersService, 'getUserRoles').mockResolvedValue([{ roleName: 'guest' } as any]);
      jest.spyOn(policyService, 'findApplicablePolicies').mockResolvedValue([]);

      const product = {
        constructor: { name: 'Product' },
        id: 'prod-123',
        organizationId: mockOrganizationId,
      };

      const result = await factory.canWithFields(mockUser, 'delete', product, mockOrganizationId);

      expect(result.allowed).toBe(false);
      expect(result.readableFields).toBeUndefined();
      expect(result.writableFields).toBeUndefined();
      expect(result.deniedFields).toBeUndefined();
    });
  });
});
