import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Workflow } from './workflow.entity';

@Entity('workflow_bindings')
export class WorkflowBinding {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  workflowId: string;

  @ManyToOne(() => Workflow, (workflow) => workflow.bindings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflowId' })
  workflow: Workflow;

  @Column({ type: 'varchar', length: 50 })
  entityType: string; // task_type, order_status, etc.

  @Column({ type: 'uuid', nullable: true })
  entityId: string; // Specific task_type_id, etc.

  @Column({ type: 'varchar', length: 100 })
  eventName: string; // lifecycle_changed, assigned, etc.

  @Column({ type: 'jsonb', nullable: true })
  condition: Record<string, any>; // Additional conditions for triggering

  @Column({ type: 'int', default: 0 })
  priority: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}