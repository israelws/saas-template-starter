import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Not } from 'typeorm';
import { User } from './entities/user.entity';
import { UserOrganizationMembership } from './entities/user-organization-membership.entity';
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
    private readonly dataSource: DataSource,
  ) {}

  async create(createUserDto: CreateUserDto & { cognitoId: string }): Promise<User> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create user
      const user = this.userRepository.create({
        ...createUserDto,
        status: UserStatus.ACTIVE,
        emailVerified: false,
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
    
    const [users, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { [sortBy]: sortOrder },
    });

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
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

  async removeOrganizationMembership(
    userId: string,
    organizationId: string,
  ): Promise<void> {
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

  async setDefaultOrganization(
    userId: string,
    organizationId: string,
  ): Promise<void> {
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
}