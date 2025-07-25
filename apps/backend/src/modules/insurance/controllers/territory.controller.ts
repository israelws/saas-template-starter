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
  UseGuards,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { TerritoryService } from '../services/territory.service';
import {
  CreateTerritoryDto,
  UpdateTerritoryDto,
  PaginationParams,
} from '@saas-template/shared';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CaslAbacGuard } from '../../abac/guards/casl-abac.guard';
import { RequirePermission } from '../../abac/decorators/require-permission.decorator';

@ApiTags('Territories')
@Controller('territories')
@UseGuards(JwtAuthGuard, CaslAbacGuard)
@ApiBearerAuth()
export class TerritoryController {
  constructor(private readonly territoryService: TerritoryService) {}

  @Post()
  @RequirePermission('territory', 'create')
  @ApiOperation({ summary: 'Create a new territory' })
  @ApiResponse({ status: 201, description: 'Territory created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(@Body() createDto: CreateTerritoryDto) {
    return this.territoryService.create(createDto);
  }

  @Get()
  @RequirePermission('territory', 'list')
  @ApiOperation({ summary: 'Get all territories' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ 
    name: 'type', 
    required: false, 
    enum: ['zipcode', 'city', 'county', 'state', 'region'] 
  })
  @ApiQuery({ name: 'parentTerritoryId', required: false, type: String })
  findAll(
    @Query() params: PaginationParams,
    @Query('type') type?: 'zipcode' | 'city' | 'county' | 'state' | 'region',
    @Query('parentTerritoryId') parentTerritoryId?: string,
  ) {
    return this.territoryService.findAll(params, {
      type,
      parentTerritoryId,
    });
  }

  @Get('hierarchy')
  @RequirePermission('territory', 'list')
  @ApiOperation({ summary: 'Get territory hierarchy' })
  @ApiQuery({ name: 'rootId', required: false, type: String })
  getHierarchy(@Query('rootId') rootId?: string) {
    return this.territoryService.getHierarchy(rootId);
  }

  @Get(':id')
  @RequirePermission('territory', 'read')
  @ApiOperation({ summary: 'Get territory by ID' })
  @ApiParam({ name: 'id', type: String })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.territoryService.findOne(id);
  }

  @Get('code/:code')
  @RequirePermission('territory', 'read')
  @ApiOperation({ summary: 'Get territory by code' })
  @ApiParam({ name: 'code', type: String })
  findByCode(@Param('code') code: string) {
    return this.territoryService.findByCode(code);
  }

  @Patch(':id')
  @RequirePermission('territory', 'update')
  @ApiOperation({ summary: 'Update territory' })
  @ApiParam({ name: 'id', type: String })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateTerritoryDto,
  ) {
    return this.territoryService.update(id, updateDto);
  }

  @Delete(':id')
  @RequirePermission('territory', 'delete')
  @ApiOperation({ summary: 'Delete territory' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Territory deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete territory with children' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.territoryService.remove(id);
  }

  @Post('bulk')
  @RequirePermission('territory', 'list')
  @ApiOperation({ summary: 'Get territories by IDs' })
  @ApiResponse({ status: 200, description: 'Territories retrieved successfully' })
  findByIds(@Body('ids') ids: string[]) {
    return this.territoryService.findByIds(ids);
  }
}