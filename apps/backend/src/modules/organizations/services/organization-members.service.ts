import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../entities/organization.entity';
import { User } from '../../users/entities/user.entity';
import { UserOrganizationMembership } from '../../users/entities/user-organization-membership.entity';
import { CreateMembershipDto } from '../dto/create-membership.dto';
import { UpdateMembershipDto } from '../dto/update-membership.dto';
import { CreateInvitationDto } from '../dto/create-invitation.dto';
import { UserRole } from '@saas-template/shared';

export interface OrganizationMember extends User {
  role: string;
  joinedAt: Date;
  permissions?: string[];
}

@Injectable()
export class OrganizationMembersService {
  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserOrganizationMembership)
    private membershipRepository: Repository<UserOrganizationMembership>,
  ) {}

  async findMembers(
    organizationId: string,
    filters?: { role?: string; status?: string },
  ): Promise<OrganizationMember[]> {
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const query = this.membershipRepository
      .createQueryBuilder('membership')
      .innerJoinAndSelect('membership.user', 'user')
      .where('membership.organizationId = :organizationId', { organizationId });

    if (filters?.role) {
      query.andWhere('membership.role = :role', { role: filters.role });
    }

    const memberships = await query.getMany();

    return memberships.map((membership) => {
      const member = membership.user as OrganizationMember;
      member.role = membership.role;
      member.joinedAt = membership.createdAt;
      member.permissions = membership.permissions;
      return member;
    });
  }

  async addMember(
    organizationId: string,
    createMembershipDto: CreateMembershipDto,
  ): Promise<UserOrganizationMembership> {
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const user = await this.userRepository.findOne({
      where: { id: createMembershipDto.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if membership already exists
    const existingMembership = await this.membershipRepository.findOne({
      where: {
        userId: createMembershipDto.userId,
        organizationId,
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
      isActive: true,
    });

    return this.membershipRepository.save(membership);
  }

  async updateMemberRole(
    organizationId: string,
    userId: string,
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
    if (membership.role === UserRole.SUPER_ADMIN && updateMembershipDto.role !== UserRole.SUPER_ADMIN) {
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

    return this.membershipRepository.save(membership);
  }

  async removeMember(organizationId: string, userId: string): Promise<void> {
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

  async addMultipleMembers(
    organizationId: string,
    members: CreateMembershipDto[],
  ): Promise<UserOrganizationMembership[]> {
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const memberships: UserOrganizationMembership[] = [];

    for (const memberDto of members) {
      try {
        const membership = await this.addMember(organizationId, memberDto);
        memberships.push(membership);
      } catch (error) {
        // Continue with other members if one fails
        console.error(`Failed to add member ${memberDto.userId}:`, error);
      }
    }

    return memberships;
  }

  async removeMultipleMembers(
    organizationId: string,
    userIds: string[],
  ): Promise<void> {
    for (const userId of userIds) {
      try {
        await this.removeMember(organizationId, userId);
      } catch (error) {
        // Continue with other members if one fails
        console.error(`Failed to remove member ${userId}:`, error);
      }
    }
  }

  async sendInvitation(
    organizationId: string,
    createInvitationDto: CreateInvitationDto,
  ): Promise<any> {
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createInvitationDto.email },
    });

    if (existingUser) {
      // Check if already a member
      const existingMembership = await this.membershipRepository.findOne({
        where: {
          userId: existingUser.id,
          organizationId,
        },
      });

      if (existingMembership) {
        throw new ConflictException('User is already a member of this organization');
      }
    }

    // TODO: Implement actual invitation logic
    // This would typically involve:
    // 1. Creating an invitation record in the database
    // 2. Sending an email with invitation link
    // 3. Setting expiration time for the invitation

    return {
      id: `inv_${Date.now()}`,
      email: createInvitationDto.email,
      role: createInvitationDto.role,
      message: createInvitationDto.message,
      organizationId,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    };
  }

  async getPendingInvitations(organizationId: string): Promise<any[]> {
    // TODO: Implement actual invitation retrieval
    // This would query the invitations table
    return [];
  }

  async cancelInvitation(
    organizationId: string,
    invitationId: string,
  ): Promise<void> {
    // TODO: Implement invitation cancellation
    // This would update the invitation status or delete it
  }
}