import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { OrdersService } from '../orders/orders.service';
import { CustomersService } from '../customers/customers.service';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  PaginationParams,
  PaginatedResponse,
  TransactionType,
  TransactionStatus,
  PaymentMethod,
  PaymentStatus,
  TransactionSummary,
} from '@saas-template/shared';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly ordersService: OrdersService,
    private readonly customersService: CustomersService,
    private readonly dataSource: DataSource,
  ) {}

  async create(createTransactionDto: CreateTransactionDto): Promise<Transaction> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validate customer
      const customer = await this.customersService.findOne(createTransactionDto.customerId);
      if (customer.organizationId !== createTransactionDto.organizationId) {
        throw new BadRequestException('Customer does not belong to this organization');
      }

      // Validate order if provided
      if (createTransactionDto.orderId) {
        const order = await this.ordersService.findOne(createTransactionDto.orderId);
        if (order.customerId !== createTransactionDto.customerId) {
          throw new BadRequestException('Order does not belong to this customer');
        }
      }

      // Generate reference number
      const referenceNumber = createTransactionDto.referenceNumber || 
        await this.generateReferenceNumber(createTransactionDto.type);

      const transaction = queryRunner.manager.create(Transaction, {
        ...createTransactionDto,
        referenceNumber,
        status: TransactionStatus.PENDING,
        currency: createTransactionDto.currency || customer.currency,
      });

      const savedTransaction = await queryRunner.manager.save(transaction);

      // Update customer balance based on transaction type
      if (createTransactionDto.type === TransactionType.PAYMENT) {
        await this.customersService.updateBalance(
          customer.id,
          createTransactionDto.amount,
          'subtract',
        );
      } else if (createTransactionDto.type === TransactionType.REFUND) {
        await this.customersService.updateBalance(
          customer.id,
          createTransactionDto.amount,
          'add',
        );
      }

      // Update order payment status if applicable
      if (createTransactionDto.orderId && createTransactionDto.type === TransactionType.PAYMENT) {
        const order = await this.ordersService.findOne(createTransactionDto.orderId);
        const totalPaid = await this.getTotalPaidForOrder(createTransactionDto.orderId);
        
        if (totalPaid >= order.total) {
          await this.ordersService.updatePaymentStatus(order.id, PaymentStatus.PAID);
        } else if (totalPaid > 0) {
          await this.ordersService.updatePaymentStatus(order.id, PaymentStatus.PARTIAL);
        }
      }

      await queryRunner.commitTransaction();
      
      return this.findOne(savedTransaction.id);
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
      type?: TransactionType;
      status?: TransactionStatus;
      customerId?: string;
      orderId?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<PaginatedResponse<Transaction>> {
    const {
      page,
      limit,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      type,
      status,
      customerId,
      orderId,
      startDate,
      endDate,
    } = params;

    // Ensure page and limit are numbers
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    const query = this.transactionRepository.createQueryBuilder('transaction');
    
    query
      .leftJoinAndSelect('transaction.customer', 'customer')
      .leftJoinAndSelect('transaction.order', 'order')
      .where('transaction.organizationId = :organizationId', { organizationId });

    if (type) {
      query.andWhere('transaction.type = :type', { type });
    }

    if (status) {
      query.andWhere('transaction.status = :status', { status });
    }

    if (customerId) {
      query.andWhere('transaction.customerId = :customerId', { customerId });
    }

    if (orderId) {
      query.andWhere('transaction.orderId = :orderId', { orderId });
    }

    if (startDate && endDate) {
      query.andWhere('transaction.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    query
      .orderBy(`transaction.${sortBy}`, sortOrder)
      .skip((pageNum - 1) * limitNum)
      .take(limitNum);

    const [transactions, total] = await query.getManyAndCount();

    return {
      data: transactions,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  async findOne(id: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['customer', 'order'],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  async update(id: string, updateTransactionDto: UpdateTransactionDto): Promise<Transaction> {
    const transaction = await this.findOne(id);

    // Don't allow updates to completed or reversed transactions
    if (
      transaction.status === TransactionStatus.COMPLETED ||
      transaction.status === TransactionStatus.REVERSED
    ) {
      throw new BadRequestException('Cannot update completed or reversed transactions');
    }

    Object.assign(transaction, updateTransactionDto);
    transaction.updatedAt = new Date();

    return this.transactionRepository.save(transaction);
  }

  async process(id: string, gatewayResponse?: Record<string, any>): Promise<Transaction> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const transaction = await queryRunner.manager.findOne(Transaction, {
        where: { id },
      });

      if (!transaction) {
        throw new NotFoundException('Transaction not found');
      }

      if (transaction.status !== TransactionStatus.PENDING) {
        throw new BadRequestException('Transaction is not in pending status');
      }

      transaction.status = TransactionStatus.PROCESSING;
      transaction.gatewayResponse = gatewayResponse;

      // Simulate payment processing (in real app, integrate with payment gateway)
      const processed = await this.processWithGateway(transaction);

      if (processed.success) {
        transaction.status = TransactionStatus.COMPLETED;
        transaction.processedAt = new Date();
      } else {
        transaction.status = TransactionStatus.FAILED;
        transaction.failureReason = processed.error;
      }

      const updated = await queryRunner.manager.save(transaction);
      
      await queryRunner.commitTransaction();
      
      return updated;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async reverse(id: string, reason: string): Promise<Transaction> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const transaction = await queryRunner.manager.findOne(Transaction, {
        where: { id },
      });

      if (!transaction) {
        throw new NotFoundException('Transaction not found');
      }

      if (transaction.status !== TransactionStatus.COMPLETED) {
        throw new BadRequestException('Can only reverse completed transactions');
      }

      // Create reversal transaction
      const reversalTransaction = queryRunner.manager.create(Transaction, {
        type: transaction.type === TransactionType.PAYMENT 
          ? TransactionType.REFUND 
          : TransactionType.PAYMENT,
        status: TransactionStatus.COMPLETED,
        orderId: transaction.orderId,
        customerId: transaction.customerId,
        organizationId: transaction.organizationId,
        amount: transaction.amount,
        currency: transaction.currency,
        paymentMethod: transaction.paymentMethod,
        referenceNumber: `REV-${transaction.referenceNumber}`,
        description: `Reversal of ${transaction.referenceNumber}: ${reason}`,
        processedAt: new Date(),
        metadata: {
          originalTransactionId: transaction.id,
          reversalReason: reason,
        },
      });

      await queryRunner.manager.save(reversalTransaction);

      // Update original transaction
      transaction.status = TransactionStatus.REVERSED;
      transaction.metadata = {
        ...transaction.metadata,
        reversalTransactionId: reversalTransaction.id,
        reversalReason: reason,
      };

      // Update customer balance
      if (transaction.type === TransactionType.PAYMENT) {
        await this.customersService.updateBalance(
          transaction.customerId,
          transaction.amount,
          'add',
        );
      } else if (transaction.type === TransactionType.REFUND) {
        await this.customersService.updateBalance(
          transaction.customerId,
          transaction.amount,
          'subtract',
        );
      }

      const updated = await queryRunner.manager.save(transaction);
      
      await queryRunner.commitTransaction();
      
      return updated;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getSummary(
    organizationId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<TransactionSummary> {
    const query = this.transactionRepository.createQueryBuilder('transaction');
    
    query.where('transaction.organizationId = :organizationId', { organizationId });

    if (startDate && endDate) {
      query.andWhere('transaction.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    // Get total transactions and amount
    const totals = await query
      .select('COUNT(*)', 'totalTransactions')
      .addSelect('COALESCE(SUM(transaction.amount), 0)', 'totalAmount')
      .getRawOne();

    // Get breakdown by type
    const typeBreakdown = await query
      .select('transaction.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(transaction.amount), 0)', 'amount')
      .groupBy('transaction.type')
      .getRawMany();

    const transactionsByType = typeBreakdown.reduce((acc, curr) => {
      acc[curr.type] = {
        count: parseInt(curr.count),
        amount: parseFloat(curr.amount),
      };
      return acc;
    }, {} as Record<TransactionType, { count: number; amount: number }>);

    // Get breakdown by status
    const statusBreakdown = await query
      .select('transaction.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('transaction.status')
      .getRawMany();

    const transactionsByStatus = statusBreakdown.reduce((acc, curr) => {
      acc[curr.status] = parseInt(curr.count);
      return acc;
    }, {} as Record<TransactionStatus, number>);

    // Get payment method breakdown
    const paymentMethodBreakdown = await query
      .select('transaction.paymentMethod', 'method')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(transaction.amount), 0)', 'amount')
      .where('transaction.paymentMethod IS NOT NULL')
      .groupBy('transaction.paymentMethod')
      .getRawMany();

    const paymentMethodBreakdownResult = paymentMethodBreakdown.reduce((acc, curr) => {
      acc[curr.method] = {
        count: parseInt(curr.count),
        amount: parseFloat(curr.amount),
      };
      return acc;
    }, {} as Record<PaymentMethod, { count: number; amount: number }>);

    return {
      totalTransactions: parseInt(totals.totalTransactions),
      totalAmount: parseFloat(totals.totalAmount),
      transactionsByType,
      transactionsByStatus,
      paymentMethodBreakdown: paymentMethodBreakdownResult,
    };
  }

  private async getTotalPaidForOrder(orderId: string): Promise<number> {
    const result = await this.transactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.orderId = :orderId', { orderId })
      .andWhere('transaction.type = :type', { type: TransactionType.PAYMENT })
      .andWhere('transaction.status = :status', { status: TransactionStatus.COMPLETED })
      .select('COALESCE(SUM(transaction.amount), 0)', 'total')
      .getRawOne();

    return parseFloat(result.total);
  }

  private async generateReferenceNumber(type: TransactionType): Promise<string> {
    const prefix = type === TransactionType.PAYMENT ? 'PAY' : 
                  type === TransactionType.REFUND ? 'REF' : 'TXN';
    
    const date = new Date();
    const timestamp = date.getTime().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    return `${prefix}-${timestamp}-${random}`;
  }

  private async processWithGateway(
    transaction: Transaction,
  ): Promise<{ success: boolean; error?: string }> {
    // Simulate payment gateway processing
    // In real application, integrate with actual payment gateway
    
    // For demo purposes, randomly succeed/fail
    const success = Math.random() > 0.1; // 90% success rate
    
    if (!success) {
      return {
        success: false,
        error: 'Payment declined by issuing bank',
      };
    }

    return { success: true };
  }
}