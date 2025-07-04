import { Entity, Column, Index, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';
import {
  ProductStatus,
  ProductCategory,
  ProductAttributes,
  ProductInventory,
} from '@saas-template/shared';
import { Organization } from '@/modules/organizations/entities/organization.entity';
import { OrderItem } from '@/modules/orders/entities/order-item.entity';

@Entity('products')
@Index(['organizationId', 'status'])
@Index(['sku', 'organizationId'], { unique: true })
@Index(['category'])
export class Product extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  sku: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: ProductCategory,
    default: ProductCategory.OTHER,
  })
  category: ProductCategory;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.DRAFT,
  })
  status: ProductStatus;

  @Column({ type: 'uuid' })
  organizationId: string;

  @ManyToOne(() => Organization, (organization) => organization.products, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column({ type: 'jsonb', nullable: true })
  attributes?: ProductAttributes;

  @Column({ type: 'jsonb', nullable: true })
  inventory?: ProductInventory;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  // Relations
  @OneToMany(() => OrderItem, (orderItem) => orderItem.product)
  orderItems: OrderItem[];
}