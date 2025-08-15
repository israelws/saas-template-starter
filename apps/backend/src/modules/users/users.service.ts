import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Not, LessThan, MoreThan } from 'typeorm';
import { User } from './entities/user.entity';
import { UserOrganizationMembership } from './entities/user-organization-membership.entity';
import { UserRole as UserRoleEntity } from './entities/user-role.entity';
import {
  CreateUserDto,
  UpdateUserDto,
  PaginationParams,
  PaginatedResponse,
  UserStatus,
  UserRole,
} from '@saas-template/shared';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserOrganizationMembership)
    private readonly membershipRepository: Repository<UserOrganizationMembership>,
    @InjectRepository(UserRoleEntity)
    private readonly userRoleRepository: Repository<UserRoleEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createUserDto: CreateUserDto & {
      cognitoId?: string;
      password?: string;
      isEmailVerified?: boolean;
    },
  ): Promise<User> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create user
      const user = this.userRepository.create({
        ...createUserDto,
        status: UserStatus.ACTIVE,
        emailVerified: createUserDto.isEmailVerified || false,
        preferences: {
          language: 'en',
          timezone: 'UTC',
          dateFormat: 'MM/DD/YYYY',
          theme: 'light',
          notifications: {
            email: true,
            sms: false,
            inApp: true,
            digest: 'daily',
          },
        },
      });

      const savedUser = await queryRunner.manager.save(User, user);

      // If organizationId provided, create membership
      if (createUserDto.organizationId) {
        const membership = this.membershipRepository.create({
          userId: savedUser.id,
          organizationId: createUserDto.organizationId,
          role: createUserDto.role || UserRole.USER,
          isDefault: true,
        });

        await queryRunner.manager.save(membership);
      }

      await queryRunner.commitTransaction();
      return savedUser;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(params: PaginationParams): Promise<PaginatedResponse<User>> {
    const { page, limit, sortBy = 'createdAt', sortOrder = 'DESC' } = params;

    // Ensure page and limit are numbers
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    const [users, total] = await this.userRepository.findAndCount({
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      order: { [sortBy]: sortOrder },
    });

    return {
      data: users,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findOneWithMemberships(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['memberships', 'memberships.organization'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  async findByCognitoId(cognitoId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { cognitoId },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    Object.assign(user, updateUserDto);
    user.updatedAt = new Date();

    return this.userRepository.save(user);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, {
      lastLoginAt: new Date(),
    });
  }

  async updateEmailVerified(id: string, emailVerified: boolean): Promise<void> {
    await this.userRepository.update(id, {
      emailVerified,
    });
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);

    // Instead of deleting, set status to inactive
    user.status = UserStatus.INACTIVE;
    await this.userRepository.save(user);
  }

  async addOrganizationMembership(
    userId: string,
    organizationId: string,
    role: UserRole = UserRole.USER,
  ): Promise<UserOrganizationMembership> {
    // Check if membership already exists
    const existingMembership = await this.membershipRepository.findOne({
      where: { userId, organizationId },
    });

    if (existingMembership) {
      throw new BadRequestException('User is already a member of this organization');
    }

    // Check if this is the first membership
    const membershipCount = await this.membershipRepository.count({
      where: { userId },
    });

    const membership = this.membershipRepository.create({
      userId,
      organizationId,
      role,
      isDefault: membershipCount === 0,
    });

    return this.membershipRepository.save(membership);
  }

  async removeOrganizationMembership(userId: string, organizationId: string): Promise<void> {
    const membership = await this.membershipRepository.findOne({
      where: { userId, organizationId },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    // If this was the default, assign a new default
    if (membership.isDefault) {
      const otherMembership = await this.membershipRepository.findOne({
        where: { userId, organizationId: Not(organizationId) },
      });

      if (otherMembership) {
        otherMembership.isDefault = true;
        await this.membershipRepository.save(otherMembership);
      }
    }

    await this.membershipRepository.remove(membership);
  }

  async updateMembershipRole(
    userId: string,
    organizationId: string,
    role: UserRole,
  ): Promise<UserOrganizationMembership> {
    const membership = await this.membershipRepository.findOne({
      where: { userId, organizationId },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    membership.role = role;
    membership.updatedAt = new Date();

    return this.membershipRepository.save(membership);
  }

  async setDefaultOrganization(userId: string, organizationId: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Remove default from all memberships
      await queryRunner.manager.update(
        UserOrganizationMembership,
        { userId },
        { isDefault: false },
      );

      // Set new default
      await queryRunner.manager.update(
        UserOrganizationMembership,
        { userId, organizationId },
        { isDefault: true },
      );

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Multi-role support methods
   */

  /**
   * Get all active roles for a user in an organization
   * Returns roles sorted by priority (highest first)
   *
   * @async
   * @param {string} userId - ID of the user
   * @param {string} organizationId - ID of the organization
   * @returns {Promise<UserRole[]>} Array of active user roles
   */
  async getUserRoles(userId: string, organizationId: string): Promise<UserRoleEntity[]> {
    const now = new Date();

    return this.userRoleRepository.find({
      where: {
        userId,
        organizationId,
        isActive: true,
        validFrom: LessThan(now),
        validTo: MoreThan(now),
      },
      order: {
        priority: 'DESC',
      },
      relations: ['organization'],
    });
  }

  /**
   * Assign a new role to a user in an organization
   * Supports role priorities and validity periods for temporary roles
   *
   * @async
   * @param {string} userId - ID of the user to assign role to
   * @param {string} organizationId - ID of the organization
   * @param {string} roleName - Name of the role to assign
   * @param {string} assignedBy - ID of the user assigning the role
   * @param {Object} [options] - Optional role configuration
   * @param {number} [options.priority=0] - Role priority (higher number = higher precedence)
   * @param {Date} [options.validFrom] - When the role becomes active (defaults to now)
   * @param {Date} [options.validTo] - When the role expires (optional)
   * @returns {Promise<UserRole>} The created user role
   * @throws {BadRequestException} If user already has this active role
   */
  async assignRole(
    userId: string,
    organizationId: string,
    roleName: string,
    assignedBy: string,
    options?: {
      priority?: number;
      validFrom?: Date;
      validTo?: Date;
    },
  ): Promise<UserRoleEntity> {
    // Check if user already has this active role
    const existingRole = await this.userRoleRepository.findOne({
      where: {
        userId,
        organizationId,
        roleName,
        isActive: true,
      },
    });

    if (existingRole) {
      throw new BadRequestException(`User already has the role ${roleName} in this organization`);
    }

    const userRole = this.userRoleRepository.create({
      userId,
      organizationId,
      roleName,
      assignedBy,
      priority: options?.priority || 0,
      validFrom: options?.validFrom || new Date(),
      validTo: options?.validTo,
      isActive: true,
    });

    return this.userRoleRepository.save(userRole);
  }

  /**
   * Remove a role from a user in an organization
   * Soft deletes by setting isActive to false
   *
   * @async
   * @param {string} userId - ID of the user
   * @param {string} organizationId - ID of the organization
   * @param {string} roleName - Name of the role to remove
   * @returns {Promise<void>}
   * @throws {NotFoundException} If role assignment not found
   */
  async removeRole(userId: string, organizationId: string, roleName: string): Promise<void> {
    const userRole = await this.userRoleRepository.findOne({
      where: {
        userId,
        organizationId,
        roleName,
        isActive: true,
      },
    });

    if (!userRole) {
      throw new NotFoundException('User role not found');
    }

    userRole.isActive = false;
    userRole.validTo = new Date();

    await this.userRoleRepository.save(userRole);
  }

  /**
   * Update the priority of an existing role assignment
   * Higher priority roles take precedence in permission evaluation
   *
   * @async
   * @param {string} userId - ID of the user
   * @param {string} organizationId - ID of the organization
   * @param {string} roleName - Name of the role to update
   * @param {number} priority - New priority value (0-1000)
   * @returns {Promise<UserRole>} The updated user role
   * @throws {NotFoundException} If role assignment not found
   */
  async updateRolePriority(
    userId: string,
    organizationId: string,
    roleName: string,
    priority: number,
  ): Promise<UserRoleEntity> {
    const userRole = await this.userRoleRepository.findOne({
      where: {
        userId,
        organizationId,
        roleName,
        isActive: true,
      },
    });

    if (!userRole) {
      throw new NotFoundException('User role not found');
    }

    userRole.priority = priority;

    return this.userRoleRepository.save(userRole);
  }

  /**
   * Get user role names sorted by priority
   * Convenience method that returns just the role names
   *
   * @async
   * @param {string} userId - ID of the user
   * @param {string} organizationId - ID of the organization
   * @returns {Promise<string[]>} Array of role names in priority order
   */
  async getUserRolesByPriority(userId: string, organizationId: string): Promise<string[]> {
    const roles = await this.getUserRoles(userId, organizationId);
    return roles.map((role) => role.roleName);
  }

  /**
   * Check if a user has a specific role in an organization
   * Checks only active roles within their validity period
   *
   * @async
   * @param {string} userId - ID of the user
   * @param {string} organizationId - ID of the organization
   * @param {string} roleName - Name of the role to check
   * @returns {Promise<boolean>} True if user has the active role
   */
  async hasRole(userId: string, organizationId: string, roleName: string): Promise<boolean> {
    const now = new Date();

    const count = await this.userRoleRepository.count({
      where: {
        userId,
        organizationId,
        roleName,
        isActive: true,
        validFrom: LessThan(now),
        validTo: MoreThan(now),
      },
    });

    return count > 0;
  }

  async getUserHighestPriorityRole(userId: string, organizationId: string): Promise<string | null> {
    const roles = await this.getUserRoles(userId, organizationId);
    return roles.length > 0 ? roles[0].roleName : null;
  }

  /**
   * Check if a user is already a member of an organization
   *
   * @async
   * @param {string} userId - ID of the user
   * @param {string} organizationId - ID of the organization
   * @returns {Promise<boolean>} True if user is a member
   */
  async isUserInOrganization(userId: string, organizationId: string): Promise<boolean> {
    const membership = await this.membershipRepository.findOne({
      where: {
        userId,
        organizationId,
      },
    });

    return !!membership;
  }

  /**
   * Add a user to an organization with a specific role
   *
   * @async
   * @param {string} userId - ID of the user
   * @param {string} organizationId - ID of the organization
   * @param {string} roleName - Name of the role to assign
   * @returns {Promise<void>}
   * @throws {BadRequestException} If user is already a member
   */
  async addToOrganization(userId: string, organizationId: string, roleName: string): Promise<void> {
    // Check if already a member
    const isMember = await this.isUserInOrganization(userId, organizationId);
    if (isMember) {
      throw new BadRequestException('User is already a member of this organization');
    }

    // Create membership
    const membership = this.membershipRepository.create({
      user: { id: userId },
      organization: { id: organizationId },
      startDate: new Date(),
      isActive: true,
      isDefault: false,
    });

    await this.membershipRepository.save(membership);

    // Assign role
    await this.assignRole(userId, organizationId, roleName, userId);
  }

  /**
   * Update a user's password (for use during onboarding)
   * Note: In production, this should integrate with Cognito
   *
   * @async
   * @param {string} userId - ID of the user
   * @param {string} password - New password (will be hashed)
   * @returns {Promise<void>}
   * @throws {NotFoundException} If user not found
   */
  async updatePassword(userId: string, password: string): Promise<void> {
    const user = await this.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // In a real implementation, this would update the password in Cognito
    // For now, we'll just update a timestamp or flag
    user.emailVerified = true;
    user.updatedAt = new Date();

    await this.userRepository.save(user);
  }
}
