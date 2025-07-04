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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  PaginationParams,
} from '@saas-template/shared';

@ApiTags('Organizations')
@Controller('organizations')
@ApiBearerAuth()
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new organization' })
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
  move(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('parentId') parentId: string | null,
  ) {
    return this.organizationsService.move(id, parentId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate organization' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizationsService.remove(id);
  }
}