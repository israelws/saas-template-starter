import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { AttributeService } from '../services/attribute.service';
import { CreateAttributeDto } from '../dto/create-attribute.dto';
import { UpdateAttributeDto } from '../dto/update-attribute.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  AttributeCategory,
  AttributeType,
  PaginationParams,
} from '@saas-template/shared';
import { RequirePermission } from '../decorators/require-permission.decorator';

@ApiTags('Attributes')
@Controller('abac/attributes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AttributeController {
  constructor(private readonly attributeService: AttributeService) {}

  @Post()
  @RequirePermission('attribute', 'create')
  @ApiOperation({ summary: 'Create a new attribute definition' })
  @ApiResponse({
    status: 201,
    description: 'The attribute has been successfully created.',
  })
  async create(@Body() createAttributeDto: CreateAttributeDto) {
    return this.attributeService.create(createAttributeDto);
  }

  @Get()
  @RequirePermission('attribute', 'list')
  @ApiOperation({ summary: 'Get all attribute definitions' })
  @ApiQuery({ name: 'category', required: false, enum: ['subject', 'resource', 'environment', 'custom'] })
  @ApiQuery({ name: 'type', required: false, enum: ['string', 'number', 'boolean', 'array', 'object'] })
  @ApiQuery({ name: 'search', required: false, description: 'Search by key or name' })
  @ApiResponse({
    status: 200,
    description: 'Return all attribute definitions.',
  })
  async findAll(
    @Query('category') category?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
  ) {
    const attributes = await this.attributeService.findAll({
      category,
      type,
      search,
    });
    
    return {
      data: attributes,
      total: attributes.length,
    };
  }

  @Get('by-category/:category')
  @RequirePermission('attribute', 'list')
  @ApiOperation({ summary: 'Get attributes by category' })
  findByCategory(
    @Param('category') category: AttributeCategory,
    @Query('organizationId') organizationId?: string,
  ) {
    return this.attributeService.findByCategory(category, organizationId);
  }

  @Get('context')
  @RequirePermission('attribute', 'list')
  @ApiOperation({ summary: 'Get attributes grouped by context' })
  getAttributesByContext(@Query('organizationId', ParseUUIDPipe) organizationId: string) {
    return this.attributeService.getAttributesByContext(organizationId);
  }

  @Get(':id')
  @RequirePermission('attribute', 'read')
  @ApiOperation({ summary: 'Get attribute by ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the attribute definition.',
  })
  async findOne(@Param('id') id: string) {
    const attribute = await this.attributeService.findOne(id);
    return { data: attribute };
  }

  @Put(':id')
  @RequirePermission('attribute', 'update')
  @ApiOperation({ summary: 'Update attribute definition' })
  @ApiResponse({
    status: 200,
    description: 'The attribute has been successfully updated.',
  })
  async update(
    @Param('id') id: string,
    @Body() updateAttributeDto: UpdateAttributeDto,
  ) {
    return this.attributeService.update(id, updateAttributeDto);
  }

  @Delete(':id')
  @RequirePermission('attribute', 'delete')
  @ApiOperation({ summary: 'Delete attribute definition' })
  @ApiResponse({
    status: 204,
    description: 'The attribute has been successfully deleted.',
  })
  async remove(@Param('id') id: string) {
    await this.attributeService.remove(id);
  }

  @Post('seed-system')
  @RequirePermission('attribute', 'manage')
  @ApiOperation({ summary: 'Seed system attributes' })
  async seedSystemAttributes() {
    await this.attributeService.seedSystemAttributes();
    return { message: 'System attributes seeded successfully' };
  }
}