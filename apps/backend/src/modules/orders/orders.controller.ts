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
import { OrdersService } from './orders.service';
import {
  CreateOrderDto,
  UpdateOrderDto,
  CreateOrderItemDto,
  PaginationParams,
  OrderStatus,
  PaymentStatus,
} from '@saas-template/shared';
import { RequirePermission } from '../abac/decorators/require-permission.decorator';

@ApiTags('Orders')
@Controller('orders')
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @RequirePermission('order', 'create')
  @ApiOperation({ summary: 'Create a new order' })
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @Get()
  @RequirePermission('order', 'list')
  @ApiOperation({ summary: 'Get all orders for organization' })
  findAll(
    @Query('organizationId', ParseUUIDPipe) organizationId: string,
    @Query() params: PaginationParams & {
      status?: OrderStatus;
      customerId?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    return this.ordersService.findAll(organizationId, params);
  }

  @Get('summary')
  @RequirePermission('order', 'read')
  @ApiOperation({ summary: 'Get order summary statistics' })
  getSummary(
    @Query('organizationId', ParseUUIDPipe) organizationId: string,
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
  ) {
    return this.ordersService.getSummary(organizationId, startDate, endDate);
  }

  @Get(':id')
  @RequirePermission('order', 'read')
  @ApiOperation({ summary: 'Get order by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission('order', 'update')
  @ApiOperation({ summary: 'Update order' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Patch(':id/status')
  @RequirePermission('order', 'update')
  @ApiOperation({ summary: 'Update order status' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: OrderStatus,
  ) {
    return this.ordersService.updateStatus(id, status);
  }

  @Patch(':id/payment-status')
  @RequirePermission('order', 'update')
  @ApiOperation({ summary: 'Update order payment status' })
  updatePaymentStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('paymentStatus') paymentStatus: PaymentStatus,
  ) {
    return this.ordersService.updatePaymentStatus(id, paymentStatus);
  }

  @Post(':id/items')
  @RequirePermission('order', 'update')
  @ApiOperation({ summary: 'Add item to order' })
  addItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() item: CreateOrderItemDto,
  ) {
    return this.ordersService.addItem(id, item);
  }

  @Delete(':id/items/:itemId')
  @RequirePermission('order', 'update')
  @ApiOperation({ summary: 'Remove item from order' })
  removeItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return this.ordersService.removeItem(id, itemId);
  }

  @Post(':id/cancel')
  @RequirePermission('order', 'update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel order' })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason?: string,
  ) {
    return this.ordersService.cancel(id, reason);
  }
}