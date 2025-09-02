import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Workflow } from './workflow.entity';

export enum WorkflowExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('workflow_executions')
export class WorkflowExecution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  workflowId: string;

  @ManyToOne(() => Workflow, (workflow) => workflow.executions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflowId' })
  workflow: Workflow;

  @Column({ type: 'varchar', length: 50, nullable: true })
  triggerEntityType: string; // task, order, customer, etc.

  @Column({ type: 'uuid', nullable: true })
  triggerEntityId: string; // ID of the triggering entity

  @Column({ type: 'varchar', length: 100, nullable: true })
  triggerEvent: string; // status_changed, created, etc.

  @Column({
    type: 'varchar',
    length: 20,
    enum: WorkflowExecutionStatus,
    default: WorkflowExecutionStatus.PENDING,
  })
  status: WorkflowExecutionStatus;

  @Column({ type: 'jsonb', nullable: true })
  inputData: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  outputData: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  executionLog: Array<{
    timestamp: Date;
    nodeId: string;
    status: string;
    message: string;
    data?: any;
  }>;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}