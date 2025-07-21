import { Entity, Column, Index, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';
import {
  PolicyEffect,
  PolicySubjects,
  PolicyResources,
  PolicyConditions,
} from '@saas-template/shared';
import { Organization } from '@/modules/organizations/entities/organization.entity';
import { PolicySet } from './policy-set.entity';
import { PolicyFieldRule } from './policy-field-rule.entity';

@Entity('policies')
@Index(['organizationId', 'isActive'])
@Index(['priority'])
@Index(['policySetId'])
export class Policy extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: PolicyEffect,
    default: PolicyEffect.ALLOW,
  })
  effect: PolicyEffect;

  @Column({ type: 'int', default: 100 })
  priority: number;

  @Column({ type: 'jsonb' })
  subjects: PolicySubjects;

  @Column({ type: 'jsonb' })
  resources: PolicyResources;

  @Column({ type: 'text', array: true })
  actions: string[];

  @Column({ type: 'jsonb', nullable: true })
  conditions?: PolicyConditions;

  @Column({ type: 'uuid' })
  organizationId: string;

  @ManyToOne(() => Organization, (organization) => organization.policies, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column({ type: 'uuid', nullable: true })
  policySetId?: string;

  @ManyToOne(() => PolicySet, (policySet) => policySet.policies, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'policySetId' })
  policySet?: PolicySet;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ 
    name: 'field_permissions',
    type: 'jsonb', 
    nullable: true,
    comment: 'Field-level permissions configuration'
  })
  fieldPermissions?: Record<string, any>;

  @OneToMany(() => PolicyFieldRule, fieldRule => fieldRule.policy)
  fieldRules: PolicyFieldRule[];
}