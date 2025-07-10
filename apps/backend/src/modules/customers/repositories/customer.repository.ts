import { Injectable } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Customer } from '../entities/customer.entity';

@Injectable()
export class CustomerRepository extends Repository<Customer> {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {
    super(Customer, dataSource.createEntityManager());
  }

  async findByOrganization(
    organizationId: string,
    includeDescendants = false,
  ): Promise<Customer[]> {
    if (!includeDescendants) {
      return this.find({
        where: { organizationId },
        relations: ['orders'],
        order: { createdAt: 'DESC' },
      });
    }

    const queryBuilder = this.createQueryBuilder('customer')
      .leftJoinAndSelect('customer.orders', 'orders')
      .innerJoin(
        'organizations_closure',
        'closure',
        'closure.descendantId = customer.organizationId',
      )
      .where('closure.ancestorId = :organizationId', { organizationId })
      .orderBy('customer.createdAt', 'DESC');

    return queryBuilder.getMany();
  }

  async findByEmail(email: string, organizationId?: string): Promise<Customer | null> {
    const whereClause: any = { email };
    if (organizationId) {
      whereClause.organizationId = organizationId;
    }

    return this.findOne({
      where: whereClause,
      relations: ['orders'],
    });
  }

  async searchCustomers(
    searchTerm: string,
    filters?: {
      organizationId?: string;
      status?: string;
      minBalance?: number;
      maxBalance?: number;
      hasOrders?: boolean;
    },
  ): Promise<Customer[]> {
    const queryBuilder = this.createQueryBuilder('customer')
      .leftJoinAndSelect('customer.orders', 'orders');

    if (searchTerm) {
      queryBuilder.where(
        '(customer.name ILIKE :search OR customer.email ILIKE :search OR customer.phone ILIKE :search)',
        { search: `%${searchTerm}%` },
      );
    }

    if (filters?.organizationId) {
      queryBuilder.andWhere('customer.organizationId = :organizationId', {
        organizationId: filters.organizationId,
      });
    }

    if (filters?.status) {
      queryBuilder.andWhere('customer.status = :status', {
        status: filters.status,
      });
    }

    if (filters?.minBalance !== undefined) {
      queryBuilder.andWhere('customer.balance >= :minBalance', {
        minBalance: filters.minBalance,
      });
    }

    if (filters?.maxBalance !== undefined) {
      queryBuilder.andWhere('customer.balance <= :maxBalance', {
        maxBalance: filters.maxBalance,
      });
    }

    if (filters?.hasOrders !== undefined) {
      if (filters.hasOrders) {
        queryBuilder.andWhere('orders.id IS NOT NULL');
      } else {
        queryBuilder.andWhere('orders.id IS NULL');
      }
    }

    return queryBuilder
      .distinct(true)
      .orderBy('customer.name', 'ASC')
      .getMany();
  }

  async updateBalance(
    customerId: string,
    amount: number,
    operation: 'add' | 'subtract' | 'set',
  ): Promise<Customer> {
    const customer = await this.findOne({ where: { id: customerId } });
    if (!customer) {
      throw new Error('Customer not found');
    }

    switch (operation) {
      case 'add':
        customer.balance += amount;
        break;
      case 'subtract':
        customer.balance = Math.max(0, customer.balance - amount);
        break;
      case 'set':
        customer.balance = Math.max(0, amount);
        break;
    }

    return this.save(customer);
  }

  async getCustomerStats(organizationId?: string): Promise<{
    totalCustomers: number;
    activeCustomers: number;
    totalBalance: number;
    avgBalance: number;
    customersWithOrders: number;
    customersByStatus: Record<string, number>;
  }> {
    let queryBuilder = this.createQueryBuilder('customer');

    if (organizationId) {
      queryBuilder = queryBuilder
        .innerJoin(
          'organizations_closure',
          'closure',
          'closure.descendantId = customer.organizationId',
        )
        .where('closure.ancestorId = :organizationId', { organizationId });
    }

    const customers = await queryBuilder
      .leftJoinAndSelect('customer.orders', 'orders')
      .getMany();

    const stats = {
      totalCustomers: customers.length,
      activeCustomers: customers.filter(c => c.status === 'active').length,
      totalBalance: customers.reduce((sum, c) => sum + c.balance, 0),
      avgBalance: customers.length > 0
        ? customers.reduce((sum, c) => sum + c.balance, 0) / customers.length
        : 0,
      customersWithOrders: customers.filter(c => c.orders && c.orders.length > 0).length,
      customersByStatus: {} as Record<string, number>,
    };

    customers.forEach(customer => {
      stats.customersByStatus[customer.status] =
        (stats.customersByStatus[customer.status] || 0) + 1;
    });

    return stats;
  }

  async findTopCustomers(
    limit: number,
    organizationId?: string,
    sortBy: 'balance' | 'orderCount' | 'totalSpent' = 'balance',
  ): Promise<Customer[]> {
    const queryBuilder = this.createQueryBuilder('customer')
      .leftJoinAndSelect('customer.orders', 'orders')
      .leftJoin('orders.items', 'orderItems');

    if (organizationId) {
      queryBuilder
        .innerJoin(
          'organizations_closure',
          'closure',
          'closure.descendantId = customer.organizationId',
        )
        .where('closure.ancestorId = :organizationId', { organizationId });
    }

    switch (sortBy) {
      case 'balance':
        queryBuilder.orderBy('customer.balance', 'DESC');
        break;
      case 'orderCount':
        queryBuilder
          .addSelect('COUNT(DISTINCT orders.id)', 'orderCount')
          .groupBy('customer.id')
          .orderBy('orderCount', 'DESC');
        break;
      case 'totalSpent':
        queryBuilder
          .addSelect('SUM(orderItems.quantity * orderItems.unitPrice)', 'totalSpent')
          .groupBy('customer.id')
          .orderBy('totalSpent', 'DESC');
        break;
    }

    return queryBuilder.limit(limit).getMany();
  }

  async mergeCustomers(
    primaryCustomerId: string,
    secondaryCustomerId: string,
  ): Promise<Customer> {
    const primaryCustomer = await this.findOne({
      where: { id: primaryCustomerId },
      relations: ['orders'],
    });
    const secondaryCustomer = await this.findOne({
      where: { id: secondaryCustomerId },
      relations: ['orders'],
    });

    if (!primaryCustomer || !secondaryCustomer) {
      throw new Error('One or both customers not found');
    }

    // Update orders to point to primary customer
    await this.dataSource
      .createQueryBuilder()
      .update('orders')
      .set({ customerId: primaryCustomerId })
      .where('customerId = :secondaryCustomerId', { secondaryCustomerId })
      .execute();

    // Merge balance
    primaryCustomer.balance += secondaryCustomer.balance;

    // Merge metadata
    primaryCustomer.metadata = {
      ...secondaryCustomer.metadata,
      ...primaryCustomer.metadata,
      mergedFrom: secondaryCustomerId,
      mergedAt: new Date().toISOString(),
    };

    // Save primary customer and delete secondary
    await this.save(primaryCustomer);
    await this.delete(secondaryCustomerId);

    return primaryCustomer;
  }

  async findInactiveCustomers(
    daysSinceLastOrder: number,
    organizationId?: string,
  ): Promise<Customer[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysSinceLastOrder);

    const queryBuilder = this.createQueryBuilder('customer')
      .leftJoin('customer.orders', 'orders')
      .where('customer.status = :status', { status: 'active' })
      .groupBy('customer.id')
      .having('MAX(orders.createdAt) < :cutoffDate OR COUNT(orders.id) = 0', {
        cutoffDate,
      });

    if (organizationId) {
      queryBuilder.andWhere('customer.organizationId = :organizationId', {
        organizationId,
      });
    }

    return queryBuilder.getMany();
  }
}