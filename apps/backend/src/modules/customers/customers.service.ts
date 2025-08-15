import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Customer } from './entities/customer.entity';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  PaginationParams,
  PaginatedResponse,
  CustomerStatus,
  CustomerType,
} from '@saas-template/shared';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    // Validate required fields based on customer type
    if (createCustomerDto.type === CustomerType.INDIVIDUAL) {
      if (!createCustomerDto.firstName || !createCustomerDto.lastName) {
        throw new BadRequestException(
          'First name and last name are required for individual customers',
        );
      }
    } else if (createCustomerDto.type === CustomerType.BUSINESS) {
      if (!createCustomerDto.companyName) {
        throw new BadRequestException('Company name is required for business customers');
      }
    }

    // Check if email already exists for this organization
    const existing = await this.customerRepository.findOne({
      where: {
        email: createCustomerDto.email,
        organizationId: createCustomerDto.organizationId,
      },
    });

    if (existing) {
      throw new BadRequestException('Customer with this email already exists');
    }

    const customer = this.customerRepository.create({
      ...createCustomerDto,
      status: CustomerStatus.ACTIVE,
      balance: 0,
      currency: createCustomerDto.currency || 'USD',
    });

    // Set default preferences if not provided
    if (!customer.preferences) {
      customer.preferences = {
        communicationChannel: 'email',
        language: 'en',
        invoiceDelivery: 'email',
      };
    }

    return this.customerRepository.save(customer);
  }

  async findAll(
    organizationId: string,
    params: PaginationParams & {
      type?: CustomerType;
      status?: CustomerStatus;
      search?: string;
    },
  ): Promise<PaginatedResponse<Customer>> {
    const { page, limit, sortBy = 'createdAt', sortOrder = 'DESC', type, status, search } = params;

    // Ensure page and limit are numbers
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    const query = this.customerRepository.createQueryBuilder('customer');

    query.where('customer.organizationId = :organizationId', { organizationId });

    if (type) {
      query.andWhere('customer.type = :type', { type });
    }

    if (status) {
      query.andWhere('customer.status = :status', { status });
    }

    if (search) {
      query.andWhere(
        `(
          customer.email ILIKE :search OR
          customer.firstName ILIKE :search OR
          customer.lastName ILIKE :search OR
          customer.companyName ILIKE :search OR
          customer.taxId ILIKE :search
        )`,
        { search: `%${search}%` },
      );
    }

    query
      .orderBy(`customer.${sortBy}`, sortOrder)
      .skip((pageNum - 1) * limitNum)
      .take(limitNum);

    const [customers, total] = await query.getManyAndCount();

    return {
      data: customers,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id },
      relations: ['organization', 'orders'],
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async findByEmail(email: string, organizationId: string): Promise<Customer | null> {
    return this.customerRepository.findOne({
      where: { email, organizationId },
    });
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findOne(id);

    // If updating email, check for duplicates
    if (updateCustomerDto.email && updateCustomerDto.email !== customer.email) {
      const existing = await this.findByEmail(updateCustomerDto.email, customer.organizationId);

      if (existing) {
        throw new BadRequestException('Customer with this email already exists');
      }
    }

    Object.assign(customer, updateCustomerDto);
    customer.updatedAt = new Date();

    return this.customerRepository.save(customer);
  }

  async updateBalance(
    id: string,
    amount: number,
    operation: 'set' | 'add' | 'subtract' = 'add',
  ): Promise<Customer> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const customer = await queryRunner.manager.findOne(Customer, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!customer) {
        throw new NotFoundException('Customer not found');
      }

      switch (operation) {
        case 'add':
          customer.balance += amount;
          break;
        case 'subtract':
          if (customer.balance < amount) {
            throw new BadRequestException('Insufficient balance');
          }
          customer.balance -= amount;
          break;
        default:
          customer.balance = amount;
      }

      const updated = await queryRunner.manager.save(customer);
      await queryRunner.commitTransaction();

      return updated;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async checkCreditLimit(id: string, amount: number): Promise<boolean> {
    const customer = await this.findOne(id);

    if (!customer.creditLimit) {
      return true; // No credit limit set
    }

    const totalOwed = customer.balance;
    return totalOwed + amount <= customer.creditLimit;
  }

  async remove(id: string): Promise<void> {
    const customer = await this.findOne(id);

    // Check if customer has active orders
    const activeOrdersCount = await this.customerRepository
      .createQueryBuilder('customer')
      .leftJoin('customer.orders', 'order')
      .where('customer.id = :id', { id })
      .andWhere('order.status NOT IN (:...statuses)', {
        statuses: ['delivered', 'cancelled', 'refunded'],
      })
      .getCount();

    if (activeOrdersCount > 0) {
      throw new BadRequestException('Cannot delete customer with active orders');
    }

    // Soft delete by setting status to inactive
    customer.status = CustomerStatus.INACTIVE;
    await this.customerRepository.save(customer);
  }

  async getTopCustomers(
    organizationId: string,
    limit: number = 10,
  ): Promise<Array<Customer & { totalSpent: number }>> {
    const customers = await this.customerRepository
      .createQueryBuilder('customer')
      .leftJoin('customer.orders', 'order')
      .select('customer.*')
      .addSelect('COALESCE(SUM(order.total), 0)', 'totalSpent')
      .where('customer.organizationId = :organizationId', { organizationId })
      .andWhere('customer.status = :status', { status: CustomerStatus.ACTIVE })
      .groupBy('customer.id')
      .orderBy('totalSpent', 'DESC')
      .limit(limit)
      .getRawMany();

    return customers.map((c) => ({
      ...c,
      totalSpent: parseFloat(c.totalSpent),
    }));
  }

  async getCustomersWithCreditIssues(organizationId: string): Promise<Customer[]> {
    return this.customerRepository
      .createQueryBuilder('customer')
      .where('customer.organizationId = :organizationId', { organizationId })
      .andWhere('customer.status = :status', { status: CustomerStatus.ACTIVE })
      .andWhere('customer.creditLimit IS NOT NULL')
      .andWhere('customer.balance > customer.creditLimit')
      .getMany();
  }

  async mergeDuplicates(primaryId: string, duplicateIds: string[]): Promise<Customer> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const primary = await queryRunner.manager.findOne(Customer, {
        where: { id: primaryId },
      });

      if (!primary) {
        throw new NotFoundException('Primary customer not found');
      }

      // Update all orders, transactions to point to primary customer
      await queryRunner.manager
        .createQueryBuilder()
        .update('orders')
        .set({ customerId: primaryId })
        .where('customerId IN (:...ids)', { ids: duplicateIds })
        .execute();

      await queryRunner.manager
        .createQueryBuilder()
        .update('transactions')
        .set({ customerId: primaryId })
        .where('customerId IN (:...ids)', { ids: duplicateIds })
        .execute();

      // Deactivate duplicate customers
      await queryRunner.manager
        .createQueryBuilder()
        .update(Customer)
        .set({ status: CustomerStatus.INACTIVE, updatedAt: new Date() })
        .where('id IN (:...ids)', { ids: duplicateIds })
        .execute();

      await queryRunner.commitTransaction();

      return primary;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
