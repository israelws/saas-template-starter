import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AbacGuard } from '../../abac/guards/abac.guard';
import { RequirePermission } from '../../abac/decorators/require-permission.decorator';
import { UserMembershipsService } from '../services/user-memberships.service';
import { CreateMembershipDto } from '../dto/create-membership.dto';
import { UpdateMembershipDto } from '../dto/update-membership.dto';

@ApiTags('User Memberships')
@ApiBearerAuth()
@Controller('users/:userId/memberships')
@UseGuards(JwtAuthGuard, AbacGuard)
export class UserMembershipsController {
  constructor(private readonly membershipsService: UserMembershipsService) {}

  @Get()
  @RequirePermission('user', 'memberships:read')
  @ApiOperation({ summary: 'Get user organization memberships' })
  async getUserMemberships(@Param('userId') userId: string, @Query('status') status?: string) {
    return this.membershipsService.getUserMemberships(userId, status);
  }

  @Post()
  @RequirePermission('user', 'memberships:create')
  @ApiOperation({ summary: 'Add user to organization' })
  async addMembership(
    @Param('userId') userId: string,
    @Body() createMembershipDto: CreateMembershipDto,
  ) {
    return this.membershipsService.addMembership(userId, createMembershipDto);
  }

  @Patch(':organizationId')
  @RequirePermission('user', 'memberships:update')
  @ApiOperation({ summary: 'Update user role in organization' })
  async updateMembership(
    @Param('userId') userId: string,
    @Param('organizationId') organizationId: string,
    @Body() updateMembershipDto: UpdateMembershipDto,
  ) {
    return this.membershipsService.updateMembership(userId, organizationId, updateMembershipDto);
  }

  @Delete(':organizationId')
  @RequirePermission('user', 'memberships:delete')
  @ApiOperation({ summary: 'Remove user from organization' })
  async removeMembership(
    @Param('userId') userId: string,
    @Param('organizationId') organizationId: string,
  ) {
    return this.membershipsService.removeMembership(userId, organizationId);
  }

  @Post('bulk')
  @RequirePermission('user', 'memberships:create')
  @ApiOperation({ summary: 'Add user to multiple organizations' })
  async addBulkMemberships(
    @Param('userId') userId: string,
    @Body() memberships: CreateMembershipDto[],
  ) {
    return this.membershipsService.addBulkMemberships(userId, memberships);
  }

  @Delete('bulk')
  @RequirePermission('user', 'memberships:delete')
  @ApiOperation({ summary: 'Remove user from multiple organizations' })
  async removeBulkMemberships(@Param('userId') userId: string, @Body() organizationIds: string[]) {
    return this.membershipsService.removeBulkMemberships(userId, organizationIds);
  }
}
