import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { User } from '../../users/entities/user.entity';
import { InsuranceAgent } from './insurance-agent.entity';
import { InsuranceType, BranchAddress, OperatingHours } from '@saas-template/shared';

/**
 * Entity representing an insurance branch
 * @class InsuranceBranch
 * @entity insurance_branches
 */
@Entity('insurance_branches')
@Index(['organizationId'])
@Index(['branchCode'], { unique: true })
@Index(['managerId'])
export class InsuranceBranch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'branch_code', unique: true })
  branchCode: string;

  @Column({ name: 'branch_name' })
  branchName: string;

  @Column({ name: 'manager_id', nullable: true })
  managerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'manager_id' })
  manager: User;

  @Column({ type: 'jsonb' })
  address: BranchAddress;

  @Column({ name: 'phone_number' })
  phoneNumber: string;

  @Column()
  email: string;

  @Column({ name: 'operating_hours', type: 'jsonb' })
  operatingHours: OperatingHours;

  @Column({
    name: 'service_types',
    type: 'simple-array',
  })
  serviceTypes: InsuranceType[];

  @Column({
    name: 'territory_ids',
    type: 'simple-array',
    nullable: true,
  })
  territoryIds: string[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => InsuranceAgent, (agent) => agent.branch)
  agents: InsuranceAgent[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
