import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';

export enum EmailServiceProvider {
  OFFICE365 = 'office365',
  SENDGRID = 'sendgrid',
  TWILIO = 'twilio',
  AWS_SES = 'aws-ses',
  SMTP = 'smtp',
}

@Entity('email_service_configs')
@Index(['provider', 'organizationId'], { unique: true })
@Index(['provider'], { where: '"organizationId" IS NULL' })
export class EmailServiceConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: EmailServiceProvider,
  })
  provider: EmailServiceProvider;

  @Column({ type: 'uuid', nullable: true })
  organizationId?: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'organizationId' })
  organization?: Organization;

  @Column({ type: 'jsonb' })
  config: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  enabled: boolean;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  @Column({ type: 'boolean', default: false })
  isGlobalDefault: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastTestAt?: Date;

  @Column({ type: 'boolean', nullable: true })
  lastTestSuccess?: boolean;

  @Column({ type: 'text', nullable: true })
  lastTestError?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  updatedBy?: string;
}
