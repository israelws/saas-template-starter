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
import { 
  ApiTags, 
  ApiOperation, 
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody
} from '@nestjs/swagger';
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

  // Multi-role management endpoints
  @Get(':id/roles')
  @ApiOperation({ 
    summary: 'Get user roles for an organization',
    description: 'Retrieves all roles assigned to a user within a specific organization, including priority and validity information'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'User ID',
    type: 'string',
    format: 'uuid'
  })
  @ApiQuery({ 
    name: 'organizationId', 
    description: 'Organization ID to filter roles',
    type: 'string',
    required: true
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of user roles with details',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          role_name: { type: 'string', example: 'manager' },
          priority: { type: 'number', example: 100 },
          assigned_at: { type: 'string', format: 'date-time' },
          assigned_by: { type: 'string', format: 'uuid' },
          valid_from: { type: 'string', format: 'date-time' },
          valid_to: { type: 'string', format: 'date-time', nullable: true },
          is_active: { type: 'boolean' }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  getUserRoles(
    @Param('id', ParseUUIDPipe) userId: string,
    @Query('organizationId', ParseUUIDPipe) organizationId: string,
  ) {
    return this.usersService.getUserRoles(userId, organizationId);
  }

  @Post(':id/roles')
  @ApiOperation({ 
    summary: 'Assign a role to user',
    description: 'Assigns a new role to a user with optional priority and expiration date. Supports multi-role assignment.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'User ID',
    type: 'string',
    format: 'uuid'
  })
  @ApiBody({
    description: 'Role assignment details',
    schema: {
      type: 'object',
      required: ['organizationId', 'roleName', 'assignedBy'],
      properties: {
        organizationId: { 
          type: 'string', 
          format: 'uuid',
          description: 'Organization ID where role applies'
        },
        roleName: { 
          type: 'string',
          description: 'Role name to assign',
          example: 'manager',
          enum: ['admin', 'manager', 'branch_manager', 'agent', 'secretary', 'auditor', 'user']
        },
        assignedBy: { 
          type: 'string', 
          format: 'uuid',
          description: 'ID of user assigning the role'
        },
        priority: { 
          type: 'number',
          description: 'Role priority (higher number = higher priority)',
          example: 100,
          minimum: 0,
          maximum: 1000
        },
        validTo: { 
          type: 'string', 
          format: 'date-time',
          description: 'Optional expiration date for temporary roles',
          example: '2024-12-31T23:59:59Z'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Role successfully assigned',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        userId: { type: 'string', format: 'uuid' },
        organizationId: { type: 'string', format: 'uuid' },
        roleName: { type: 'string' },
        priority: { type: 'number' },
        assignedAt: { type: 'string', format: 'date-time' },
        assignedBy: { type: 'string', format: 'uuid' },
        validFrom: { type: 'string', format: 'date-time' },
        validTo: { type: 'string', format: 'date-time', nullable: true },
        isActive: { type: 'boolean' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid role data or role already exists' })
  @ApiResponse({ status: 404, description: 'User or organization not found' })
  assignRole(
    @Param('id', ParseUUIDPipe) userId: string,
    @Body() body: {
      organizationId: string;
      roleName: string;
      assignedBy: string;
      priority?: number;
      validTo?: string;
    },
  ) {
    return this.usersService.assignRole(
      userId,
      body.organizationId,
      body.roleName,
      body.assignedBy,
      {
        priority: body.priority,
        validTo: body.validTo ? new Date(body.validTo) : undefined,
      },
    );
  }

  @Delete(':id/roles/:roleName')
  @ApiOperation({ 
    summary: 'Remove a role from user',
    description: 'Removes a specific role from a user in an organization'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'User ID',
    type: 'string',
    format: 'uuid'
  })
  @ApiParam({ 
    name: 'roleName', 
    description: 'Role name to remove',
    type: 'string',
    example: 'manager'
  })
  @ApiQuery({ 
    name: 'organizationId', 
    description: 'Organization ID where role is assigned',
    type: 'string',
    required: true
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Role successfully removed' 
  })
  @ApiResponse({ status: 404, description: 'User, role, or organization not found' })
  removeRole(
    @Param('id', ParseUUIDPipe) userId: string,
    @Param('roleName') roleName: string,
    @Query('organizationId', ParseUUIDPipe) organizationId: string,
  ) {
    return this.usersService.removeRole(userId, organizationId, roleName);
  }

  @Patch(':id/roles/:roleName')
  @ApiOperation({ 
    summary: 'Update role priority',
    description: 'Updates the priority of an existing role assignment. Higher priority roles take precedence in permission evaluation.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'User ID',
    type: 'string',
    format: 'uuid'
  })
  @ApiParam({ 
    name: 'roleName', 
    description: 'Role name to update',
    type: 'string',
    example: 'manager'
  })
  @ApiBody({
    description: 'Priority update details',
    schema: {
      type: 'object',
      required: ['organizationId', 'priority'],
      properties: {
        organizationId: { 
          type: 'string', 
          format: 'uuid',
          description: 'Organization ID where role is assigned'
        },
        priority: { 
          type: 'number',
          description: 'New priority value (higher = more precedence)',
          example: 200,
          minimum: 0,
          maximum: 1000
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Role priority successfully updated',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        roleName: { type: 'string' },
        priority: { type: 'number' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'User, role, or organization not found' })
  updateRolePriority(
    @Param('id', ParseUUIDPipe) userId: string,
    @Param('roleName') roleName: string,
    @Body() body: { organizationId: string; priority: number },
  ) {
    return this.usersService.updateRolePriority(
      userId,
      body.organizationId,
      roleName,
      body.priority,
    );
  }
}