import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { TaskLifecycleEvent } from './task-lifecycle-event.entity';
import { Task } from './task.entity';

export enum TaskTypeScope {
  SYSTEM = 'system',
  ORGANIZATION = 'organization',
}

@Entity('task_types')
export class TaskType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: TaskTypeScope,
    default: TaskTypeScope.ORGANIZATION,
  })
  scope: TaskTypeScope;

  @Column({ nullable: true })
  organizationId: string;

  @ManyToOne(() => Organization, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  icon: string;

  @Column({ nullable: true })
  color: string;

  @OneToMany(() => TaskLifecycleEvent, (event) => event.taskType)
  lifecycleEvents: TaskLifecycleEvent[];

  @OneToMany(() => Task, (task) => task.taskType)
  tasks: Task[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}