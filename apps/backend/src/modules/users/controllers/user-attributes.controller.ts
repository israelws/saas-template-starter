import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AbacGuard } from '../../abac/guards/abac.guard';
import { RequirePermission } from '../../abac/decorators/require-permission.decorator';
import {
  OrganizationId,
  ValidateOrganization,
} from '../../../common/decorators/validate-organization.decorator';
import { UserAttributesService } from '../services/user-attributes.service';
import { ApiErrorResponses } from '../../../common/dto/error-response.dto';

export class CreateUserAttributeDto {
  key: string;
  value: any;
  dataType: 'string' | 'number' | 'boolean' | 'array' | 'object';
  isPublic?: boolean;
  description?: string;
}

export class UpdateUserAttributeDto {
  value?: any;
  isPublic?: boolean;
  description?: string;
}

export class UserAttributeDto {
  id: string;
  userId: string;
  organizationId: string;
  key: string;
  value: any;
  dataType: string;
  isPublic: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class BulkUserAttributeOperationDto {
  operation: 'create' | 'update' | 'delete';
  userIds: string[];
  attributes: Array<{
    key: string;
    value?: any;
    dataType?: string;
    isPublic?: boolean;
    description?: string;
  }>;
}

@ApiTags('User Attributes')
@Controller('users/:userId/attributes')
@UseGuards(JwtAuthGuard, AbacGuard)
@ApiBearerAuth()
@ValidateOrganization()
export class UserAttributesController {
  constructor(private readonly userAttributesService: UserAttributesService) {}

  @Post()
  @RequirePermission('user', 'write')
  @ApiOperation({
    summary: 'Create user attribute',
    description: 'Add a new attribute to a user within an organization',
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiBody({ type: CreateUserAttributeDto })
  @ApiResponse({
    status: 201,
    description: 'Attribute created successfully',
    type: UserAttributeDto,
  })
  @ApiResponse(ApiErrorResponses.BadRequest)
  @ApiResponse(ApiErrorResponses.Unauthorized)
  @ApiResponse(ApiErrorResponses.Forbidden)
  @ApiResponse(ApiErrorResponses.NotFound)
  async createAttribute(
    @Param('userId', ParseUUIDPipe) userId: string,
    @OrganizationId() organizationId: string,
    @Body() createAttributeDto: CreateUserAttributeDto,
  ): Promise<UserAttributeDto> {
    return this.userAttributesService.createAttribute(userId, organizationId, createAttributeDto);
  }

  @Get()
  @RequirePermission('user', 'read')
  @ApiOperation({
    summary: 'Get user attributes',
    description: 'Retrieve all attributes for a user within an organization',
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({
    name: 'includePrivate',
    required: false,
    type: Boolean,
    description: 'Include private attributes',
  })
  @ApiResponse({
    status: 200,
    description: 'User attributes retrieved successfully',
    type: [UserAttributeDto],
  })
  @ApiResponse(ApiErrorResponses.Unauthorized)
  @ApiResponse(ApiErrorResponses.Forbidden)
  @ApiResponse(ApiErrorResponses.NotFound)
  async getAttributes(
    @Param('userId', ParseUUIDPipe) userId: string,
    @OrganizationId() organizationId: string,
    @Query('includePrivate') includePrivate?: boolean,
  ): Promise<UserAttributeDto[]> {
    return this.userAttributesService.getAttributes(userId, organizationId, includePrivate);
  }

  @Get(':key')
  @RequirePermission('user', 'read')
  @ApiOperation({
    summary: 'Get specific user attribute',
    description: 'Retrieve a specific attribute by key for a user',
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiParam({ name: 'key', description: 'Attribute key' })
  @ApiResponse({
    status: 200,
    description: 'Attribute retrieved successfully',
    type: UserAttributeDto,
  })
  @ApiResponse(ApiErrorResponses.Unauthorized)
  @ApiResponse(ApiErrorResponses.Forbidden)
  @ApiResponse(ApiErrorResponses.NotFound)
  async getAttribute(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('key') key: string,
    @OrganizationId() organizationId: string,
  ): Promise<UserAttributeDto> {
    return this.userAttributesService.getAttribute(userId, organizationId, key);
  }

  @Put(':key')
  @RequirePermission('user', 'write')
  @ApiOperation({
    summary: 'Update user attribute',
    description: 'Update an existing attribute for a user',
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiParam({ name: 'key', description: 'Attribute key' })
  @ApiBody({ type: UpdateUserAttributeDto })
  @ApiResponse({
    status: 200,
    description: 'Attribute updated successfully',
    type: UserAttributeDto,
  })
  @ApiResponse(ApiErrorResponses.BadRequest)
  @ApiResponse(ApiErrorResponses.Unauthorized)
  @ApiResponse(ApiErrorResponses.Forbidden)
  @ApiResponse(ApiErrorResponses.NotFound)
  async updateAttribute(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('key') key: string,
    @OrganizationId() organizationId: string,
    @Body() updateAttributeDto: UpdateUserAttributeDto,
  ): Promise<UserAttributeDto> {
    return this.userAttributesService.updateAttribute(
      userId,
      organizationId,
      key,
      updateAttributeDto,
    );
  }

  @Delete(':key')
  @RequirePermission('user', 'write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete user attribute',
    description: 'Remove an attribute from a user',
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiParam({ name: 'key', description: 'Attribute key' })
  @ApiResponse({ status: 204, description: 'Attribute deleted successfully' })
  @ApiResponse(ApiErrorResponses.Unauthorized)
  @ApiResponse(ApiErrorResponses.Forbidden)
  @ApiResponse(ApiErrorResponses.NotFound)
  async deleteAttribute(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('key') key: string,
    @OrganizationId() organizationId: string,
  ): Promise<void> {
    return this.userAttributesService.deleteAttribute(userId, organizationId, key);
  }

  @Post('bulk')
  @RequirePermission('user', 'write')
  @ApiOperation({
    summary: 'Bulk user attribute operations',
    description: 'Perform bulk operations on user attributes across multiple users',
  })
  @ApiBody({ type: BulkUserAttributeOperationDto })
  @ApiResponse({
    status: 200,
    description: 'Bulk operation completed',
    schema: {
      type: 'object',
      properties: {
        successful: { type: 'number' },
        failed: { type: 'number' },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              userId: { type: 'string' },
              error: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @ApiResponse(ApiErrorResponses.BadRequest)
  @ApiResponse(ApiErrorResponses.Unauthorized)
  @ApiResponse(ApiErrorResponses.Forbidden)
  async bulkOperation(
    @OrganizationId() organizationId: string,
    @Body() operationDto: BulkUserAttributeOperationDto,
  ) {
    return this.userAttributesService.bulkOperation(organizationId, operationDto);
  }

  @Get('search/by-attribute')
  @RequirePermission('user', 'read')
  @ApiOperation({
    summary: 'Search users by attributes',
    description: 'Find users within an organization that have specific attribute values',
  })
  @ApiQuery({ name: 'key', description: 'Attribute key to search for' })
  @ApiQuery({ name: 'value', required: false, description: 'Attribute value to match' })
  @ApiQuery({
    name: 'operator',
    required: false,
    enum: ['equals', 'contains', 'greater_than', 'less_than'],
    description: 'Comparison operator',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiResponse({
    status: 200,
    description: 'Users found',
    schema: {
      type: 'object',
      properties: {
        users: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              firstName: { type: 'string' },
              lastName: { type: 'string' },
              attributes: { type: 'object' },
            },
          },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
      },
    },
  })
  @ApiResponse(ApiErrorResponses.BadRequest)
  @ApiResponse(ApiErrorResponses.Unauthorized)
  @ApiResponse(ApiErrorResponses.Forbidden)
  async searchUsersByAttribute(
    @OrganizationId() organizationId: string,
    @Query('key') key: string,
    @Query('value') value?: string,
    @Query('operator') operator: string = 'equals',
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.userAttributesService.searchUsersByAttribute(
      organizationId,
      key,
      value,
      operator as 'equals' | 'contains' | 'greater_than' | 'less_than',
      { page, limit },
    );
  }

  @Get('definitions/available')
  @RequirePermission('user', 'read')
  @ApiOperation({
    summary: 'Get available attribute definitions',
    description: 'Retrieve all available attribute definitions for the organization',
  })
  @ApiResponse({
    status: 200,
    description: 'Available attribute definitions',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          key: { type: 'string' },
          name: { type: 'string' },
          dataType: { type: 'string' },
          description: { type: 'string' },
          isRequired: { type: 'boolean' },
          defaultValue: { type: 'object' },
          validationRules: { type: 'object' },
        },
      },
    },
  })
  @ApiResponse(ApiErrorResponses.Unauthorized)
  @ApiResponse(ApiErrorResponses.Forbidden)
  async getAvailableDefinitions(@OrganizationId() organizationId: string) {
    return this.userAttributesService.getAvailableAttributeDefinitions(organizationId);
  }
}
