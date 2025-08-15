import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Post,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AbacGuard } from '../../abac/guards/abac.guard';
import { RequirePermission } from '../../abac/decorators/require-permission.decorator';
import { OrganizationHierarchyService } from '../services/organization-hierarchy.service';

@ApiTags('Organization Hierarchy')
@Controller('organizations/hierarchy')
@UseGuards(JwtAuthGuard, AbacGuard)
@ApiBearerAuth()
export class OrganizationHierarchyController {
  constructor(private readonly hierarchyService: OrganizationHierarchyService) {}

  @Post('refresh')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('organization', 'manage')
  @ApiOperation({ summary: 'Refresh organization hierarchy materialized view' })
  @ApiResponse({ status: 204, description: 'View refreshed successfully' })
  async refreshHierarchy(): Promise<void> {
    await this.hierarchyService.refreshHierarchyView();
  }

  @Get('roots')
  @RequirePermission('organization', 'read')
  @ApiOperation({ summary: 'Get all root organizations' })
  @ApiResponse({ status: 200, description: 'List of root organizations' })
  async getRootOrganizations() {
    return this.hierarchyService.getRootOrganizations();
  }

  @Get('depth/:depth')
  @RequirePermission('organization', 'read')
  @ApiOperation({ summary: 'Get organizations at specific depth level' })
  @ApiResponse({ status: 200, description: 'List of organizations at specified depth' })
  async getOrganizationsByDepth(@Param('depth') depth: string) {
    return this.hierarchyService.getOrganizationsByDepth(parseInt(depth));
  }

  @Get('search')
  @RequirePermission('organization', 'read')
  @ApiOperation({ summary: 'Search organizations in hierarchy' })
  @ApiQuery({ name: 'q', required: true, description: 'Search term' })
  @ApiQuery({ name: 'type', required: false, description: 'Organization type filter' })
  @ApiQuery({ name: 'status', required: false, description: 'Organization status filter' })
  @ApiQuery({ name: 'minDepth', required: false, type: Number })
  @ApiQuery({ name: 'maxDepth', required: false, type: Number })
  @ApiQuery({ name: 'rootId', required: false, description: 'Root organization ID filter' })
  @ApiResponse({ status: 200, description: 'Search results' })
  async searchHierarchy(
    @Query('q') searchTerm: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('minDepth') minDepth?: string,
    @Query('maxDepth') maxDepth?: string,
    @Query('rootId') rootId?: string,
  ) {
    return this.hierarchyService.searchHierarchy(searchTerm, {
      type,
      status,
      minDepth: minDepth ? parseInt(minDepth) : undefined,
      maxDepth: maxDepth ? parseInt(maxDepth) : undefined,
      rootId,
    });
  }

  @Get('stats')
  @RequirePermission('organization', 'read')
  @ApiOperation({ summary: 'Get bulk organization statistics' })
  @ApiQuery({ name: 'ids', required: true, description: 'Comma-separated organization IDs' })
  @ApiResponse({ status: 200, description: 'Organization statistics' })
  async getBulkStats(@Query('ids') ids: string) {
    const organizationIds = ids.split(',').filter((id) => id.trim());
    return this.hierarchyService.getBulkOrganizationStats(organizationIds);
  }

  @Get(':id')
  @RequirePermission('organization', 'read')
  @ApiOperation({ summary: 'Get complete hierarchy for an organization' })
  @ApiResponse({ status: 200, description: 'Organization hierarchy' })
  async getOrganizationHierarchy(@Param('id') id: string) {
    return this.hierarchyService.getOrganizationHierarchy(id);
  }

  @Get(':id/stats')
  @RequirePermission('organization', 'read')
  @ApiOperation({ summary: 'Get statistics for a specific organization' })
  @ApiResponse({ status: 200, description: 'Organization statistics' })
  async getOrganizationStats(@Param('id') id: string) {
    return this.hierarchyService.getOrganizationStats(id);
  }

  @Get(':id/path')
  @RequirePermission('organization', 'read')
  @ApiOperation({ summary: 'Get path from root to organization' })
  @ApiResponse({ status: 200, description: 'Organization path' })
  async getOrganizationPath(@Param('id') id: string) {
    return this.hierarchyService.getOrganizationPath(id);
  }

  @Get(':id/siblings')
  @RequirePermission('organization', 'read')
  @ApiOperation({ summary: 'Get sibling organizations' })
  @ApiResponse({ status: 200, description: 'Sibling organizations' })
  async getSiblingOrganizations(@Param('id') id: string) {
    return this.hierarchyService.getSiblingOrganizations(id);
  }
}
