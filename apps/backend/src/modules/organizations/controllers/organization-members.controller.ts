import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AbacGuard } from '../../abac/guards/abac.guard';
import { RequirePermission } from '../../abac/decorators/require-permission.decorator';
import {
  OrganizationMembersService,
  OrganizationMember,
} from '../services/organization-members.service';
import { CreateMembershipDto } from '../dto/create-membership.dto';
import { UpdateMembershipDto } from '../dto/update-membership.dto';
import { CreateInvitationDto } from '../dto/create-invitation.dto';

@ApiTags('Organization Members')
@ApiBearerAuth()
@Controller('organizations/:organizationId/members')
@UseGuards(JwtAuthGuard, AbacGuard)
export class OrganizationMembersController {
  constructor(private readonly membersService: OrganizationMembersService) {}

  @Get()
  @RequirePermission('organization', 'members:read')
  @ApiOperation({ summary: 'Get organization members' })
  async getMembers(
    @Param('organizationId') organizationId: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
  ): Promise<OrganizationMember[]> {
    return this.membersService.findMembers(organizationId, { role, status });
  }

  @Post()
  @RequirePermission('organization', 'members:create')
  @ApiOperation({ summary: 'Add member to organization' })
  async addMember(
    @Param('organizationId') organizationId: string,
    @Body() createMembershipDto: CreateMembershipDto,
  ) {
    return this.membersService.addMember(organizationId, createMembershipDto);
  }

  @Put(':userId')
  @RequirePermission('organization', 'members:update')
  @ApiOperation({ summary: 'Update member role' })
  async updateMemberRole(
    @Param('organizationId') organizationId: string,
    @Param('userId') userId: string,
    @Body() updateMembershipDto: UpdateMembershipDto,
  ) {
    return this.membersService.updateMemberRole(organizationId, userId, updateMembershipDto);
  }

  @Delete(':userId')
  @RequirePermission('organization', 'members:delete')
  @ApiOperation({ summary: 'Remove member from organization' })
  async removeMember(
    @Param('organizationId') organizationId: string,
    @Param('userId') userId: string,
  ) {
    return this.membersService.removeMember(organizationId, userId);
  }

  @Post('bulk')
  @RequirePermission('organization', 'members:create')
  @ApiOperation({ summary: 'Add multiple members' })
  async addMultipleMembers(
    @Param('organizationId') organizationId: string,
    @Body() members: CreateMembershipDto[],
  ) {
    return this.membersService.addMultipleMembers(organizationId, members);
  }

  @Delete('bulk')
  @RequirePermission('organization', 'members:delete')
  @ApiOperation({ summary: 'Remove multiple members' })
  async removeMultipleMembers(
    @Param('organizationId') organizationId: string,
    @Body() userIds: string[],
  ) {
    return this.membersService.removeMultipleMembers(organizationId, userIds);
  }
}

@ApiTags('Organization Invitations')
@ApiBearerAuth()
@Controller('organizations/:organizationId/invitations')
@UseGuards(JwtAuthGuard, AbacGuard)
export class OrganizationInvitationsController {
  constructor(private readonly membersService: OrganizationMembersService) {}

  @Post()
  @RequirePermission('organization', 'invitations:create')
  @ApiOperation({ summary: 'Send invitation to join organization' })
  async sendInvitation(
    @Param('organizationId') organizationId: string,
    @Body() createInvitationDto: CreateInvitationDto,
  ) {
    return this.membersService.sendInvitation(organizationId, createInvitationDto);
  }

  @Get()
  @RequirePermission('organization', 'invitations:read')
  @ApiOperation({ summary: 'Get pending invitations' })
  async getPendingInvitations(@Param('organizationId') organizationId: string) {
    return this.membersService.getPendingInvitations(organizationId);
  }

  @Delete(':invitationId')
  @RequirePermission('organization', 'invitations:delete')
  @ApiOperation({ summary: 'Cancel invitation' })
  async cancelInvitation(
    @Param('organizationId') organizationId: string,
    @Param('invitationId') invitationId: string,
  ) {
    return this.membersService.cancelInvitation(organizationId, invitationId);
  }
}
