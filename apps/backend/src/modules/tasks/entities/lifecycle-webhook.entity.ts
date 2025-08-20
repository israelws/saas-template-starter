import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { TaskLifecycleEvent } from './task-lifecycle-event.entity';
import { WebhookLog } from './webhook-log.entity';

export enum WebhookAuthType {
  BEARER = 'bearer',
  BASIC = 'basic',
  API_KEY = 'api-key',
  CUSTOM = 'custom',
}

export enum WebhookMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

export interface WebhookRetryConfig {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
}

export interface WebhookAuthConfig {
  token?: string;
  username?: string;
  password?: string;
  apiKey?: string;
  apiKeyHeader?: string;
  customHeaders?: Record<string, string>;
}

@Entity('lifecycle_webhooks')
export class LifecycleWebhook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  lifecycleEventId: string;

  @ManyToOne(() => TaskLifecycleEvent, (event) => event.webhooks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'lifecycleEventId' })
  lifecycleEvent: TaskLifecycleEvent;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text' })
  url: string;

  @Column({
    type: 'varchar',
    length: 10,
    default: WebhookMethod.POST,
  })
  method: WebhookMethod;

  @Column({ type: 'jsonb', nullable: true })
  headers: Record<string, string>;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  authType: WebhookAuthType;

  @Column({ type: 'jsonb', nullable: true })
  authConfig: WebhookAuthConfig;

  @Column({
    type: 'jsonb',
    nullable: true,
    default: () => "'{ \"maxRetries\": 3, \"retryDelay\": 1000, \"backoffMultiplier\": 2 }'",
  })
  retryConfig: WebhookRetryConfig;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: true })
  includeContext: boolean;

  @Column({ type: 'boolean', default: true })
  includeAuth: boolean;

  @Column({ type: 'jsonb', nullable: true })
  customPayload: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true })
  lastTriggeredAt: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  lastStatus: string;

  @Column({ type: 'text', nullable: true })
  lastError: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @OneToMany(() => WebhookLog, (log) => log.webhook)
  logs: WebhookLog[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}