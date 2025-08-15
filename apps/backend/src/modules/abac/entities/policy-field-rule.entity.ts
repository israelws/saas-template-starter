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

/**
 * Types of field-level permissions
 * @enum {string} FieldPermissionType
 */
export enum FieldPermissionType {
  /** Allows reading the field value */
  READ = 'read',
  /** Allows modifying the field value */
  WRITE = 'write',
  /** Explicitly denies access to the field (overrides READ/WRITE) */
  DENY = 'deny',
}

/**
 * Entity representing field-level permission rules within ABAC policies
 * Allows fine-grained control over which fields users can access on resources
 *
 * @class PolicyFieldRule
 * @entity policy_field_rules
 *
 * @example
 * ```typescript
 * // Example rule: Allow reading customer email but not SSN
 * const rule = {
 *   resourceType: 'Customer',
 *   fieldName: 'email',
 *   permission: FieldPermissionType.READ,
 *   conditions: { userRole: 'agent' }
 * }
 * ```
 */
@Entity('policy_field_rules')
@Index(['policyId', 'resourceType', 'fieldName'])
export class PolicyFieldRule {
  /**
   * Unique identifier for the field rule
   * @type {string}
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * ID of the parent policy
   * @type {string}
   */
  @Column({ name: 'policy_id' })
  policyId: string;

  /**
   * Reference to the parent policy
   * Cascade deletes when policy is removed
   * @type {Policy}
   */
  @ManyToOne(() => Policy, (policy) => policy.fieldRules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'policy_id' })
  policy: Policy;

  /**
   * Type of resource this rule applies to
   * @type {string}
   * @example 'Customer', 'Product', 'Order'
   */
  @Column({ name: 'resource_type', length: 100 })
  resourceType: string;

  /**
   * Name of the field this rule controls
   * @type {string}
   * @example 'ssn', 'creditScore', 'salary'
   */
  @Column({ name: 'field_name', length: 100 })
  fieldName: string;

  /**
   * Type of permission granted or denied for this field
   * @type {FieldPermissionType}
   */
  @Column({
    type: 'enum',
    enum: FieldPermissionType,
    comment: 'read, write, or deny',
  })
  permission: FieldPermissionType;

  /**
   * Optional conditions that must be met for this rule to apply
   * Can include user attributes, resource attributes, or environment conditions
   * @type {Record<string, any>}
   * @example { "userRole": "manager", "department": "${user.department}" }
   */
  @Column({ type: 'jsonb', nullable: true })
  conditions: Record<string, any>;

  /**
   * Timestamp when this field rule was created
   * @type {Date}
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
