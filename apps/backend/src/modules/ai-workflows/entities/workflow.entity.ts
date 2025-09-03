import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { User } from '../../users/entities/user.entity';
import { WorkflowExecution } from './workflow-execution.entity';
import { WorkflowBinding } from './workflow-binding.entity';
import { WorkflowDocument } from './workflow-document.entity';

export enum WorkflowTriggerType {
  MANUAL = 'manual',
  EVENT = 'event',
  SCHEDULED = 'scheduled',
  API = 'api',
}

export interface FlowDefinition {
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: any;
    state?: any; // Runtime state for the node
  }>;
  edges: Array<{
    id: string;
    source: string;
    sourceHandle?: string;
    target: string;
    targetHandle?: string;
    type?: string; // 'default' | 'conditional' | 'loop'
    data?: any;
  }>;
}

export interface ChatbotConfig {
  enabled: boolean;
  welcomeMessage?: string;
  placeholder?: string;
  theme?: 'light' | 'dark' | 'auto';
  allowFileUpload?: boolean;
  maxFileSize?: number;
  allowedFileTypes?: string[];
  streamingEnabled?: boolean;
  showTypingIndicator?: boolean;
  persistConversation?: boolean;
  maxConversationLength?: number;
}

@Entity('ai_workflows')
export class Workflow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'varchar',
    length: 50,
    enum: WorkflowTriggerType,
    default: WorkflowTriggerType.MANUAL,
  })
  triggerType: WorkflowTriggerType;

  @Column({ type: 'varchar', length: 50, nullable: true })
  entityType: string; // task, order, customer, etc.

  @Column({ type: 'jsonb' })
  flowDefinition: FlowDefinition;

  @Column({ type: 'jsonb', nullable: true })
  inputSchema: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  outputSchema: Record<string, any>;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isTemplate: boolean;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ nullable: true })
  createdById: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'varchar', length: 50, nullable: true })
  category: string;

  @Column('text', { array: true, nullable: true, default: '{}' })
  tags: string[];

  @Column({ type: 'jsonb', nullable: true })
  flowState: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  variables: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  chatbotConfig: ChatbotConfig;

  @OneToMany(() => WorkflowExecution, (execution) => execution.workflow)
  executions: WorkflowExecution[];

  @OneToMany(() => WorkflowBinding, (binding) => binding.workflow)
  bindings: WorkflowBinding[];

  @OneToMany(() => WorkflowDocument, (document) => document.workflow)
  documents: WorkflowDocument[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}