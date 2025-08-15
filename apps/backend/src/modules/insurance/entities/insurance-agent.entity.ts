import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { InsuranceBranch } from './insurance-branch.entity';
import { InsuranceType, LicenseStatus } from '@saas-template/shared';

/**
 * Entity representing an insurance agent
 * @class InsuranceAgent
 * @entity insurance_agents
 */
@Entity('insurance_agents')
@Index(['userId'])
@Index(['branchId'])
@Index(['agentCode'], { unique: true })
@Index(['licenseNumber'])
export class InsuranceAgent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'branch_id' })
  branchId: string;

  @ManyToOne(() => InsuranceBranch, (branch) => branch.agents)
  @JoinColumn({ name: 'branch_id' })
  branch: InsuranceBranch;

  @Column({ name: 'agent_code', unique: true })
  agentCode: string;

  @Column({ name: 'license_number' })
  licenseNumber: string;

  @Column({
    name: 'license_type',
    type: 'simple-array',
  })
  licenseType: InsuranceType[];

  @Column({
    name: 'license_status',
    type: 'enum',
    enum: LicenseStatus,
    default: LicenseStatus.PENDING,
  })
  licenseStatus: LicenseStatus;

  @Column({ name: 'license_expiry_date', type: 'timestamp' })
  licenseExpiryDate: Date;

  @Column({
    name: 'commission_rate',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  commissionRate: number;

  @Column({
    name: 'specializations',
    type: 'simple-array',
    nullable: true,
  })
  specializations: InsuranceType[];

  @Column({
    name: 'territory_ids',
    type: 'simple-array',
    nullable: true,
  })
  territoryIds: string[];

  @Column({
    name: 'performance_metrics',
    type: 'jsonb',
    nullable: true,
  })
  performanceMetrics: {
    totalPoliciesSold: number;
    totalPremiumVolume: number;
    averagePolicyValue: number;
    customerRetentionRate: number;
    lastUpdated: Date;
  };

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
