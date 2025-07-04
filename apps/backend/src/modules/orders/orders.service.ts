import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { ProductsService } from '../products/products.service';
import { CustomersService } from '../customers/customers.service';
import {
  CreateOrderDto,
  UpdateOrderDto,
  CreateOrderItemDto,
  PaginationParams,
  PaginatedResponse,
  OrderStatus,
  PaymentStatus,
  OrderSummary,
} from '@saas-template/shared';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    private readonly productsService: ProductsService,
    private readonly customersService: CustomersService,
    private readonly dataSource: DataSource,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validate customer
      const customer = await this.customersService.findOne(createOrderDto.customerId);
      if (customer.organizationId !== createOrderDto.organizationId) {
        throw new BadRequestException('Customer does not belong to this organization');
      }

      // Generate unique order number
      const orderNumber = await this.generateOrderNumber();

      // Create order
      const order = queryRunner.manager.create(Order, {
        ...createOrderDto,
        orderNumber,
        status: OrderStatus.DRAFT,
        paymentStatus: PaymentStatus.PENDING,
        orderDate: new Date(),
        currency: customer.currency,
        subtotal: 0,
        tax: 0,
        shipping: 0,
        discount: 0,
        total: 0,
      });

      const savedOrder = await queryRunner.manager.save(order);

      // Create order items and calculate totals
      let subtotal = 0;
      const orderItems: OrderItem[] = [];

      for (const itemDto of createOrderDto.items) {
        const product = await this.productsService.findOne(itemDto.productId);
        
        if (product.organizationId !== createOrderDto.organizationId) {
          throw new BadRequestException(`Product ${product.sku} does not belong to this organization`);
        }

        // Reserve inventory
        await this.productsService.reserveInventory(product.id, itemDto.quantity);

        const unitPrice = itemDto.unitPrice ?? product.price;
        const itemTotal = unitPrice * itemDto.quantity - (itemDto.discount || 0);

        const orderItem = queryRunner.manager.create(OrderItem, {
          orderId: savedOrder.id,
          productId: product.id,
          quantity: itemDto.quantity,
          unitPrice,
          discount: itemDto.discount || 0,
          tax: 0, // Calculate based on tax rules
          total: itemTotal,
          notes: itemDto.notes,
        });

        orderItems.push(orderItem);
        subtotal += itemTotal;
      }

      await queryRunner.manager.save(orderItems);

      // Update order totals
      savedOrder.subtotal = subtotal;
      savedOrder.total = subtotal + savedOrder.tax + savedOrder.shipping - savedOrder.discount;
      
      const finalOrder = await queryRunner.manager.save(savedOrder);
      
      await queryRunner.commitTransaction();
      
      return this.findOne(finalOrder.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(
    organizationId: string,
    params: PaginationParams & {
      status?: OrderStatus;
      customerId?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<PaginatedResponse<Order>> {
    const {
      page,
      limit,
      sortBy = 'orderDate',
      sortOrder = 'DESC',
      status,
      customerId,
      startDate,
      endDate,
    } = params;

    const query = this.orderRepository.createQueryBuilder('order');
    
    query
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.items', 'items')
      .where('order.organizationId = :organizationId', { organizationId });

    if (status) {
      query.andWhere('order.status = :status', { status });
    }

    if (customerId) {
      query.andWhere('order.customerId = :customerId', { customerId });
    }

    if (startDate) {
      query.andWhere('order.orderDate >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('order.orderDate <= :endDate', { endDate });
    }

    query
      .orderBy(`order.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const [orders, total] = await query.getManyAndCount();

    return {
      data: orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['customer', 'items', 'items.product', 'transactions'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);

    // Don't allow certain updates based on status
    if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cannot update delivered or cancelled orders');
    }

    Object.assign(order, updateOrderDto);
    order.updatedAt = new Date();

    return this.orderRepository.save(order);
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = await queryRunner.manager.findOne(Order, {
        where: { id },
        relations: ['items'],
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      const previousStatus = order.status;
      order.status = status;

      // Handle inventory based on status change
      if (status === OrderStatus.CANCELLED && previousStatus !== OrderStatus.CANCELLED) {
        // Release reserved inventory
        for (const item of order.items) {
          await this.productsService.releaseInventory(item.productId, item.quantity);
        }
      } else if (status === OrderStatus.DELIVERED && previousStatus !== OrderStatus.DELIVERED) {
        // Convert reserved to sold
        for (const item of order.items) {
          await this.productsService.releaseInventory(item.productId, item.quantity);
          await this.productsService.updateInventory(item.productId, item.quantity, 'subtract');
        }
      }

      const updated = await queryRunner.manager.save(order);
      await queryRunner.commitTransaction();
      
      return updated;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updatePaymentStatus(id: string, paymentStatus: PaymentStatus): Promise<Order> {
    const order = await this.findOne(id);
    order.paymentStatus = paymentStatus;
    return this.orderRepository.save(order);
  }

  async addItem(orderId: string, item: CreateOrderItemDto): Promise<Order> {
    const order = await this.findOne(orderId);

    if (order.status !== OrderStatus.DRAFT && order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Cannot add items to processed orders');
    }

    const product = await this.productsService.findOne(item.productId);
    await this.productsService.reserveInventory(product.id, item.quantity);

    const unitPrice = item.unitPrice ?? product.price;
    const itemTotal = unitPrice * item.quantity - (item.discount || 0);

    const orderItem = this.orderItemRepository.create({
      orderId,
      productId: product.id,
      quantity: item.quantity,
      unitPrice,
      discount: item.discount || 0,
      tax: 0,
      total: itemTotal,
      notes: item.notes,
    });

    await this.orderItemRepository.save(orderItem);

    // Update order totals
    order.subtotal += itemTotal;
    order.total = order.subtotal + order.tax + order.shipping - order.discount;
    
    return this.orderRepository.save(order);
  }

  async removeItem(orderId: string, itemId: string): Promise<Order> {
    const order = await this.findOne(orderId);

    if (order.status !== OrderStatus.DRAFT && order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Cannot remove items from processed orders');
    }

    const item = await this.orderItemRepository.findOne({
      where: { id: itemId, orderId },
    });

    if (!item) {
      throw new NotFoundException('Order item not found');
    }

    // Release reserved inventory
    await this.productsService.releaseInventory(item.productId, item.quantity);

    // Update order totals
    order.subtotal -= item.total;
    order.total = order.subtotal + order.tax + order.shipping - order.discount;

    await this.orderItemRepository.remove(item);
    
    return this.orderRepository.save(order);
  }

  async cancel(id: string, reason?: string): Promise<Order> {
    const order = await this.updateStatus(id, OrderStatus.CANCELLED);
    
    if (reason) {
      order.notes = `${order.notes || ''}\nCancellation reason: ${reason}`;
      await this.orderRepository.save(order);
    }

    return order;
  }

  async getSummary(
    organizationId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<OrderSummary> {
    const query = this.orderRepository.createQueryBuilder('order');
    
    query.where('order.organizationId = :organizationId', { organizationId });

    if (startDate) {
      query.andWhere('order.orderDate >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('order.orderDate <= :endDate', { endDate });
    }

    // Get total orders and revenue
    const totals = await query
      .select('COUNT(*)', 'totalOrders')
      .addSelect('COALESCE(SUM(order.total), 0)', 'totalRevenue')
      .getRawOne();

    // Get orders by status
    const statusBreakdown = await query
      .select('order.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('order.status')
      .getRawMany();

    const ordersByStatus = statusBreakdown.reduce((acc, curr) => {
      acc[curr.status] = parseInt(curr.count);
      return acc;
    }, {} as Record<OrderStatus, number>);

    // Get top products
    const topProducts = await this.orderItemRepository
      .createQueryBuilder('item')
      .leftJoin('item.order', 'order')
      .leftJoin('item.product', 'product')
      .where('order.organizationId = :organizationId', { organizationId })
      .select('item.productId', 'productId')
      .addSelect('product.name', 'productName')
      .addSelect('SUM(item.quantity)', 'quantity')
      .addSelect('SUM(item.total)', 'revenue')
      .groupBy('item.productId')
      .addGroupBy('product.name')
      .orderBy('revenue', 'DESC')
      .limit(5)
      .getRawMany();

    return {
      totalOrders: parseInt(totals.totalOrders),
      totalRevenue: parseFloat(totals.totalRevenue),
      averageOrderValue: parseFloat(totals.totalRevenue) / parseInt(totals.totalOrders) || 0,
      ordersByStatus,
      topProducts: topProducts.map(p => ({
        productId: p.productId,
        productName: p.productName,
        quantity: parseInt(p.quantity),
        revenue: parseFloat(p.revenue),
      })),
    };
  }

  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    const count = await this.orderRepository
      .createQueryBuilder('order')
      .where("order.orderNumber LIKE :pattern", { pattern: `ORD-${year}${month}${day}%` })
      .getCount();

    const sequence = String(count + 1).padStart(4, '0');
    
    return `ORD-${year}${month}${day}-${sequence}`;
  }
}