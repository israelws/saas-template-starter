import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { LifecycleWebhook } from './lifecycle-webhook.entity';
import { Task } from './task.entity';

@Entity('webhook_logs')
export class WebhookLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  webhookId: string;

  @ManyToOne(() => LifecycleWebhook, (webhook) => webhook.logs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'webhookId' })
  webhook: LifecycleWebhook;

  @Column({ type: 'uuid', nullable: true })
  taskId: string;

  @ManyToOne(() => Task, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'taskId' })
  task: Task;

  @Column({ type: 'varchar', length: 100 })
  eventType: string;

  @Column({ type: 'text' })
  url: string;

  @Column({ type: 'varchar', length: 10 })
  method: string;

  @Column({ type: 'jsonb', nullable: true })
  requestHeaders: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  requestBody: Record<string, any>;

  @Column({ type: 'integer', nullable: true })
  responseStatus: number;

  @Column({ type: 'jsonb', nullable: true })
  responseHeaders: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  responseBody: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  error: string;

  @Column({ type: 'integer', nullable: true })
  duration: number;

  @Column({ type: 'integer', default: 0 })
  retryCount: number;

  @Column({ type: 'boolean', default: false })
  success: boolean;

  @CreateDateColumn()
  createdAt: Date;
}