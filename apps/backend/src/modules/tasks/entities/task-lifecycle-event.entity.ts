import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { TaskType } from './task-type.entity';

@Entity('task_lifecycle_events')
export class TaskLifecycleEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  taskTypeId: string;

  @ManyToOne(() => TaskType, (taskType) => taskType.lifecycleEvents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'taskTypeId' })
  taskType: TaskType;

  @Column({ type: 'int' })
  order: number;

  @Column({ nullable: true })
  color: string;

  @Column({ nullable: true })
  icon: string;

  @Column({ default: false })
  isFinal: boolean;

  @Column({ default: false })
  isInitial: boolean;

  @Column({ type: 'jsonb', nullable: true })
  allowedTransitions: string[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}