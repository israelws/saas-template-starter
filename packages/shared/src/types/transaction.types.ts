import { BaseEntity } from './common.types';
import { Order } from './order.types';

export enum TransactionType {
  PAYMENT = 'payment',
  REFUND = 'refund',
  ADJUSTMENT = 'adjustment',
  CREDIT = 'credit',
  DEBIT = 'debit',
}

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REVERSED = 'reversed',
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  BANK_TRANSFER = 'bank_transfer',
  PAYPAL = 'paypal',
  STRIPE = 'stripe',
  CHECK = 'check',
  CASH = 'cash',
  OTHER = 'other',
}

export interface Transaction extends BaseEntity {
  type: TransactionType;
  status: TransactionStatus;
  orderId?: string;
  order?: Order;
  customerId: string;
  organizationId: string;
  amount: number;
  currency: string;
  paymentMethod?: PaymentMethod;
  referenceNumber?: string;
  description?: string;
  processedAt?: Date;
  failureReason?: string;
  gatewayResponse?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface CreateTransactionDto {
  type: TransactionType;
  orderId?: string;
  customerId: string;
  organizationId: string;
  amount: number;
  currency: string;
  paymentMethod?: PaymentMethod;
  referenceNumber?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface UpdateTransactionDto extends Partial<Omit<CreateTransactionDto, 'type' | 'orderId' | 'customerId' | 'organizationId'>> {
  status?: TransactionStatus;
  processedAt?: Date;
  failureReason?: string;
  gatewayResponse?: Record<string, any>;
}

export interface TransactionSummary {
  totalTransactions: number;
  totalAmount: number;
  transactionsByType: Record<TransactionType, {
    count: number;
    amount: number;
  }>;
  transactionsByStatus: Record<TransactionStatus, number>;
  paymentMethodBreakdown: Record<PaymentMethod, {
    count: number;
    amount: number;
  }>;
}