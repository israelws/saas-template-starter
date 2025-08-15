import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { randomBytes } from 'crypto';
import { Invitation, InvitationStatus } from './entities/invitation.entity';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { ValidateInvitationDto } from './dto/validate-invitation.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { EmailService } from '../email/email.service';
import { UsersService } from '../users/users.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class InvitationsService {
  private readonly logger = new Logger(InvitationsService.name);
  private readonly invitationExpiryHours: number;
  private readonly maxResendCount: number;
  private readonly baseUrl: string;

  constructor(
    @InjectRepository(Invitation)
    private readonly invitationRepository: Repository<Invitation>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly emailService: EmailService,
    private readonly usersService: UsersService,
    private readonly organizationsService: OrganizationsService,
    private readonly configService: ConfigService,
  ) {
    this.invitationExpiryHours = this.configService.get<number>('INVITATION_EXPIRY_HOURS', 72);
    this.maxResendCount = this.configService.get<number>('MAX_INVITATION_RESEND_COUNT', 5);
    this.baseUrl = this.configService.get<string>('APP_BASE_URL', 'http://localhost:3000');
  }

  async create(createInvitationDto: CreateInvitationDto, invitedById: string): Promise<Invitation> {
    // Get inviter details
    const inviter = await this.usersService.findOne(invitedById);
    if (!inviter) {
      throw new NotFoundException('Inviter not found');
    }

    // Check if this is a system-level invitation
    const isSystemLevel = !createInvitationDto.organizationId;

    // Only super admins can send system-level invitations
    if (isSystemLevel && !inviter.isSuperAdmin()) {
      throw new BadRequestException('Only super admins can send system-level invitations');
    }

    // Check if super_admin role is being assigned
    if (createInvitationDto.roleId === 'super_admin' && !inviter.isSuperAdmin()) {
      throw new BadRequestException('Only super admins can invite other super admins');
    }

    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(createInvitationDto.email);
    if (existingUser) {
      // For system-level invitations, check if user is already a super admin
      if (isSystemLevel && existingUser.isSuperAdmin()) {
        throw new ConflictException('User is already a system administrator');
      }

      // For organization invitations, check membership
      if (!isSystemLevel) {
        const isMember = await this.usersService.isUserInOrganization(
          existingUser.id,
          createInvitationDto.organizationId,
        );
        if (isMember) {
          throw new ConflictException('User is already a member of this organization');
        }
      }
    }

    // Check for existing pending invitation
    const whereClause: any = {
      email: createInvitationDto.email,
      status: InvitationStatus.PENDING,
    };

    // For organization invitations, check within the same org
    // For system invitations, check for any system-level invitation
    if (createInvitationDto.organizationId) {
      whereClause.organizationId = createInvitationDto.organizationId;
    } else {
      whereClause.organizationId = null;
    }

    const existingInvitation = await this.invitationRepository.findOne({
      where: whereClause,
    });

    if (existingInvitation) {
      // Check if invitation is still valid
      if (new Date() < existingInvitation.expiresAt) {
        throw new ConflictException('An active invitation already exists for this email');
      }
      // Mark old invitation as expired
      existingInvitation.status = InvitationStatus.EXPIRED;
      await this.invitationRepository.save(existingInvitation);
    }

    // Get organization details (if not system-level)
    let organization = null;
    if (createInvitationDto.organizationId) {
      organization = await this.organizationsService.findOne(createInvitationDto.organizationId);
      if (!organization) {
        throw new NotFoundException('Organization not found');
      }
    }

    // Generate invitation token
    const token = this.generateInvitationToken();

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.invitationExpiryHours);

    // Create invitation
    const invitation = this.invitationRepository.create({
      ...createInvitationDto,
      invitedById,
      token,
      expiresAt,
      status: InvitationStatus.PENDING,
    });

    const savedInvitation = await this.invitationRepository.save(invitation);

    // Send invitation email
    try {
      await this.sendInvitationEmail(savedInvitation, organization, inviter);
    } catch (error) {
      this.logger.error(`Failed to send invitation email: ${error.message}`);
      // Don't fail the invitation creation if email fails
    }

    return savedInvitation;
  }

  async findAll(organizationId?: string): Promise<Invitation[]> {
    const query = this.invitationRepository
      .createQueryBuilder('invitation')
      .leftJoinAndSelect('invitation.organization', 'organization')
      .leftJoinAndSelect('invitation.invitedBy', 'invitedBy')
      .leftJoinAndSelect('invitation.acceptedUser', 'acceptedUser');

    if (organizationId && organizationId !== 'undefined') {
      query.where('invitation.organizationId = :organizationId', { organizationId });
    }

    return query.orderBy('invitation.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<Invitation> {
    const invitation = await this.invitationRepository.findOne({
      where: { id },
      relations: ['organization', 'invitedBy', 'acceptedUser'],
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    return invitation;
  }

  async findByToken(token: string): Promise<Invitation> {
    const invitation = await this.invitationRepository.findOne({
      where: { token },
      relations: ['organization'],
    });

    if (!invitation) {
      throw new NotFoundException('Invalid invitation token');
    }

    return invitation;
  }

  async validate(
    validateDto: ValidateInvitationDto,
  ): Promise<{ valid: boolean; invitation?: Invitation; reason?: string }> {
    try {
      const invitation = await this.findByToken(validateDto.token);

      // Check if invitation is expired
      if (new Date() > invitation.expiresAt) {
        // Update status if not already expired
        if (invitation.status === InvitationStatus.PENDING) {
          invitation.status = InvitationStatus.EXPIRED;
          await this.invitationRepository.save(invitation);
        }
        return { valid: false, reason: 'Invitation has expired' };
      }

      // Check if invitation is still pending
      if (invitation.status !== InvitationStatus.PENDING) {
        const reasons = {
          [InvitationStatus.ACCEPTED]: 'Invitation has already been accepted',
          [InvitationStatus.EXPIRED]: 'Invitation has expired',
          [InvitationStatus.REVOKED]: 'Invitation has been revoked',
        };
        return { valid: false, reason: reasons[invitation.status] || 'Invalid invitation status' };
      }

      // Additional check: Verify email hasn't been changed
      const existingUser = await this.usersService.findByEmail(invitation.email);
      if (existingUser) {
        // For organization invitations, check if user is already a member
        if (invitation.organizationId) {
          const isMember = await this.usersService.isUserInOrganization(
            existingUser.id,
            invitation.organizationId,
          );
          if (isMember) {
            return { valid: false, reason: 'User is already a member of this organization' };
          }
        }
        // For system invitations, check if user is already a super admin
        else if (existingUser.isSuperAdmin()) {
          return { valid: false, reason: 'User is already a system administrator' };
        }
      }

      return { valid: true, invitation };
    } catch (error) {
      return { valid: false, reason: 'Invalid invitation token' };
    }
  }

  async accept(acceptDto: AcceptInvitationDto): Promise<{ user: any; organization: any }> {
    const invitation = await this.findByToken(acceptDto.token);

    // Validate invitation
    const validationResult = await this.validate({ token: acceptDto.token });
    if (!validationResult.valid) {
      throw new BadRequestException(validationResult.reason || 'Invalid or expired invitation');
    }

    // Check if user already exists
    let user = await this.usersService.findByEmail(invitation.email);

    if (user) {
      // Update existing user's password if they're accepting an invitation
      await this.usersService.updatePassword(user.id, acceptDto.password);
    } else {
      // Create new user
      user = await this.usersService.create({
        email: invitation.email,
        firstName: acceptDto.firstName || invitation.firstName,
        lastName: acceptDto.lastName || invitation.lastName,
        password: acceptDto.password,
        isEmailVerified: true, // Auto-verify email since they received the invitation
      });
    }

    // Handle system-level vs organization invitations
    if (invitation.organizationId) {
      // Add user to organization with specified role
      await this.usersService.addToOrganization(
        user.id,
        invitation.organizationId,
        invitation.roleId,
      );
    } else {
      // For system-level invitations, set super admin in metadata
      user.metadata = user.metadata || {};
      user.metadata.isSuperAdmin = true;
      await this.userRepository.save(user);
    }

    // Update invitation status
    invitation.status = InvitationStatus.ACCEPTED;
    invitation.acceptedAt = new Date();
    invitation.acceptedUserId = user.id;
    await this.invitationRepository.save(invitation);

    // Get organization details (if applicable)
    let organization = null;
    if (invitation.organizationId) {
      organization = await this.organizationsService.findOne(invitation.organizationId);
    }

    // Send welcome email to the new user
    try {
      await this.emailService.sendWelcomeEmail(
        user.email,
        {
          userName: `${user.firstName} ${user.lastName}`,
          organizationName: organization?.name,
          dashboardUrl: `${this.baseUrl}/dashboard`,
          isSystemAdmin: !invitation.organizationId && invitation.roleId === 'super_admin',
        },
        invitation.organizationId,
      );
    } catch (error) {
      this.logger.error(`Failed to send welcome email: ${error.message}`);
    }

    // Notify the inviter that the invitation was accepted
    try {
      const inviter = await this.usersService.findOne(invitation.invitedById);
      if (inviter) {
        await this.emailService.sendInvitationAcceptedEmail(
          inviter.email,
          {
            inviterName: inviter.firstName,
            acceptedByName: `${user.firstName} ${user.lastName}`,
            acceptedByEmail: user.email,
            organizationName: organization?.name || 'SAAS Platform',
            role:
              invitation.roleId === 'super_admin'
                ? 'Super Administrator'
                : invitation.roleId === 'admin'
                  ? 'Administrator'
                  : invitation.roleId === 'member'
                    ? 'Member'
                    : invitation.roleId,
          },
          invitation.organizationId,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to send invitation accepted email: ${error.message}`);
    }

    return { user, organization };
  }

  async resend(id: string): Promise<Invitation> {
    const invitation = await this.findOne(id);

    // Check if invitation can be resent
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Only pending invitations can be resent');
    }

    if (invitation.resendCount >= this.maxResendCount) {
      throw new BadRequestException('Maximum resend limit reached');
    }

    // Update resend count and timestamp
    invitation.resendCount += 1;
    invitation.lastResentAt = new Date();

    // Extend expiry if needed
    const newExpiryDate = new Date();
    newExpiryDate.setHours(newExpiryDate.getHours() + this.invitationExpiryHours);
    if (newExpiryDate > invitation.expiresAt) {
      invitation.expiresAt = newExpiryDate;
    }

    const updatedInvitation = await this.invitationRepository.save(invitation);

    // Get related data for email
    const organization = await this.organizationsService.findOne(invitation.organizationId);
    const inviter = await this.usersService.findOne(invitation.invitedById);

    // Send invitation email
    try {
      await this.sendInvitationEmail(updatedInvitation, organization, inviter);
    } catch (error) {
      this.logger.error(`Failed to resend invitation email: ${error.message}`);
      throw new BadRequestException('Failed to send invitation email');
    }

    return updatedInvitation;
  }

  async revoke(id: string): Promise<Invitation> {
    const invitation = await this.findOne(id);

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Only pending invitations can be revoked');
    }

    invitation.status = InvitationStatus.REVOKED;
    return this.invitationRepository.save(invitation);
  }

  async expireInvitations(): Promise<number> {
    // Update pending invitations that have expired
    const result = await this.invitationRepository
      .createQueryBuilder()
      .update(Invitation)
      .set({ status: InvitationStatus.EXPIRED })
      .where('status = :status', { status: InvitationStatus.PENDING })
      .andWhere('expiresAt < :now', { now: new Date() })
      .execute();

    const expiredCount = result.affected || 0;

    if (expiredCount > 0) {
      this.logger.log(`Expired ${expiredCount} invitation(s)`);
    }

    return expiredCount;
  }

  async deleteExpired(): Promise<number> {
    // Delete invitations that have been expired for more than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.invitationRepository
      .createQueryBuilder()
      .delete()
      .where('status = :status', { status: InvitationStatus.EXPIRED })
      .andWhere('updatedAt < :date', { date: thirtyDaysAgo })
      .execute();

    const deletedCount = result.affected || 0;

    if (deletedCount > 0) {
      this.logger.log(`Deleted ${deletedCount} old expired invitation(s)`);
    }

    return deletedCount;
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleExpiredInvitations() {
    try {
      this.logger.debug('Running invitation expiry check...');

      // First, expire any pending invitations that have passed their expiry date
      const expiredCount = await this.expireInvitations();

      // Then, delete old expired invitations to keep the database clean
      const deletedCount = await this.deleteExpired();

      if (expiredCount > 0 || deletedCount > 0) {
        this.logger.log(
          `Invitation cleanup completed: ${expiredCount} expired, ${deletedCount} deleted`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to handle expired invitations', error);
    }
  }

  private generateInvitationToken(): string {
    return randomBytes(32).toString('hex');
  }

  async getStatistics(organizationId?: string): Promise<{
    total: number;
    pending: number;
    accepted: number;
    expired: number;
    revoked: number;
    acceptanceRate: number;
    averageTimeToAccept: number;
  }> {
    const query = this.invitationRepository.createQueryBuilder('invitation');

    if (organizationId) {
      query.where('invitation.organizationId = :organizationId', { organizationId });
    }

    // Get counts by status
    const statusCounts = await query
      .select('invitation.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('invitation.status')
      .getRawMany();

    const stats = {
      total: 0,
      pending: 0,
      accepted: 0,
      expired: 0,
      revoked: 0,
      acceptanceRate: 0,
      averageTimeToAccept: 0,
    };

    // Process status counts
    statusCounts.forEach(({ status, count }) => {
      const countNum = parseInt(count, 10);
      stats.total += countNum;
      stats[status] = countNum;
    });

    // Calculate acceptance rate
    if (stats.total > 0) {
      stats.acceptanceRate = (stats.accepted / stats.total) * 100;
    }

    // Calculate average time to accept (in hours)
    if (stats.accepted > 0) {
      const acceptedQuery = this.invitationRepository
        .createQueryBuilder('invitation')
        .where('invitation.status = :status', { status: InvitationStatus.ACCEPTED })
        .andWhere('invitation.acceptedAt IS NOT NULL');

      if (organizationId) {
        acceptedQuery.andWhere('invitation.organizationId = :organizationId', { organizationId });
      }

      const acceptedInvitations = await acceptedQuery
        .select('invitation.createdAt', 'createdAt')
        .addSelect('invitation.acceptedAt', 'acceptedAt')
        .getRawMany();

      const totalHours = acceptedInvitations.reduce((sum, inv) => {
        const created = new Date(inv.createdAt);
        const accepted = new Date(inv.acceptedAt);
        const diffHours = (accepted.getTime() - created.getTime()) / (1000 * 60 * 60);
        return sum + diffHours;
      }, 0);

      stats.averageTimeToAccept = Math.round(totalHours / acceptedInvitations.length);
    }

    return stats;
  }

  private async sendInvitationEmail(
    invitation: Invitation,
    organization: any,
    inviter: any,
  ): Promise<void> {
    const invitationLink = `${this.baseUrl}/onboarding?token=${invitation.token}`;
    const expiresIn = `${this.invitationExpiryHours} hours`;

    const recipientName =
      invitation.firstName && invitation.lastName
        ? `${invitation.firstName} ${invitation.lastName}`
        : invitation.firstName || undefined;

    const emailData: any = {
      recipientName,
      inviterName: `${inviter.firstName} ${inviter.lastName}`,
      inviterEmail: inviter.email,
      invitationUrl: invitationLink,
      expiresIn,
      role:
        invitation.roleId === 'super_admin'
          ? 'Super Administrator'
          : invitation.roleId === 'admin'
            ? 'Administrator'
            : invitation.roleId === 'member'
              ? 'Member'
              : invitation.roleId,
    };

    // Add organization name if it's an organization invitation
    if (organization) {
      emailData.organizationName = organization.name;
    } else {
      // For system invitations, indicate it's a platform invitation
      emailData.organizationName = 'SAAS Platform';
      emailData.isSystemInvitation = true;
    }

    await this.emailService.sendInvitationEmail(
      invitation.email,
      emailData,
      invitation.organizationId,
    );
  }
}
