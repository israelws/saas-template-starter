import { Injectable } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { UserOrganizationMembership } from '../entities/user-organization-membership.entity';
import { UserRole } from '@saas-template/shared';

@Injectable()
export class UserRepository extends Repository<User> {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserOrganizationMembership)
    private readonly membershipRepository: Repository<UserOrganizationMembership>,
  ) {
    super(User, dataSource.createEntityManager());
  }

  async findByCognitoId(cognitoId: string): Promise<User | null> {
    return this.findOne({
      where: { cognitoId },
      relations: ['memberships', 'memberships.organization'],
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({
      where: { email },
      relations: ['memberships', 'memberships.organization'],
    });
  }

  async findUsersInOrganization(
    organizationId: string,
    includeDescendants = false,
  ): Promise<User[]> {
    const queryBuilder = this.createQueryBuilder('user')
      .innerJoin('user.memberships', 'membership')
      .leftJoinAndSelect('user.memberships', 'allMemberships')
      .leftJoinAndSelect('allMemberships.organization', 'organization');

    if (includeDescendants) {
      queryBuilder
        .innerJoin(
          'organizations_closure',
          'closure',
          'closure.descendantId = membership.organizationId',
        )
        .where('closure.ancestorId = :organizationId', { organizationId });
    } else {
      queryBuilder.where('membership.organizationId = :organizationId', {
        organizationId,
      });
    }

    return queryBuilder.distinct(true).getMany();
  }

  async findUsersByRole(role: string, organizationId?: string): Promise<User[]> {
    const queryBuilder = this.createQueryBuilder('user')
      .innerJoin('user.memberships', 'membership')
      .leftJoinAndSelect('user.memberships', 'allMemberships')
      .leftJoinAndSelect('allMemberships.organization', 'organization')
      .where('membership.role = :role', { role });

    if (organizationId) {
      queryBuilder.andWhere('membership.organizationId = :organizationId', {
        organizationId,
      });
    }

    return queryBuilder.distinct(true).getMany();
  }

  async getUserOrganizations(userId: string): Promise<UserOrganizationMembership[]> {
    return this.membershipRepository.find({
      where: { userId },
      relations: ['organization'],
      order: { createdAt: 'DESC' },
    });
  }

  async addUserToOrganization(
    userId: string,
    organizationId: string,
    role: UserRole,
    attributes?: Record<string, any>,
  ): Promise<UserOrganizationMembership> {
    const existingMembership = await this.membershipRepository.findOne({
      where: { userId, organizationId },
    });

    if (existingMembership) {
      existingMembership.role = role;
      existingMembership.metadata = attributes || {};
      return this.membershipRepository.save(existingMembership);
    }

    const membership = this.membershipRepository.create({
      userId,
      organizationId,
      role,
      metadata: attributes || {},
    });

    return this.membershipRepository.save(membership);
  }

  async removeUserFromOrganization(userId: string, organizationId: string): Promise<void> {
    await this.membershipRepository.delete({ userId, organizationId });
  }

  async updateUserAttributes(userId: string, attributes: Record<string, any>): Promise<User> {
    const user = await this.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    user.attributes = { ...user.attributes, ...attributes };
    return this.save(user);
  }

  async updateMembershipAttributes(
    userId: string,
    organizationId: string,
    attributes: Record<string, any>,
  ): Promise<UserOrganizationMembership> {
    const membership = await this.membershipRepository.findOne({
      where: { userId, organizationId },
    });

    if (!membership) {
      throw new Error('Membership not found');
    }

    membership.metadata = { ...membership.metadata, ...attributes };
    return this.membershipRepository.save(membership);
  }

  async searchUsers(
    searchTerm: string,
    filters?: {
      status?: string;
      organizationId?: string;
      role?: string;
    },
  ): Promise<User[]> {
    const queryBuilder = this.createQueryBuilder('user')
      .leftJoinAndSelect('user.memberships', 'membership')
      .leftJoinAndSelect('membership.organization', 'organization');

    if (searchTerm) {
      queryBuilder.where(
        '(user.email ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search)',
        { search: `%${searchTerm}%` },
      );
    }

    if (filters?.status) {
      queryBuilder.andWhere('user.status = :status', { status: filters.status });
    }

    if (filters?.organizationId) {
      queryBuilder.andWhere('membership.organizationId = :organizationId', {
        organizationId: filters.organizationId,
      });
    }

    if (filters?.role) {
      queryBuilder.andWhere('membership.role = :role', { role: filters.role });
    }

    return queryBuilder.distinct(true).orderBy('user.lastName', 'ASC').getMany();
  }

  async getUserStats(userId: string): Promise<{
    organizationCount: number;
    rolesCount: number;
    lastLogin: Date | null;
  }> {
    const memberships = await this.membershipRepository.find({
      where: { userId },
    });

    const uniqueRoles = new Set(memberships.map((m) => m.role));

    const user = await this.findOne({ where: { id: userId } });

    return {
      organizationCount: memberships.length,
      rolesCount: uniqueRoles.size,
      lastLogin: user?.lastLoginAt || null,
    };
  }

  async bulkCreateUsers(
    users: Partial<User>[],
    organizationId?: string,
    defaultRole?: UserRole,
  ): Promise<User[]> {
    const createdUsers: User[] = [];

    for (const userData of users) {
      const user = this.create(userData);
      const savedUser = await this.save(user);

      if (organizationId && defaultRole) {
        await this.addUserToOrganization(savedUser.id, organizationId, defaultRole);
      }

      createdUsers.push(savedUser);
    }

    return createdUsers;
  }

  async findUsersWithExpiredSessions(): Promise<User[]> {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    return this.createQueryBuilder('user')
      .where('user.lastLogin < :oneDayAgo', { oneDayAgo })
      .andWhere('user.status = :status', { status: 'active' })
      .getMany();
  }
}
