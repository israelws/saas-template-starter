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
import { ProductsService } from './products.service';
import {
  CreateProductDto,
  UpdateProductDto,
  PaginationParams,
  ProductStatus,
} from '@saas-template/shared';
import { RequirePermission } from '../abac/decorators/require-permission.decorator';

@ApiTags('Products')
@Controller('products')
@ApiBearerAuth()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @RequirePermission('product', 'create')
  @ApiOperation({ summary: 'Create a new product' })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  @RequirePermission('product', 'list')
  @ApiOperation({ summary: 'Get all products for organization' })
  findAll(
    @Query('organizationId', ParseUUIDPipe) organizationId: string,
    @Query() params: PaginationParams & { 
      status?: ProductStatus; 
      category?: string;
      search?: string;
    },
  ) {
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
  @ApiOperation({ summary: 'Get product by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
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
}