import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { UsersService } from '../users.service';
import { User } from '../entities/user.entity';
import { UserRole } from '../entities/user-role.entity';
import { UserOrganizationMembership } from '../entities/user-organization-membership.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('UsersService - Multi-Role Support', () => {
  let service: UsersService;
  let userRepository: Repository<User>;
  let userRoleRepository: Repository<UserRole>;
  let membershipRepository: Repository<UserOrganizationMembership>;
  let dataSource: DataSource;

  const mockUserId = 'user-123';
  const mockOrganizationId = 'org-123';
  const mockAdminId = 'admin-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(UserRole),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(UserOrganizationMembership),
          useClass: Repository,
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    userRoleRepository = module.get<Repository<UserRole>>(getRepositoryToken(UserRole));
    membershipRepository = module.get<Repository<UserOrganizationMembership>>(
      getRepositoryToken(UserOrganizationMembership),
    );
    dataSource = module.get<DataSource>(DataSource);
  });

  describe('getUserRoles', () => {
    it('should return active roles sorted by priority', async () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 86400000); // +1 day
      const pastDate = new Date(now.getTime() - 86400000); // -1 day

      const mockRoles = [
        {
          id: 'role-1',
          userId: mockUserId,
          organizationId: mockOrganizationId,
          roleName: 'manager',
          priority: 200,
          isActive: true,
          validFrom: pastDate,
          validTo: futureDate,
        },
        {
          id: 'role-2',
          userId: mockUserId,
          organizationId: mockOrganizationId,
          roleName: 'agent',
          priority: 100,
          isActive: true,
          validFrom: pastDate,
          validTo: futureDate,
        },
      ];

      jest.spyOn(userRoleRepository, 'find').mockResolvedValue(mockRoles as UserRole[]);

      const result = await service.getUserRoles(mockUserId, mockOrganizationId);

      expect(result).toHaveLength(2);
      expect(result[0].roleName).toBe('manager'); // Higher priority first
      expect(result[1].roleName).toBe('agent');

      expect(userRoleRepository.find).toHaveBeenCalledWith({
        where: expect.objectContaining({
          userId: mockUserId,
          organizationId: mockOrganizationId,
          isActive: true,
        }),
        order: {
          priority: 'DESC',
        },
        relations: ['organization'],
      });
    });

    it('should exclude expired roles', async () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 86400000); // -1 day

      const mockRoles = [
        {
          id: 'role-1',
          userId: mockUserId,
          organizationId: mockOrganizationId,
          roleName: 'temporary_manager',
          priority: 300,
          isActive: true,
          validFrom: new Date(now.getTime() - 172800000), // -2 days
          validTo: pastDate, // Expired yesterday
        },
      ];

      jest.spyOn(userRoleRepository, 'find').mockResolvedValue([]);

      const result = await service.getUserRoles(mockUserId, mockOrganizationId);

      expect(result).toHaveLength(0);
    });
  });

  describe('assignRole', () => {
    it('should assign a new role to user', async () => {
      jest.spyOn(userRoleRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(userRoleRepository, 'create').mockImplementation((data) => data as UserRole);
      jest.spyOn(userRoleRepository, 'save').mockImplementation(async (role) => ({
        ...role,
        id: 'new-role-id',
      } as UserRole));

      const result = await service.assignRole(
        mockUserId,
        mockOrganizationId,
        'branch_manager',
        mockAdminId,
        {
          priority: 250,
          validTo: new Date('2025-12-31'),
        },
      );

      expect(result).toMatchObject({
        userId: mockUserId,
        organizationId: mockOrganizationId,
        roleName: 'branch_manager',
        assignedBy: mockAdminId,
        priority: 250,
        isActive: true,
      });

      expect(userRoleRepository.save).toHaveBeenCalled();
    });

    it('should throw error if role already exists', async () => {
      const existingRole = {
        id: 'existing-role',
        userId: mockUserId,
        organizationId: mockOrganizationId,
        roleName: 'manager',
        isActive: true,
      };

      jest.spyOn(userRoleRepository, 'findOne').mockResolvedValue(existingRole as UserRole);

      await expect(
        service.assignRole(mockUserId, mockOrganizationId, 'manager', mockAdminId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeRole', () => {
    it('should deactivate role and set valid_to', async () => {
      const mockRole = {
        id: 'role-1',
        userId: mockUserId,
        organizationId: mockOrganizationId,
        roleName: 'agent',
        isActive: true,
      };

      jest.spyOn(userRoleRepository, 'findOne').mockResolvedValue(mockRole as UserRole);
      jest.spyOn(userRoleRepository, 'save').mockImplementation(async (role) => role as UserRole);

      await service.removeRole(mockUserId, mockOrganizationId, 'agent');

      expect(userRoleRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: false,
          validTo: expect.any(Date),
        }),
      );
    });

    it('should throw error if role not found', async () => {
      jest.spyOn(userRoleRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.removeRole(mockUserId, mockOrganizationId, 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateRolePriority', () => {
    it('should update role priority', async () => {
      const mockRole = {
        id: 'role-1',
        userId: mockUserId,
        organizationId: mockOrganizationId,
        roleName: 'agent',
        priority: 100,
        isActive: true,
      };

      jest.spyOn(userRoleRepository, 'findOne').mockResolvedValue(mockRole as UserRole);
      jest.spyOn(userRoleRepository, 'save').mockImplementation(async (role) => role as UserRole);

      const result = await service.updateRolePriority(
        mockUserId,
        mockOrganizationId,
        'agent',
        300,
      );

      expect(result.priority).toBe(300);
      expect(userRoleRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: 300,
        }),
      );
    });
  });

  describe('getUserRolesByPriority', () => {
    it('should return role names in priority order', async () => {
      const mockRoles = [
        { roleName: 'admin', priority: 300 },
        { roleName: 'manager', priority: 200 },
        { roleName: 'agent', priority: 100 },
      ];

      jest.spyOn(service, 'getUserRoles').mockResolvedValue(mockRoles as UserRole[]);

      const result = await service.getUserRolesByPriority(mockUserId, mockOrganizationId);

      expect(result).toEqual(['admin', 'manager', 'agent']);
    });
  });

  describe('hasRole', () => {
    it('should return true if user has active role', async () => {
      jest.spyOn(userRoleRepository, 'count').mockResolvedValue(1);

      const result = await service.hasRole(mockUserId, mockOrganizationId, 'manager');

      expect(result).toBe(true);
      expect(userRoleRepository.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          userId: mockUserId,
          organizationId: mockOrganizationId,
          roleName: 'manager',
          isActive: true,
        }),
      });
    });

    it('should return false if user does not have role', async () => {
      jest.spyOn(userRoleRepository, 'count').mockResolvedValue(0);

      const result = await service.hasRole(mockUserId, mockOrganizationId, 'admin');

      expect(result).toBe(false);
    });
  });

  describe('getUserHighestPriorityRole', () => {
    it('should return highest priority role name', async () => {
      const mockRoles = [
        { roleName: 'admin', priority: 300 },
        { roleName: 'manager', priority: 200 },
      ];

      jest.spyOn(service, 'getUserRoles').mockResolvedValue(mockRoles as UserRole[]);

      const result = await service.getUserHighestPriorityRole(mockUserId, mockOrganizationId);

      expect(result).toBe('admin');
    });

    it('should return null if no roles', async () => {
      jest.spyOn(service, 'getUserRoles').mockResolvedValue([]);

      const result = await service.getUserHighestPriorityRole(mockUserId, mockOrganizationId);

      expect(result).toBeNull();
    });
  });
});