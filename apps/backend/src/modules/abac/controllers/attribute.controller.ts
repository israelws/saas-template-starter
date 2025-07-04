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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AttributeService } from '../services/attribute.service';
import {
  AttributeCategory,
  AttributeType,
  PaginationParams,
} from '@saas-template/shared';
import { RequirePermission } from '../decorators/require-permission.decorator';

@ApiTags('Attributes')
@Controller('attributes')
@ApiBearerAuth()
export class AttributeController {
  constructor(private readonly attributeService: AttributeService) {}

  @Post()
  @RequirePermission('attribute', 'create')
  @ApiOperation({ summary: 'Create a new attribute definition' })
  create(
    @Body() body: {
      name: string;
      category: AttributeCategory;
      type: AttributeType;
      description?: string;
      organizationId?: string;
    },
  ) {
    return this.attributeService.create(
      body.name,
      body.category,
      body.type,
      body.description,
      body.organizationId,
    );
  }

  @Get()
  @RequirePermission('attribute', 'list')
  @ApiOperation({ summary: 'Get all attribute definitions' })
  findAll(
    @Query() params: PaginationParams & {
      category?: AttributeCategory;
      organizationId?: string;
    },
  ) {
    return this.attributeService.findAll(params);
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
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.attributeService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission('attribute', 'update')
  @ApiOperation({ summary: 'Update attribute definition' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updates: Partial<{
      description: string;
      possibleValues: any[];
      defaultValue: any;
      isRequired: boolean;
    }>,
  ) {
    return this.attributeService.update(id, updates);
  }

  @Delete(':id')
  @RequirePermission('attribute', 'delete')
  @ApiOperation({ summary: 'Delete attribute definition' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.attributeService.remove(id);
  }

  @Post('seed-system')
  @RequirePermission('attribute', 'manage')
  @ApiOperation({ summary: 'Seed system attributes' })
  async seedSystemAttributes() {
    await this.attributeService.seedSystemAttributes();
    return { message: 'System attributes seeded successfully' };
  }
}