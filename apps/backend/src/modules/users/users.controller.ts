import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateUserDto,
  UpdateUserDto,
  PaginationParams,
  UserRole,
} from '@saas-template/shared';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  findAll(@Query() params: PaginationParams) {
    return this.usersService.findAll(params);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Get(':id/memberships')
  @ApiOperation({ summary: 'Get user with organization memberships' })
  findWithMemberships(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOneWithMemberships(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate user' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }

  @Post(':id/organizations/:organizationId')
  @ApiOperation({ summary: 'Add user to organization' })
  addToOrganization(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Body('role') role: UserRole = UserRole.USER,
  ) {
    return this.usersService.addOrganizationMembership(id, organizationId, role);
  }

  @Delete(':id/organizations/:organizationId')
  @ApiOperation({ summary: 'Remove user from organization' })
  removeFromOrganization(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
  ) {
    return this.usersService.removeOrganizationMembership(id, organizationId);
  }

  @Patch(':id/organizations/:organizationId/role')
  @ApiOperation({ summary: 'Update user role in organization' })
  updateOrganizationRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Body('role') role: UserRole,
  ) {
    return this.usersService.updateMembershipRole(id, organizationId, role);
  }

  @Post(':id/organizations/:organizationId/set-default')
  @ApiOperation({ summary: 'Set default organization for user' })
  setDefaultOrganization(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
  ) {
    return this.usersService.setDefaultOrganization(id, organizationId);
  }
}