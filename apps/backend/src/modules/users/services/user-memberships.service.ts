import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { UserOrganizationMembership } from '../entities/user-organization-membership.entity';
import { CreateMembershipDto } from '../dto/create-membership.dto';
import { UserRole } from '@saas-template/shared';
import { UpdateMembershipDto } from '../dto/update-membership.dto';

export interface UserOrganizationMembershipDetails {
  organizationId: string;
  organizationName: string;
  organizationType: string;
  role: string;
  permissions?: string[];
  joinedAt: Date;
  isActive: boolean;
}

@Injectable()
export class UserMembershipsService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(UserOrganizationMembership)
    private membershipRepository: Repository<UserOrganizationMembership>,
  ) {}

  async getUserMemberships(
    userId: string,
    status?: string,
  ): Promise<UserOrganizationMembershipDetails[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const query = this.membershipRepository
      .createQueryBuilder('membership')
      .innerJoinAndSelect('membership.organization', 'organization')
      .where('membership.userId = :userId', { userId });

    if (status === 'active') {
      query.andWhere('membership.isActive = :isActive', { isActive: true });
    } else if (status === 'inactive') {
      query.andWhere('membership.isActive = :isActive', { isActive: false });
    }

    const memberships = await query.getMany();

    return memberships.map((membership) => ({
      organizationId: membership.organization.id,
      organizationName: membership.organization.name,
      organizationType: membership.organization.type,
      role: membership.role,
      permissions: membership.permissions,
      joinedAt: membership.createdAt,
      isActive: membership.isActive,
    }));
  }

  async addMembership(
    userId: string,
    createMembershipDto: CreateMembershipDto,
  ): Promise<UserOrganizationMembership> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const organization = await this.organizationRepository.findOne({
      where: { id: createMembershipDto.organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Check if membership already exists
    const existingMembership = await this.membershipRepository.findOne({
      where: {
        userId,
        organizationId: createMembershipDto.organizationId,
      },
    });

    if (existingMembership) {
      throw new ConflictException('User is already a member of this organization');
    }

    const membership = this.membershipRepository.create({
      user,
      organization,
      role: createMembershipDto.role,
      permissions: createMembershipDto.permissions,
      isActive: createMembershipDto.isActive ?? true,
    });

    return this.membershipRepository.save(membership);
  }

  async updateMembership(
    userId: string,
    organizationId: string,
    updateMembershipDto: UpdateMembershipDto,
  ): Promise<UserOrganizationMembership> {
    const membership = await this.membershipRepository.findOne({
      where: {
        userId,
        organizationId,
      },
      relations: ['user', 'organization'],
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    // Prevent changing owner role if it's the last owner
    if (membership.role === UserRole.SUPER_ADMIN && 
        updateMembershipDto.role && 
        updateMembershipDto.role !== UserRole.SUPER_ADMIN) {
      const ownerCount = await this.membershipRepository.count({
        where: {
          organizationId,
          role: UserRole.SUPER_ADMIN,
        },
      });

      if (ownerCount <= 1) {
        throw new BadRequestException('Cannot remove the last owner from organization');
      }
    }

    if (updateMembershipDto.role !== undefined) {
      membership.role = updateMembershipDto.role;
    }

    if (updateMembershipDto.permissions !== undefined) {
      membership.permissions = updateMembershipDto.permissions;
    }

    if (updateMembershipDto.isActive !== undefined) {
      membership.isActive = updateMembershipDto.isActive;
    }

    return this.membershipRepository.save(membership);
  }

  async removeMembership(
    userId: string,
    organizationId: string,
  ): Promise<void> {
    const membership = await this.membershipRepository.findOne({
      where: {
        userId,
        organizationId,
      },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    // Prevent removing the last owner
    if (membership.role === UserRole.SUPER_ADMIN) {
      const ownerCount = await this.membershipRepository.count({
        where: {
          organizationId,
          role: UserRole.SUPER_ADMIN,
        },
      });

      if (ownerCount <= 1) {
        throw new BadRequestException('Cannot remove the last owner from organization');
      }
    }

    await this.membershipRepository.remove(membership);
  }

  async addBulkMemberships(
    userId: string,
    memberships: CreateMembershipDto[],
  ): Promise<UserOrganizationMembership[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const createdMemberships: UserOrganizationMembership[] = [];

    for (const membershipDto of memberships) {
      try {
        const membership = await this.addMembership(userId, membershipDto);
        createdMemberships.push(membership);
      } catch (error) {
        // Continue with other memberships if one fails
        console.error(`Failed to add membership for organization ${membershipDto.organizationId}:`, error);
      }
    }

    return createdMemberships;
  }

  async removeBulkMemberships(
    userId: string,
    organizationIds: string[],
  ): Promise<void> {
    for (const organizationId of organizationIds) {
      try {
        await this.removeMembership(userId, organizationId);
      } catch (error) {
        // Continue with other memberships if one fails
        console.error(`Failed to remove membership for organization ${organizationId}:`, error);
      }
    }
  }
}