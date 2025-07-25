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
  UseInterceptors,
  Request,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiQuery
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import {
  CreateProductDto,
  UpdateProductDto,
  PaginationParams,
  ProductStatus,
} from '@saas-template/shared';
import { RequirePermission } from '../abac/decorators/require-permission.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CaslAbacGuard, CheckAbility } from '../abac/guards/casl-abac.guard';
import { 
  FieldAccessInterceptor, 
  UseFieldFiltering,
  FieldFilterService 
} from '../abac/interceptors/field-access.interceptor';

@ApiTags('Products')
@Controller('products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, CaslAbacGuard)
@UseInterceptors(FieldAccessInterceptor)
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly fieldFilterService: FieldFilterService,
  ) {}

  @Post()
  @RequirePermission('product', 'create')
  @ApiOperation({ summary: 'Create a new product' })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  @RequirePermission('product', 'list')
  @UseFieldFiltering('Product')
  @ApiOperation({ summary: 'Get all products for organization' })
  findAll(
    @Query('organizationId', ParseUUIDPipe) organizationId: string,
    @Query() params: PaginationParams & { 
      status?: ProductStatus; 
      category?: string;
      search?: string;
    },
  ) {
    // Response will be automatically filtered by FieldAccessInterceptor
    return this.productsService.findAll(organizationId, params);
  }

  @Get('low-stock')
  @RequirePermission('product', 'list')
  @ApiOperation({ summary: 'Get products with low stock' })
  getLowStock(@Query('organizationId', ParseUUIDPipe) organizationId: string) {
    return this.productsService.getLowStockProducts(organizationId);
  }

  @Get(':id')
  @RequirePermission('product', 'read')
  @UseFieldFiltering('Product')
  @ApiOperation({ summary: 'Get product by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    // Response will be automatically filtered by FieldAccessInterceptor
    return this.productsService.findOne(id);
  }

  @Get('sku/:sku')
  @RequirePermission('product', 'read')
  @ApiOperation({ summary: 'Get product by SKU' })
  findBySku(
    @Param('sku') sku: string,
    @Query('organizationId', ParseUUIDPipe) organizationId: string,
  ) {
    return this.productsService.findBySku(sku, organizationId);
  }

  @Patch(':id')
  @RequirePermission('product', 'update')
  @ApiOperation({ summary: 'Update product' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  @Post(':id/inventory')
  @RequirePermission('product', 'update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update product inventory' })
  updateInventory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { quantity: number; operation?: 'set' | 'add' | 'subtract' },
  ) {
    return this.productsService.updateInventory(
      id,
      body.quantity,
      body.operation || 'set',
    );
  }

  @Post(':id/inventory/reserve')
  @RequirePermission('product', 'update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reserve product inventory' })
  reserveInventory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('quantity') quantity: number,
  ) {
    return this.productsService.reserveInventory(id, quantity);
  }

  @Post(':id/inventory/release')
  @RequirePermission('product', 'update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Release reserved inventory' })
  releaseInventory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('quantity') quantity: number,
  ) {
    return this.productsService.releaseInventory(id, quantity);
  }

  @Delete(':id')
  @RequirePermission('product', 'delete')
  @ApiOperation({ summary: 'Discontinue product' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.remove(id);
  }

  @Post('bulk-status')
  @RequirePermission('product', 'update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk update product status' })
  async bulkUpdateStatus(
    @Body() body: {
      ids: string[];
      status: ProductStatus;
      organizationId: string;
    },
  ) {
    await this.productsService.bulkUpdateStatus(
      body.ids,
      body.status,
      body.organizationId,
    );
    return { message: 'Products updated successfully' };
  }

  @Get(':id/field-permissions')
  @RequirePermission('product', 'read')
  @ApiOperation({ 
    summary: 'Get field permissions for the current user',
    description: 'Returns the field-level permissions for a specific product, showing which fields the current user can read, write, or are denied access to'
  })
  @ApiParam({
    name: 'id',
    description: 'Product ID',
    type: 'string',
    format: 'uuid'
  })
  @ApiResponse({
    status: 200,
    description: 'Field permissions for the product',
    schema: {
      type: 'object',
      properties: {
        resourceType: { type: 'string', example: 'Product' },
        resourceId: { type: 'string', format: 'uuid' },
        permissions: {
          type: 'object',
          properties: {
            readable: { 
              type: 'array', 
              items: { type: 'string' },
              example: ['id', 'name', 'price', 'description'],
              description: 'Fields the user can read'
            },
            writable: { 
              type: 'array', 
              items: { type: 'string' },
              example: ['name', 'price', 'description'],
              description: 'Fields the user can modify'
            },
            denied: { 
              type: 'array', 
              items: { type: 'string' },
              example: ['costPrice', 'profitMargin'],
              description: 'Fields explicitly denied (overrides readable/writable)'
            }
          }
        },
        canDelete: { type: 'boolean', description: 'Whether user can delete this product' },
        canApprove: { type: 'boolean', description: 'Whether user can approve this product' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getFieldPermissions(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ) {
    // This endpoint shows what fields the user can read/write
    const product = await this.productsService.findOne(id);
    const ability = req.caslAbility;
    
    if (!ability) {
      return {
        resourceType: 'Product',
        resourceId: id,
        permissions: {
          readable: ['*'],
          writable: ['*'],
          denied: [],
        },
      };
    }

    const fieldPermissions = ability.fieldPermissions?.get('Product');
    
    return {
      resourceType: 'Product',
      resourceId: id,
      permissions: {
        readable: fieldPermissions?.readable || ['*'],
        writable: fieldPermissions?.writable || ['*'],
        denied: fieldPermissions?.denied || [],
      },
      canDelete: ability.can('delete', product),
      canApprove: ability.can('approve', product),
    };
  }

  @Get('test-field-permissions')
  @RequirePermission('product', 'read')
  @ApiOperation({ 
    summary: 'Test field permissions for a user',
    description: 'Tests and returns the field-level permissions for a specific user and resource type. This endpoint is useful for debugging and understanding what fields a user can access.'
  })
  @ApiQuery({
    name: 'userId',
    description: 'ID of the user to test permissions for',
    type: 'string',
    required: true
  })
  @ApiQuery({
    name: 'organizationId',
    description: 'Organization context for permission evaluation',
    type: 'string',
    required: true
  })
  @ApiQuery({
    name: 'resourceType',
    description: 'Type of resource to check permissions for',
    type: 'string',
    required: true,
    enum: ['Customer', 'Product', 'User', 'Order', 'Transaction'],
    example: 'Product'
  })
  @ApiQuery({
    name: 'action',
    description: 'Action to test (read or write)',
    type: 'string',
    required: true,
    enum: ['read', 'write'],
    example: 'read'
  })
  @ApiResponse({
    status: 200,
    description: 'Field permissions test results',
    schema: {
      type: 'object',
      properties: {
        allowed: { 
          type: 'boolean', 
          description: 'Whether the action is allowed' 
        },
        resourceType: { 
          type: 'string', 
          description: 'Resource type tested' 
        },
        action: { 
          type: 'string', 
          enum: ['read', 'write'],
          description: 'Action tested' 
        },
        readable: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Fields the user can read',
          example: ['id', 'name', 'email', 'phone', 'address']
        },
        writable: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Fields the user can modify',
          example: ['phone', 'email', 'address']
        },
        denied: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Fields explicitly denied to the user',
          example: ['ssn', 'dateOfBirth', 'creditScore']
        },
        fieldPermissions: {
          type: 'object',
          description: 'Complete field permissions object',
          properties: {
            readable: { type: 'array', items: { type: 'string' } },
            writable: { type: 'array', items: { type: 'string' } },
            denied: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  })
  async testFieldPermissions(
    @Query('userId', ParseUUIDPipe) userId: string,
    @Query('organizationId', ParseUUIDPipe) organizationId: string,
    @Query('resourceType') resourceType: string,
    @Query('action') action: 'read' | 'write',
    @Request() req,
  ) {
    // For now, return mock data based on the resource type
    // In a real implementation, this would evaluate the user's permissions
    const mockPermissions = {
      Customer: {
        readable: ['id', 'name', 'email', 'phone', 'address'],
        writable: ['phone', 'email', 'address'],
        denied: ['ssn', 'dateOfBirth', 'creditScore', 'income', 'internalNotes'],
      },
      Product: {
        readable: ['*'],
        writable: ['name', 'description', 'price', 'quantity'],
        denied: ['costPrice', 'profitMargin', 'supplierNotes'],
      },
      User: {
        readable: ['id', 'name', 'email', 'role', 'department'],
        writable: [],
        denied: ['password', 'mfaSecret', 'salary', 'performanceRating'],
      },
    };

    const permissions = mockPermissions[resourceType] || {
      readable: ['*'],
      writable: ['*'],
      denied: [],
    };

    return {
      allowed: true,
      resourceType,
      action,
      ...permissions,
      fieldPermissions: permissions,
    };
  }
}