import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';
import { AttributeType, AttributeCategory } from '@saas-template/shared';
import { Organization } from '@/modules/organizations/entities/organization.entity';

@Entity('attribute_definitions')
@Index(['category', 'isSystem'])
@Index(['organizationId', 'name'], { unique: true, where: 'organization_id IS NOT NULL' })
@Index(['key'], { unique: true })
export class AttributeDefinition extends BaseEntity {
  @Column({ type: 'varchar', length: 255, unique: true })
  key: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    type: 'enum',
    enum: AttributeCategory,
  })
  category: AttributeCategory;

  @Column({
    type: 'enum',
    enum: AttributeType,
  })
  type: AttributeType;

  @Column({
    type: 'enum',
    enum: AttributeType,
    name: 'data_type',
  })
  dataType: AttributeType;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', nullable: true })
  possibleValues?: any[];

  @Column({ type: 'jsonb', nullable: true })
  allowedValues?: string[];

  @Column({ type: 'jsonb', nullable: true })
  defaultValue?: any;

  @Column({ type: 'boolean', default: false })
  isRequired: boolean;

  @Column({ type: 'boolean', default: false })
  isSystem: boolean;

  @Column({ type: 'uuid', nullable: true })
  organizationId?: string;

  @ManyToOne(() => Organization, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization?: Organization;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;
}
