import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { PaginationParams } from '@saas-template/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../../common/guards/organization-context.guard';

@ApiTags('Organizations')
@Controller('organizations')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new organization',
    description: 'Create a new organization with hierarchical support',
  })
  @ApiBody({ type: CreateOrganizationDto })
  @ApiResponse({
    status: 201,
    description: 'Organization created successfully',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Acme Corporation',
        code: 'ACME',
        type: 'company',
        status: 'active',
        parentId: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Organization code already exists' })
  create(@Body() createOrganizationDto: CreateOrganizationDto) {
    return this.organizationsService.create(createOrganizationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all root organizations' })
  findAll(@Query() params: PaginationParams) {
    return this.organizationsService.findAll(params);
  }

  @Get('hierarchy')
  @ApiOperation({ summary: 'Get organization hierarchy' })
  getHierarchy(@Query('rootId') rootId?: string) {
    return this.organizationsService.getHierarchy(rootId);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search organizations by name' })
  @ApiQuery({
    name: 'name',
    required: true,
    type: String,
    description: 'Organization name to search (min 3 chars)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum results to return (default: 10)',
  })
  async search(@Query('name') name: string, @Query('limit') limit?: number) {
    if (!name || name.length < 3) {
      throw new BadRequestException('Search query must be at least 3 characters long');
    }
    return this.organizationsService.searchByName(name, limit || 10);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizationsService.findOne(id);
  }

  @Get(':id/full-hierarchy')
  @ApiOperation({ summary: 'Get organization with full hierarchy' })
  findWithFullHierarchy(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizationsService.findWithFullHierarchy(id);
  }

  @Get(':id/ancestors')
  @ApiOperation({ summary: 'Get organization ancestors' })
  getAncestors(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizationsService.getAncestors(id);
  }

  @Get(':id/descendants')
  @ApiOperation({ summary: 'Get organization descendants' })
  getDescendants(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizationsService.getDescendants(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update organization' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(id, updateOrganizationDto);
  }

  @Post(':id/move')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Move organization to new parent' })
  move(@Param('id', ParseUUIDPipe) id: string, @Body('parentId') parentId: string | null) {
    return this.organizationsService.move(id, parentId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate organization' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizationsService.remove(id);
  }

  @Post('bulk/create')
  @ApiOperation({
    summary: 'Create multiple organizations',
    description: 'Bulk create organizations with transaction support',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        organizations: {
          type: 'array',
          items: { $ref: '#/components/schemas/CreateOrganizationDto' },
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Organizations created successfully' })
  @ApiResponse({ status: 400, description: 'Validation errors for one or more organizations' })
  bulkCreate(@Body('organizations') organizations: CreateOrganizationDto[]) {
    return this.organizationsService.bulkCreate(organizations);
  }

  @Patch('bulk/update')
  @ApiOperation({
    summary: 'Update multiple organizations',
    description: 'Bulk update organizations with transaction support',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        updates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              data: { $ref: '#/components/schemas/UpdateOrganizationDto' },
            },
            required: ['id', 'data'],
          },
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Organizations updated successfully' })
  bulkUpdate(@Body('updates') updates: Array<{ id: string; data: UpdateOrganizationDto }>) {
    return this.organizationsService.bulkUpdate(updates);
  }

  @Post('bulk/move')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Move multiple organizations',
    description: 'Bulk move organizations to new parents with validation',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        moves: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              organizationId: { type: 'string', format: 'uuid' },
              newParentId: { type: 'string', format: 'uuid', nullable: true },
            },
            required: ['organizationId'],
          },
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Organizations moved successfully' })
  bulkMove(@Body('moves') moves: Array<{ organizationId: string; newParentId: string | null }>) {
    return this.organizationsService.bulkMove(moves);
  }

  @Delete('bulk/archive')
  @ApiOperation({
    summary: 'Archive multiple organizations',
    description: 'Bulk archive organizations and handle children',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        organizationIds: {
          type: 'array',
          items: { type: 'string', format: 'uuid' },
        },
        archiveChildren: {
          type: 'boolean',
          default: false,
          description: 'Whether to also archive child organizations',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Organizations archived successfully' })
  bulkArchive(@Body() body: { organizationIds: string[]; archiveChildren?: boolean }) {
    return this.organizationsService.bulkArchive(body.organizationIds, body.archiveChildren);
  }

  @Post('bulk/activate')
  @ApiOperation({
    summary: 'Activate multiple organizations',
    description: 'Bulk activate archived organizations',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        organizationIds: {
          type: 'array',
          items: { type: 'string', format: 'uuid' },
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Organizations activated successfully' })
  bulkActivate(@Body('organizationIds') organizationIds: string[]) {
    return this.organizationsService.bulkActivate(organizationIds);
  }
}
