import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Policy } from './policy.entity';

export enum FieldPermissionType {
  READ = 'read',
  WRITE = 'write',
  DENY = 'deny',
}

@Entity('policy_field_rules')
@Index(['policyId', 'resourceType', 'fieldName'])
export class PolicyFieldRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'policy_id' })
  policyId: string;

  @ManyToOne(() => Policy, policy => policy.fieldRules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'policy_id' })
  policy: Policy;

  @Column({ name: 'resource_type', length: 100 })
  resourceType: string;

  @Column({ name: 'field_name', length: 100 })
  fieldName: string;

  @Column({ 
    type: 'enum',
    enum: FieldPermissionType,
    comment: 'read, write, or deny'
  })
  permission: FieldPermissionType;

  @Column({ type: 'jsonb', nullable: true })
  conditions: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}