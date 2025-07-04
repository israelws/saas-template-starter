import { Entity, Column, Index, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';
import {
  CustomerType,
  CustomerStatus,
  Address,
  ContactInfo,
  CustomerPreferences,
} from '@saas-template/shared';
import { Organization } from '@/modules/organizations/entities/organization.entity';
import { Order } from '@/modules/orders/entities/order.entity';
import { Transaction } from '@/modules/transactions/entities/transaction.entity';

@Entity('customers')
@Index(['organizationId', 'status'])
@Index(['email', 'organizationId'])
@Index(['type'])
export class Customer extends BaseEntity {
  @Column({
    type: 'enum',
    enum: CustomerType,
  })
  type: CustomerType;

  @Column({
    type: 'enum',
    enum: CustomerStatus,
    default: CustomerStatus.ACTIVE,
  })
  status: CustomerStatus;

  @Column({ type: 'uuid' })
  organizationId: string;

  @ManyToOne(() => Organization, (organization) => organization.customers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  // Individual customer fields
  @Column({ type: 'varchar', length: 100, nullable: true })
  firstName?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lastName?: string;

  // Business customer fields
  @Column({ type: 'varchar', length: 255, nullable: true })
  companyName?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  taxId?: string;

  // Common fields
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'jsonb', nullable: true })
  contactInfo?: ContactInfo;

  @Column({ type: 'jsonb', nullable: true })
  billingAddress?: Address;

  @Column({ type: 'jsonb', nullable: true })
  shippingAddress?: Address;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  creditLimit?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  balance: number;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  @Column({ type: 'jsonb', nullable: true })
  preferences?: CustomerPreferences;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  // Relations
  @OneToMany(() => Order, (order) => order.customer)
  orders: Order[];

  @OneToMany(() => Transaction, (transaction) => transaction.customer)
  transactions: Transaction[];
}