import {
  Entity,
  Column,
  Tree,
  TreeParent,
  TreeChildren,
  Index,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';
import { OrganizationType, OrganizationSettings } from '@saas-template/shared';
import { UserOrganizationMembership } from '@/modules/users/entities/user-organization-membership.entity';
import { Policy } from '@/modules/abac/entities/policy.entity';
import { Product } from '@/modules/products/entities/product.entity';
import { Customer } from '@/modules/customers/entities/customer.entity';
import { Order } from '@/modules/orders/entities/order.entity';

@Entity('organizations')
@Tree('closure-table')
@Index(['type', 'isActive'])
@Index(['code'], { unique: true, where: 'code IS NOT NULL' })
export class Organization extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    type: 'enum',
    enum: OrganizationType,
    default: OrganizationType.COMPANY,
  })
  type: OrganizationType;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 50, nullable: true, unique: true })
  code?: string;

  @TreeParent()
  parent?: Organization;

  @TreeChildren()
  children: Organization[];

  // Virtual property to expose parentId
  parentId?: string;

  @Column({ type: 'jsonb', nullable: true })
  settings?: OrganizationSettings;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  path?: string;

  // Relations
  @OneToMany(() => UserOrganizationMembership, (membership) => membership.organization)
  memberships: UserOrganizationMembership[];

  @OneToMany(() => Policy, (policy) => policy.organization)
  policies: Policy[];

  @OneToMany(() => Product, (product) => product.organization)
  products: Product[];

  @OneToMany(() => Customer, (customer) => customer.organization)
  customers: Customer[];

  @OneToMany(() => Order, (order) => order.organization)
  orders: Order[];
}