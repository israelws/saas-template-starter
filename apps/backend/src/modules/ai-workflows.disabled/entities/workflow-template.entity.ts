import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { User } from '../../users/entities/user.entity';

export enum WorkflowCategory {
  CHAT = 'chat',
  AGENT = 'agent',
  RAG = 'rag',
  AUTOMATION = 'automation',
  DATA_PROCESSING = 'data_processing',
  ANALYSIS = 'analysis',
  CUSTOM = 'custom',
}

export interface TemplateFlowDefinition {
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: any;
  }>;
  edges: Array<{
    id: string;
    source: string;
    sourceHandle?: string;
    target: string;
    targetHandle?: string;
    type?: string;
    data?: any;
  }>;
  flowState?: Record<string, any>;
  variables?: Record<string, any>;
}

export interface RequiredCredential {
  type: string;
  name: string;
  description?: string;
  optional?: boolean;
}

@Entity('workflow_templates')
export class WorkflowTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'varchar',
    length: 50,
    enum: WorkflowCategory,
  })
  category: WorkflowCategory;

  @Column('text', { array: true, default: '{}' })
  tags: string[];

  @Column({ type: 'varchar', length: 100, nullable: true })
  icon: string;

  @Column({ type: 'jsonb' })
  flowDefinition: TemplateFlowDefinition;

  @Column({ type: 'jsonb', nullable: true })
  inputSchema: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  outputSchema: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  requiredCredentials: RequiredCredential[];

  @Column({ type: 'boolean', default: false })
  isPublic: boolean;

  @Column({ type: 'int', default: 0 })
  usageCount: number;

  @Column({ nullable: true })
  organizationId: string;

  @ManyToOne(() => Organization, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column({ nullable: true })
  createdById: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}